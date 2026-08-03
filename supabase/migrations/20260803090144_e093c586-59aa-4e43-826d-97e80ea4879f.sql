-- Split public policies so anon never needs to execute SECURITY DEFINER helpers
DROP POLICY IF EXISTS "creator_profiles: public non-suspended" ON public.creator_profiles;
CREATE POLICY "creator_profiles: anon reads non-suspended"
  ON public.creator_profiles FOR SELECT TO anon
  USING (is_suspended = false);
CREATE POLICY "creator_profiles: member reads"
  ON public.creator_profiles FOR SELECT TO authenticated
  USING (is_suspended = false OR user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

DROP POLICY IF EXISTS "requests: publicly visible board" ON public.custom_requests;
CREATE POLICY "requests: anon reads open board"
  ON public.custom_requests FOR SELECT TO anon
  USING (status = ANY (ARRAY['open','awarded','delivered','approved']::request_status[]));
CREATE POLICY "requests: member reads board"
  ON public.custom_requests FOR SELECT TO authenticated
  USING (status = ANY (ARRAY['open','awarded','delivered','approved']::request_status[])
         OR buyer_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

DROP POLICY IF EXISTS "listing_images: public when listing visible" ON public.listing_images;
CREATE POLICY "listing_images: anon reads published"
  ON public.listing_images FOR SELECT TO anon
  USING (EXISTS (SELECT 1 FROM public.listings l
                  WHERE l.id = listing_images.listing_id
                    AND l.status = 'published'
                    AND NOT EXISTS (SELECT 1 FROM public.creator_profiles cp
                                     WHERE cp.user_id = l.creator_id AND cp.is_suspended = true)));
CREATE POLICY "listing_images: member reads visible"
  ON public.listing_images FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.listings l
                  WHERE l.id = listing_images.listing_id
                    AND (l.creator_id = auth.uid()
                         OR (l.status = 'published'
                             AND NOT EXISTS (SELECT 1 FROM public.creator_profiles cp
                                              WHERE cp.user_id = l.creator_id AND cp.is_suspended = true))))
         OR public.has_role(auth.uid(),'admin'));

REVOKE ALL ON FUNCTION public.has_role(uuid, app_role) FROM anon, PUBLIC;
REVOKE ALL ON FUNCTION public.is_request_participant(uuid, uuid) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_request_participant(uuid, uuid) TO authenticated;