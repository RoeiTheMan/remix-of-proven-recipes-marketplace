// Real Lovable Cloud purchases service.
// Purchases can only be created via the simulate_purchase RPC (SECURITY DEFINER,
// no direct insert). Buyer/creator read scope is enforced by RLS.
import { supabase } from "@/integrations/supabase/client";
import type { Purchase, Listing } from "@/types";
import { mapPurchaseRow, mapListingRow, mapRecipeSecretRow } from "./_mappers";
import { getCreatorSummaries } from "./creatorsService";

// buyerId parameter is kept for signature compatibility; the RPC uses auth.uid().
export async function simulatePurchase(listingId: string, _buyerId?: string): Promise<Purchase> {
  const { data, error } = await supabase.rpc("simulate_purchase", { _listing_id: listingId });
  if (error) throw error;
  return mapPurchaseRow(data);
}

export async function getPurchases(
  _buyerId?: string,
): Promise<Array<{ purchase: Purchase; listing: Listing; reviewed: boolean }>> {
  const { data, error } = await supabase
    .from("purchases")
    .select("*, listings(*)")
    .eq("status", "completed")
    .order("created_at", { ascending: false });
  if (error) throw error;
  const rows = data ?? [];
  const creators = await getCreatorSummaries(rows.map((r) => r.listings?.creator_id).filter(Boolean));
  const ids = rows.map((r) => r.id);
  let reviewedIds = new Set<string>();
  if (ids.length) {
    const { data: revs } = await supabase.from("reviews").select("purchase_id").in("purchase_id", ids);
    reviewedIds = new Set((revs ?? []).map((r) => r.purchase_id));
  }
  return rows.map((row) => {
    const listing = { ...mapListingRow(row.listings), creator: creators[row.listings?.creator_id] };
    return {
      purchase: mapPurchaseRow(row),
      listing,
      reviewed: reviewedIds.has(row.id),
    };
  });
}

export async function getExistingPurchase(listingId: string): Promise<Purchase | null> {
  const { data } = await supabase
    .from("purchases")
    .select("*")
    .eq("listing_id", listingId)
    .eq("status", "completed")
    .maybeSingle();
  return data ? mapPurchaseRow(data) : null;
}

export async function getPurchase(id: string) {
  const { data: purchaseRow, error } = await supabase
    .from("purchases")
    .select("*, listings(*)")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!purchaseRow) return null;
  const [{ data: secretRow }, creators, { data: existingReview }] = await Promise.all([
    supabase.from("recipe_secrets").select("*").eq("listing_id", purchaseRow.listing_id).maybeSingle(),
    getCreatorSummaries([purchaseRow.listings?.creator_id]),
    supabase.from("reviews").select("*").eq("purchase_id", id).maybeSingle(),
  ]);
  const listing = { ...mapListingRow(purchaseRow.listings), creator: creators[purchaseRow.listings?.creator_id] };
  return {
    purchase: mapPurchaseRow(purchaseRow),
    listing,
    secret: secretRow ? mapRecipeSecretRow(secretRow) : null,
    existingReview: existingReview
      ? { id: existingReview.id, rating: existingReview.rating, comment: existingReview.comment ?? "" }
      : null,
  };
}

// Recent sales for a creator dashboard. RLS ensures only own listings' sales.
export async function getCreatorRecentSales(
  creatorId: string,
  limit = 10,
): Promise<Array<{ purchase: Purchase; listing: Listing; buyerDisplayName: string }>> {
  const { data } = await supabase
    .from("purchases")
    .select("*, listings!inner(*)")
    .eq("status", "completed")
    .eq("listings.creator_id", creatorId)
    .order("created_at", { ascending: false })
    .limit(limit);
  const rows = data ?? [];
  const buyerIds = Array.from(new Set(rows.map((r) => r.buyer_id)));
  const buyerNames: Record<string, string> = {};
  if (buyerIds.length) {
    const { data: profs } = await supabase
      .from("profiles")
      .select("id, display_name")
      .in("id", buyerIds);
    for (const p of profs ?? []) buyerNames[p.id] = p.display_name || "Buyer";
  }
  return rows.map((row) => ({
    purchase: mapPurchaseRow(row),
    listing: mapListingRow(row.listings),
    buyerDisplayName: privacySafeName(buyerNames[row.buyer_id] || "Buyer"),
  }));
}

// Public reviews with privacy-safe buyer name.
export async function getPublicReviewsWithBuyer(listingId: string) {
  const { data: reviews } = await supabase
    .from("reviews")
    .select("*")
    .eq("listing_id", listingId)
    .order("created_at", { ascending: false });
  const rs = reviews ?? [];
  const buyerIds = Array.from(new Set(rs.map((r) => r.buyer_id)));
  const names: Record<string, string> = {};
  if (buyerIds.length) {
    const { data: profs } = await supabase.from("profiles").select("id, display_name").in("id", buyerIds);
    for (const p of profs ?? []) names[p.id] = p.display_name || "Buyer";
  }
  return rs.map((r) => ({
    id: r.id,
    rating: r.rating,
    comment: r.comment ?? "",
    createdAt: r.created_at,
    buyerDisplayName: privacySafeName(names[r.buyer_id] || "Buyer"),
  }));
}

export function privacySafeName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "Buyer";
  const parts = trimmed.split(/\s+/);
  if (parts.length > 1) return `${parts[0]} ${parts[1][0]}.`;
  if (trimmed.length <= 4) return trimmed;
  return `${trimmed.slice(0, Math.min(6, trimmed.length - 2))}…`;
}
