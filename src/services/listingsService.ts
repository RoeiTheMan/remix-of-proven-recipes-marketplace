// Mock implementation — replace with Supabase in M1.
import { db, delay, uid, pushLog } from "./_store";
import type { Listing, RecipeSecret } from "@/types";

export interface ListingFilters {
  q?: string;
  model?: string;
  usageRights?: Listing["usageRights"];
  imageType?: string;
  minPrice?: number;
  maxPrice?: number;
  minConsistency?: number;
  tags?: string[];
}
export type ListingSort = "top_rated" | "price_asc" | "newest" | "best_consistency";

export async function getListings(filters: ListingFilters = {}, sort: ListingSort = "newest", page = 1, pageSize = 24) {
  await delay();
  let out = db.listings.filter((l) => l.status === "published");
  if (filters.q) {
    const q = filters.q.toLowerCase();
    out = out.filter((l) => l.title.toLowerCase().includes(q) || l.styleTags.some((t) => t.includes(q)));
  }
  if (filters.model) out = out.filter((l) => l.model === filters.model);
  if (filters.usageRights) out = out.filter((l) => l.usageRights === filters.usageRights);
  if (filters.imageType) out = out.filter((l) => l.imageType === filters.imageType);
  if (filters.minPrice != null) out = out.filter((l) => l.priceCents >= filters.minPrice!);
  if (filters.maxPrice != null) out = out.filter((l) => l.priceCents <= filters.maxPrice!);
  if (filters.minConsistency != null) out = out.filter((l) => l.consistencyScore >= filters.minConsistency!);
  if (filters.tags?.length) out = out.filter((l) => filters.tags!.every((t) => l.styleTags.includes(t)));

  const sorted = [...out].sort((a, b) => {
    switch (sort) {
      case "top_rated": return b.avgRating - a.avgRating;
      case "price_asc": return a.priceCents - b.priceCents;
      case "best_consistency": return b.consistencyScore - a.consistencyScore;
      case "newest":
      default: return +new Date(b.createdAt) - +new Date(a.createdAt);
    }
  });
  const start = (page - 1) * pageSize;
  return { items: sorted.slice(start, start + pageSize), total: sorted.length };
}

export async function getListing(id: string) {
  await delay();
  const listing = db.listings.find((l) => l.id === id) ?? null;
  const secret = db.recipeSecrets.find((r) => r.listingId === id) ?? null;
  return { listing, secret };
}

export async function getRecipeSecret(id: string): Promise<RecipeSecret | null> {
  await delay();
  return db.recipeSecrets.find((r) => r.listingId === id) ?? null;
}

export async function createListing(draft: Omit<Listing, "id" | "createdAt" | "status" | "avgRating" | "ratingCount" | "salesCount"> & { fullPrompt: string; negativePrompt: string; settings: Record<string, string | number>; usageNotes: string }) {
  await delay();
  const id = uid("l");
  const listing: Listing = {
    id,
    creatorId: draft.creatorId,
    title: draft.title,
    description: draft.description,
    model: draft.model,
    modelVersion: draft.modelVersion,
    aspectRatio: draft.aspectRatio,
    imageType: draft.imageType,
    styleTags: draft.styleTags,
    usageRights: draft.usageRights,
    priceCents: draft.priceCents,
    partialPromptPreview: draft.fullPrompt.slice(0, 80) + "...",
    consistencyScore: draft.consistencyScore ?? 85,
    avgRating: 0,
    ratingCount: 0,
    salesCount: 0,
    status: "published",
    previewImages: draft.previewImages ?? ["ph-1"],
    createdAt: new Date().toISOString(),
  };
  db.listings.unshift(listing);
  db.recipeSecrets.push({
    listingId: id,
    fullPrompt: draft.fullPrompt,
    negativePrompt: draft.negativePrompt,
    settings: draft.settings,
    usageNotes: draft.usageNotes,
  });
  pushLog({ eventType: "prompt_upload", actorId: draft.creatorId, entityType: "listing", entityId: id });
  return listing;
}

export async function removeListing(id: string) {
  await delay();
  const l = db.listings.find((x) => x.id === id);
  if (l) l.status = "removed";
  pushLog({ eventType: "admin_action", entityType: "listing", entityId: id, payload: { action: "remove" } });
  return l ?? null;
}

export async function getListingsByCreator(creatorId: string) {
  await delay();
  return db.listings.filter((l) => l.creatorId === creatorId);
}
