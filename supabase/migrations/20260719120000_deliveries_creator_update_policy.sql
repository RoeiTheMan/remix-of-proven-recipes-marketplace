-- Allow the accepted creator to UPDATE their delivery row (re-deliver after a
-- buyer requests revisions). Original schema only allowed creator INSERT and
-- buyer status-UPDATE, so revision resubmits were impossible.
-- WITH CHECK pins status to 'delivered' so a creator cannot self-approve.
CREATE POLICY "deliveries: accepted creator updates content" ON public.deliveries FOR UPDATE
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.offers o
      WHERE o.id = deliveries.offer_id AND o.creator_id = auth.uid() AND o.status = 'accepted'
    )
  ) WITH CHECK (
    status = 'delivered'
    AND EXISTS (
      SELECT 1 FROM public.offers o
      WHERE o.id = deliveries.offer_id AND o.creator_id = auth.uid() AND o.status = 'accepted'
    )
  );

-- ROLLBACK:
--   DROP POLICY IF EXISTS "deliveries: accepted creator updates content" ON public.deliveries;
