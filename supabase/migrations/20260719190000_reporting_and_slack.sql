-- =========================================================
-- Connector #2: Slack admin alerts  +  real listing reporting
-- =========================================================
-- Design: every admin-worthy event already writes a row to public.logs.
-- An AFTER INSERT trigger on public.logs posts the relevant ones
-- (listing_reported, api_failure) to a Slack Incoming Webhook via pg_net
-- (async, non-blocking — a Slack outage never affects the app). The webhook
-- URL and site base URL live in a private, client-inaccessible config table so
-- the secret URL is NOT committed to git (set separately in Lovable).

-- ---------- pg_net (async HTTP from Postgres) ----------
CREATE EXTENSION IF NOT EXISTS pg_net;

-- ---------- private config (secret webhook URL, base URL) ----------
CREATE TABLE IF NOT EXISTS public.private_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL DEFAULT ''
);
-- No grants to anon/authenticated and RLS on with no policy => clients cannot
-- read it through the API. SECURITY DEFINER functions (owner) still can.
REVOKE ALL ON public.private_config FROM anon, authenticated;
GRANT ALL ON public.private_config TO service_role;
ALTER TABLE public.private_config ENABLE ROW LEVEL SECURITY;

-- ---------- report_listing RPC ----------
-- Records a real report and writes the listing_reported log that drives Slack.
CREATE OR REPLACE FUNCTION public.report_listing(
  _listing_id UUID, _reason report_reason, _details TEXT DEFAULT ''
) RETURNS public.reports LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_listing public.listings; v_row public.reports;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'auth_required'; END IF;
  SELECT * INTO v_listing FROM public.listings WHERE id = _listing_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'listing_not_found'; END IF;

  -- One open report per reporter+listing; return the existing one if present.
  SELECT * INTO v_row FROM public.reports
    WHERE listing_id = _listing_id AND reporter_id = auth.uid() AND status = 'open' LIMIT 1;
  IF FOUND THEN RETURN v_row; END IF;

  INSERT INTO public.reports (listing_id, reporter_id, reason, details)
    VALUES (_listing_id, auth.uid(), _reason, COALESCE(_details, ''))
    RETURNING * INTO v_row;

  INSERT INTO public.logs (actor_id, event_type, entity_type, entity_id, level, payload)
    VALUES (auth.uid(), 'listing_reported', 'listing', _listing_id::text, 'warn',
      jsonb_build_object('reason', _reason, 'title', v_listing.title, 'report_id', v_row.id));

  RETURN v_row;
END $$;
GRANT EXECUTE ON FUNCTION public.report_listing(UUID, report_reason, TEXT) TO authenticated;

-- ---------- Slack fan-out trigger ----------
CREATE OR REPLACE FUNCTION public.notify_slack_on_log()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions AS $$
DECLARE v_url TEXT; v_base TEXT; v_text TEXT;
BEGIN
  IF NEW.event_type NOT IN ('listing_reported', 'api_failure') THEN RETURN NEW; END IF;

  SELECT value INTO v_url FROM public.private_config WHERE key = 'slack_webhook_url';
  IF v_url IS NULL OR v_url = '' THEN RETURN NEW; END IF;  -- not configured yet
  SELECT COALESCE(value, '') INTO v_base FROM public.private_config WHERE key = 'app_base_url';

  IF NEW.event_type = 'listing_reported' THEN
    v_text := format(':triangular_flag_on_post: *Listing reported* — %s (%s)',
      COALESCE(NEW.payload->>'title', 'a listing'), COALESCE(NEW.payload->>'reason', 'other'));
    IF COALESCE(v_base, '') <> '' THEN v_text := v_text || format(E'\n%s/admin/reports', v_base); END IF;
  ELSE
    v_text := format(':warning: *API failure* — %s %s: %s',
      COALESCE(NEW.payload->>'provider', 'unknown'),
      COALESCE(NEW.payload->>'feature', NEW.payload->>'email_type', ''),
      COALESCE(NEW.payload->>'reason', ''));
    IF COALESCE(v_base, '') <> '' THEN v_text := v_text || format(E'\n%s/admin/logs', v_base); END IF;
  END IF;

  PERFORM net.http_post(
    url := v_url,
    headers := jsonb_build_object('Content-Type', 'application/json'),
    body := jsonb_build_object('text', v_text)
  );
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_logs_notify_slack ON public.logs;
CREATE TRIGGER trg_logs_notify_slack AFTER INSERT ON public.logs
  FOR EACH ROW EXECUTE FUNCTION public.notify_slack_on_log();
