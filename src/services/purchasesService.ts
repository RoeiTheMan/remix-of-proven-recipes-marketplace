// Mock implementation — replace with Supabase in M1.
import { db, delay, uid, pushLog } from "./_store";
import type { Purchase } from "@/types";

export async function simulatePurchase(listingId: string, buyerId: string): Promise<Purchase> {
  await delay();
  const listing = db.listings.find((l) => l.id === listingId);
  if (!listing) throw new Error("Listing not found");
  const existing = db.purchases.find((p) => p.listingId === listingId && p.buyerId === buyerId && p.status === "completed");
  if (existing) return existing;
  const purchase: Purchase = {
    id: uid("p"),
    buyerId,
    listingId,
    priceCents: listing.priceCents,
    status: "completed",
    purchasedAt: new Date().toISOString(),
  };
  db.purchases.unshift(purchase);
  listing.salesCount += 1;
  pushLog({ eventType: "purchase", actorId: buyerId, entityType: "listing", entityId: listingId, payload: { priceCents: listing.priceCents } });
  return purchase;
}

export async function getPurchases(buyerId: string) {
  await delay();
  return db.purchases
    .filter((p) => p.buyerId === buyerId)
    .map((p) => ({ purchase: p, listing: db.listings.find((l) => l.id === p.listingId)! }));
}

export async function getPurchase(id: string) {
  await delay();
  const purchase = db.purchases.find((p) => p.id === id) ?? null;
  if (!purchase) return null;
  const listing = db.listings.find((l) => l.id === purchase.listingId) ?? null;
  const secret = db.recipeSecrets.find((r) => r.listingId === purchase.listingId) ?? null;
  return { purchase, listing, secret };
}
