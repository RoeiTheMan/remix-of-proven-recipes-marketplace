-- =========================================================
-- Resend transactional email — email_events dedup/evidence table
-- =========================================================
-- One row per (purchase, email type). The send-purchase-emails edge function
-- (service role) claims a row BEFORE calling Resend, so the UNIQUE constraint
-- makes duplicate sends impossible across refreshes/retries. Admin-only read;
-- clients can never write (no INSERT/UPDATE grant for authenticated/anon).

CREATE TABLE public.email_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_id UUID NOT NULL REFERENCES public.purchases(id) ON DELETE CASCADE,
  email_type TEXT NOT NULL CHECK (email_type IN ('buyer_purchase_confirmation','creator_sale_notification')),
  recipient_email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','sent','failed')),
  provider_id TEXT,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (purchase_id, email_type)
);

CREATE INDEX ON public.email_events (purchase_id);

GRANT SELECT ON public.email_events TO authenticated;
GRANT ALL ON public.email_events TO service_role;

ALTER TABLE public.email_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "email_events: admin reads" ON public.email_events FOR SELECT
  TO authenticated USING (public.has_role(auth.uid(),'admin'));

CREATE TRIGGER trg_email_events_updated BEFORE UPDATE ON public.email_events
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
