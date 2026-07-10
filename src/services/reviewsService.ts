// Mock implementation — replace with Supabase in M1.
import { db, delay, uid } from "./_store";
import type { Review } from "@/types";

export async function createReview(purchaseId: string, rating: number, comment: string): Promise<Review> {
  await delay();
  const purchase = db.purchases.find((p) => p.id === purchaseId);
  if (!purchase) throw new Error("Purchase not found");
  const review: Review = {
    id: uid("r"),
    purchaseId,
    listingId: purchase.listingId,
    buyerId: purchase.buyerId,
    rating,
    comment,
    createdAt: new Date().toISOString(),
  };
  db.reviews.unshift(review);
  const listing = db.listings.find((l) => l.id === purchase.listingId);
  if (listing) {
    const total = listing.avgRating * listing.ratingCount + rating;
    listing.ratingCount += 1;
    listing.avgRating = Number((total / listing.ratingCount).toFixed(2));
  }
  return review;
}

export async function getReviews(listingId: string) {
  await delay();
  return db.reviews.filter((r) => r.listingId === listingId);
}
