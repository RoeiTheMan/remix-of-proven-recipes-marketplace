-- =========================================================================
-- Restore the signup trigger lost in the Lovable remix.
--
-- Remixing created a fresh backend: tables, functions, and RLS survived,
-- but triggers on auth.users are not copied. Without on_auth_user_created,
-- new signups get no profile row and no buyer role (verified live on
-- 2026-07-19: signup succeeded, profiles stayed empty).
--
-- Also backfills profiles + buyer roles for any users created while the
-- trigger was missing. Idempotent — safe to run more than once.
-- =========================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email,'@',1)))
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'buyer')
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Backfill users created while the trigger was missing.
INSERT INTO public.profiles (id, display_name)
SELECT u.id, COALESCE(u.raw_user_meta_data->>'display_name', split_part(u.email,'@',1))
FROM auth.users u
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'buyer'::app_role FROM auth.users u
ON CONFLICT (user_id, role) DO NOTHING;

-- =========================================================================
-- ROLLBACK:
--   DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
-- (Backfilled rows are legitimate data; no rollback needed.)
-- =========================================================================
