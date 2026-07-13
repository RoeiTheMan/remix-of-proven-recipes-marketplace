// Real Lovable Cloud purchases service.
// Purchases can only be created via the simulate_purchase RPC (SECURITY DEFINER,
// no direct insert). Buyer read scope is enforced by RLS.
import { supabase } from "@/integrations/supabase/client";
import type { Purchase, Listing } from "@/types";
import { mapPurchaseRow, mapListingRow, mapRecipeSecretRow } from "./_mappers";

// buyerId parameter is kept for signature compatibility; the RPC uses auth.uid().
export async function simulatePurchase(listingId: string, _buyerId?: string): Promise<Purchase> {
  const { data, error } = await supabase.rpc("simulate_purchase", { _listing_id: listingId });
  if (error) throw error;
  return mapPurchaseRow(data);
}

export async function getPurchases(_buyerId?: string): Promise<Array<{ purchase: Purchase; listing: Listing }>> {
  const { data, error } = await supabase
    .from("purchases")
    .select("*, listings(*)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => ({
    purchase: mapPurchaseRow(row),
    listing: mapListingRow(row.listings),
  }));
}

export async function getPurchase(id: string) {
  const { data: purchaseRow, error } = await supabase
    .from("purchases")
    .select("*, listings(*)")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!purchaseRow) return null;
  const { data: secretRow } = await supabase
    .from("recipe_secrets")
    .select("*")
    .eq("listing_id", purchaseRow.listing_id)
    .maybeSingle();
  return {
    purchase: mapPurchaseRow(purchaseRow),
    listing: mapListingRow(purchaseRow.listings),
    secret: secretRow ? mapRecipeSecretRow(secretRow) : null,
  };
}
