-- 1. Restore signup trigger (lost in remix) + backfill existing users
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
INSERT INTO public.profiles (id, display_name)
SELECT u.id, COALESCE(u.raw_user_meta_data->>'display_name', split_part(u.email,'@',1))
FROM auth.users u ON CONFLICT (id) DO NOTHING;
INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'buyer'::app_role FROM auth.users u ON CONFLICT (user_id, role) DO NOTHING;

-- 2. Make my account admin
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role FROM auth.users WHERE email = 'roeilustig@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- 3. Delete the diagnostic test user
DELETE FROM auth.users WHERE email = 'pickture.diagnostic.test@example.com';

-- 4. Security hardening
REVOKE EXECUTE ON FUNCTION public.log_event(log_event_type, TEXT, TEXT, log_level, JSONB) FROM anon;
DROP POLICY IF EXISTS "listing-images: public read" ON storage.objects;
CREATE POLICY "listing-images: visibility-scoped read" ON storage.objects FOR SELECT
  USING (bucket_id = 'listing-images' AND (
    public.has_role(auth.uid(),'admin')
    OR EXISTS (SELECT 1 FROM public.listings l WHERE l.id::text = split_part(name,'/',1) AND l.creator_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.listings l WHERE l.id::text = split_part(name,'/',1) AND l.status='published'
        AND NOT EXISTS (SELECT 1 FROM public.creator_profiles cp WHERE cp.user_id = l.creator_id AND cp.is_suspended))));

-- 5. Enable realtime chat
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='chat_messages') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
  END IF;
END $$;