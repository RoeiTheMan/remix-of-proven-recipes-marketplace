
-- Tighten review inserts: buyer=self, purchase matches buyer+listing+completed,
-- not the listing owner, rating 1..5, comment length >=10 and <=1000. Unique per purchase.
DROP POLICY IF EXISTS "reviews: buyer inserts own after purchase" ON public.reviews;
CREATE POLICY "reviews: buyer inserts own after purchase"
ON public.reviews FOR INSERT TO authenticated
WITH CHECK (
  buyer_id = auth.uid()
  AND rating BETWEEN 1 AND 5
  AND char_length(btrim(comment)) BETWEEN 10 AND 1000
  AND EXISTS (
    SELECT 1 FROM public.purchases p
    WHERE p.id = reviews.purchase_id
      AND p.buyer_id = auth.uid()
      AND p.listing_id = reviews.listing_id
      AND p.status = 'completed'
  )
  AND NOT EXISTS (
    SELECT 1 FROM public.listings l
    WHERE l.id = reviews.listing_id AND l.creator_id = auth.uid()
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS reviews_one_per_purchase ON public.reviews(purchase_id);

-- Notify creator when a review lands.
CREATE OR REPLACE FUNCTION public.reviews_notify_creator()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_creator uuid; v_title text;
BEGIN
  SELECT creator_id, title INTO v_creator, v_title FROM public.listings WHERE id = NEW.listing_id;
  IF v_creator IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, type, payload)
    VALUES (v_creator, 'review', jsonb_build_object(
      'listing_id', NEW.listing_id, 'title', v_title,
      'rating', NEW.rating, 'review_id', NEW.id));
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS reviews_notify_creator_trg ON public.reviews;
CREATE TRIGGER reviews_notify_creator_trg
AFTER INSERT ON public.reviews FOR EACH ROW EXECUTE FUNCTION public.reviews_notify_creator();
