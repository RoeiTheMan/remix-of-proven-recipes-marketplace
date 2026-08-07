DROP POLICY IF EXISTS "profiles: public creator profiles readable" ON public.profiles;
CREATE POLICY "profiles: public creator profiles readable"
ON public.profiles FOR SELECT TO anon
USING (EXISTS (
  SELECT 1 FROM public.creator_profiles cp
  WHERE cp.user_id = profiles.id AND cp.is_suspended = false
));

REVOKE EXECUTE ON FUNCTION public.admin_generate_demo_catalog() FROM PUBLIC, anon, authenticated;