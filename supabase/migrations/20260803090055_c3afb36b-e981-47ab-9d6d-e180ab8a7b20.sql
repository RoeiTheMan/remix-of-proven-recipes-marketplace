-- 1. Lock down SECURITY DEFINER functions that must never be callable via the API
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.notify_slack_on_log() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.reviews_notify_creator() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.reviews_update_listing_rating() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.report_listing(uuid, report_reason, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.report_listing(uuid, report_reason, text) TO authenticated;

-- 2. private_config: RLS on, no policies, no direct role grants (service role / definer only)
ALTER TABLE public.private_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.private_config FORCE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.private_config FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE public.private_config TO service_role;

-- 3. profiles: unauthenticated visitors only see public creator profiles
DROP POLICY IF EXISTS "profiles readable by anyone" ON public.profiles;
CREATE POLICY "profiles: public creator profiles readable"
  ON public.profiles FOR SELECT TO anon
  USING (EXISTS (SELECT 1 FROM public.creator_profiles cp WHERE cp.user_id = profiles.id));
CREATE POLICY "profiles: signed-in members readable"
  ON public.profiles FOR SELECT TO authenticated
  USING (true);

-- 4. reviews: anonymous readers cannot see purchase linkage identifiers
REVOKE SELECT ON public.reviews FROM anon;
GRANT SELECT (id, listing_id, buyer_id, rating, comment, created_at, updated_at) ON public.reviews TO anon;