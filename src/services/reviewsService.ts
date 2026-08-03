// Real Lovable Cloud reviews service. RLS enforces one review per completed
// purchase, buyer=self, rating 1..5, comment 10..1000, and no self-review.
import { supabase } from "@/integrations/supabase/client";
import type { Review } from "@/types";
import { mapReviewRow } from "./_mappers";

const MIN_COMMENT = 10;
const MAX_COMMENT = 1000;

export async function createReview(purchaseId: string, rating: number, comment: string): Promise<Review> {
  if (rating < 1 || rating > 5) throw new Error("Please choose a rating between 1 and 5 stars.");
  const trimmed = comment.trim();
  if (trimmed.length < MIN_COMMENT)
    throw new Error(`Your review needs at least ${MIN_COMMENT} characters.`);
  if (trimmed.length > MAX_COMMENT)
    throw new Error(`Please keep your review under ${MAX_COMMENT} characters.`);

  const { data: purchase, error: pErr } = await supabase
    .from("purchases")
    .select("id,listing_id,buyer_id,status")
    .eq("id", purchaseId)
    .maybeSingle();
  if (pErr || !purchase) throw new Error("We couldn't find that purchase.");
  if (purchase.status !== "completed")
    throw new Error("Only completed purchases can be reviewed.");

  const { data, error } = await supabase
    .from("reviews")
    .insert({
      purchase_id: purchase.id,
      listing_id: purchase.listing_id,
      buyer_id: purchase.buyer_id,
      rating,
      comment: trimmed,
    })
    .select("*")
    .single();
  if (error) {
    const msg = error.message || "";
    if (msg.includes("reviews_one_per_purchase") || msg.includes("duplicate"))
      throw new Error("You've already reviewed this purchase.");
    if (msg.includes("row-level security"))
      throw new Error("You can't review this recipe.");
    throw new Error("We couldn't publish your review. Please try again.");
  }
  return mapReviewRow(data);
}

export async function getReviews(listingId: string): Promise<Review[]> {
  const { data, error } = await supabase
    .from("reviews")
    // Anonymous visitors may only read public review columns; purchase linkage
    // identifiers are not exposed on the public marketplace.
    .select("id,listing_id,buyer_id,rating,comment,created_at")
    .eq("listing_id", listingId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapReviewRow);
}
