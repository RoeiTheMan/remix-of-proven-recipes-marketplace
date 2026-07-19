CREATE POLICY "deliveries: accepted creator updates content" ON public.deliveries FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM public.offers o
      WHERE o.id = deliveries.offer_id AND o.creator_id = auth.uid() AND o.status = 'accepted')
  ) WITH CHECK (
    status = 'delivered'
    AND EXISTS (SELECT 1 FROM public.offers o
      WHERE o.id = deliveries.offer_id AND o.creator_id = auth.uid() AND o.status = 'accepted')
  );