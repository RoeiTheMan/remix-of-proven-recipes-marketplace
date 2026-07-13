// Real Lovable Cloud listings service.
// Falls back to seed mocks when the database is empty so the M0 UI stays populated
// on a brand-new project. Any real listing hides mocks.
import { supabase } from "@/integrations/supabase/client";
import type { Listing, RecipeSecret } from "@/types";
import { mapListingRow, mapRecipeSecretRow } from "./_mappers";
import * as seeds from "@/mocks";

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

async function fetchImagePaths(listingIds: string[]): Promise<Record<string, string[]>> {
  if (listingIds.length === 0) return {};
  const { data } = await supabase
    .from("listing_images")
    .select("listing_id,storage_path,is_cover,sort_order")
    .in("listing_id", listingIds)
    .order("sort_order");
  const map: Record<string, string[]> = {};
  for (const row of data ?? []) {
    const url = supabase.storage.from("listing-images").getPublicUrl(row.storage_path).data.publicUrl;
    (map[row.listing_id] ??= []).push(url);
  }
  return map;
}

function applyClientFilters(items: Listing[], filters: ListingFilters, sort: ListingSort): Listing[] {
  let out = items;
  if (filters.q) {
    const q = filters.q.toLowerCase();
    out = out.filter((l) => l.title.toLowerCase().includes(q) || l.styleTags.some((t) => t.toLowerCase().includes(q)));
  }
  if (filters.model) out = out.filter((l) => l.model === filters.model);
  if (filters.usageRights) out = out.filter((l) => l.usageRights === filters.usageRights);
  if (filters.imageType) out = out.filter((l) => l.imageType === filters.imageType);
  if (filters.minPrice != null) out = out.filter((l) => l.priceCents >= filters.minPrice!);
  if (filters.maxPrice != null) out = out.filter((l) => l.priceCents <= filters.maxPrice!);
  if (filters.minConsistency != null) out = out.filter((l) => l.consistencyScore >= filters.minConsistency!);
  if (filters.tags?.length) out = out.filter((l) => filters.tags!.every((t) => l.styleTags.includes(t)));
  return [...out].sort((a, b) => {
    switch (sort) {
      case "top_rated": return b.avgRating - a.avgRating;
      case "price_asc": return a.priceCents - b.priceCents;
      case "best_consistency": return b.consistencyScore - a.consistencyScore;
      case "newest":
      default: return +new Date(b.createdAt) - +new Date(a.createdAt);
    }
  });
}

export async function getListings(filters: ListingFilters = {}, sort: ListingSort = "newest", page = 1, pageSize = 24) {
  const { data, error } = await supabase
    .from("listings")
    .select("*")
    .eq("status", "published")
    .order("created_at", { ascending: false });
  if (error) throw error;

  let items: Listing[];
  if (!data || data.length === 0) {
    // Empty DB — surface mock catalog so the UI is populated on new projects.
    items = seeds.listings.filter((l) => l.status === "published");
  } else {
    const imgs = await fetchImagePaths(data.map((r) => r.id));
    items = data.map((r) => mapListingRow(r, imgs[r.id] ?? []));
  }

  const filtered = applyClientFilters(items, filters, sort);
  const start = (page - 1) * pageSize;
  return { items: filtered.slice(start, start + pageSize), total: filtered.length };
}

export async function getListing(id: string) {
  const { data: listing } = await supabase.from("listings").select("*").eq("id", id).maybeSingle();
  if (!listing) {
    const mock = seeds.listings.find((l) => l.id === id) ?? null;
    const secret = mock ? (seeds.recipeSecrets.find((r) => r.listingId === id) ?? null) : null;
    return { listing: mock, secret };
  }
  const imgs = await fetchImagePaths([id]);
  const { data: secretRow } = await supabase
    .from("recipe_secrets")
    .select("*")
    .eq("listing_id", id)
    .maybeSingle();
  return {
    listing: mapListingRow(listing, imgs[id] ?? []),
    secret: secretRow ? mapRecipeSecretRow(secretRow) : null,
  };
}

export async function getRecipeSecret(id: string): Promise<RecipeSecret | null> {
  const { data } = await supabase.from("recipe_secrets").select("*").eq("listing_id", id).maybeSingle();
  return data ? mapRecipeSecretRow(data) : null;
}

export async function createListing(draft: {
  creatorId: string;
  title: string;
  description: string;
  model: string;
  modelVersion: string;
  aspectRatio: string;
  imageType: string;
  styleTags: string[];
  usageRights: Listing["usageRights"];
  priceCents: number;
  partialPromptPreview: string;
  consistencyScore: number;
  previewImages?: string[];
  fullPrompt: string;
  negativePrompt: string;
  settings: Record<string, string | number>;
  usageNotes: string;
}): Promise<Listing> {
  const { data: inserted, error } = await supabase
    .from("listings")
    .insert({
      creator_id: draft.creatorId,
      title: draft.title,
      description: draft.description,
      model: draft.model,
      model_version: draft.modelVersion,
      aspect_ratio: draft.aspectRatio,
      image_type: draft.imageType,
      style_tags: draft.styleTags,
      usage_rights: draft.usageRights,
      price_cents: draft.priceCents,
      partial_prompt_preview: draft.fullPrompt.slice(0, 80) + (draft.fullPrompt.length > 80 ? "..." : ""),
      consistency_score: draft.consistencyScore,
      status: "published",
    })
    .select("*")
    .single();
  if (error) throw error;

  const { error: secretError } = await supabase.from("recipe_secrets").insert({
    listing_id: inserted.id,
    full_prompt: draft.fullPrompt,
    negative_prompt: draft.negativePrompt,
    settings: draft.settings,
    usage_notes: draft.usageNotes,
  });
  if (secretError) throw secretError;

  try {
    await supabase.rpc("log_event", {
      _event_type: "prompt_upload",
      _entity_type: "listing",
      _entity_id: inserted.id,
    });
  } catch {
    /* best-effort */
  }
  return mapListingRow(inserted);
}

export async function removeListing(id: string) {
  const { error } = await supabase.rpc("admin_remove_listing", { _listing_id: id });
  if (error) throw error;
  const { data } = await supabase.from("listings").select("*").eq("id", id).maybeSingle();
  return data ? mapListingRow(data) : null;
}

export async function getListingsByCreator(creatorId: string) {
  const { data, error } = await supabase
    .from("listings")
    .select("*")
    .eq("creator_id", creatorId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  const imgs = await fetchImagePaths((data ?? []).map((r) => r.id));
  return (data ?? []).map((r) => mapListingRow(r, imgs[r.id] ?? []));
}

// Storage helper: upload an image for a listing under listing-images/{listing_id}/{filename}.
export async function uploadListingImage(listingId: string, file: File): Promise<string> {
  const ext = file.name.split(".").pop() || "png";
  const path = `${listingId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage.from("listing-images").upload(path, file);
  if (error) throw error;
  const { error: rowError } = await supabase.from("listing_images").insert({
    listing_id: listingId,
    storage_path: path,
    is_cover: false,
  });
  if (rowError) throw rowError;
  return path;
}
