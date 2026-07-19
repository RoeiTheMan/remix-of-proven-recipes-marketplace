ALTER TABLE public.private_config DISABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.notify_slack_on_log()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions AS $$
DECLARE v_url TEXT; v_base TEXT; v_text TEXT;
BEGIN
  IF NEW.event_type NOT IN ('listing_reported', 'api_failure') THEN RETURN NEW; END IF;
  SELECT value INTO v_url FROM public.private_config WHERE key = 'slack_webhook_url';
  IF v_url IS NULL OR v_url = '' THEN RETURN NEW; END IF;
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
  BEGIN
    PERFORM net.http_post(
      url := v_url,
      headers := jsonb_build_object('Content-Type', 'application/json'),
      body := jsonb_build_object('text', v_text)
    );
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_logs_notify_slack ON public.logs;
DROP TRIGGER IF EXISTS trg_notify_slack_on_log ON public.logs;
CREATE TRIGGER trg_logs_notify_slack AFTER INSERT ON public.logs
  FOR EACH ROW EXECUTE FUNCTION public.notify_slack_on_log();