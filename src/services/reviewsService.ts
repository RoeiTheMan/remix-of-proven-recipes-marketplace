// Real Lovable Cloud reviews service. RLS enforces one review per completed purchase.
import { supabase } from "@/integrations/supabase/client";
import type { Review } from "@/types";
import { mapReviewRow } from "./_mappers";

export async function createReview(purchaseId: string, rating: number, comment: string): Promise<Review> {
  const { data: purchase, error: pErr } = await supabase
    .from("purchases")
    .select("id,listing_id,buyer_id")
    .eq("id", purchaseId)
    .maybeSingle();
  if (pErr || !purchase) throw pErr ?? new Error("Purchase not found");
  const { data, error } = await supabase
    .from("reviews")
    .insert({
      purchase_id: purchase.id,
      listing_id: purchase.listing_id,
      buyer_id: purchase.buyer_id,
      rating,
      comment,
    })
    .select("*")
    .single();
  if (error) throw error;
  return mapReviewRow(data);
}

export async function getReviews(listingId: string): Promise<Review[]> {
  const { data, error } = await supabase
    .from("reviews")
    .select("*")
    .eq("listing_id", listingId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapReviewRow);
}
