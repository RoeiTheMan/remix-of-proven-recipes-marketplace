// Real Lovable Cloud listings service.
// Uses signed URLs for the private listing-images bucket.
// All data comes from the real database — an empty catalog renders an honest
// empty state (no mock/seed fallback).
import { supabase } from "@/integrations/supabase/client";
import type { Listing, ListingStatus, RecipeSecret } from "@/types";
import { mapListingRow, mapRecipeSecretRow } from "./_mappers";
import { getCreatorSummaries } from "./creatorsService";
import { modelLabel } from "@/lib/models";

const SIGNED_URL_TTL = 60 * 60; // 1 hour

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

export interface ListingImageRow {
  id: string;
  listingId: string;
  storagePath: string;
  signedUrl: string;
  isCover: boolean;
  sortOrder: number;
}

async function signPaths(paths: string[]): Promise<Record<string, string>> {
  if (paths.length === 0) return {};
  const { data, error } = await supabase.storage
    .from("listing-images")
    .createSignedUrls(paths, SIGNED_URL_TTL);
  if (error) return {};
  const map: Record<string, string> = {};
  for (const row of data ?? []) {
    if (row.path && row.signedUrl) map[row.path] = row.signedUrl;
  }
  return map;
}

async function fetchImageUrlsByListing(listingIds: string[]): Promise<Record<string, string[]>> {
  if (listingIds.length === 0) return {};
  const { data } = await supabase
    .from("listing_images")
    .select("listing_id,storage_path,is_cover,sort_order")
    .in("listing_id", listingIds)
    .order("is_cover", { ascending: false })
    .order("sort_order");
  const rows = data ?? [];
  const allPaths = rows.map((r) => r.storage_path);
  const signed = await signPaths(allPaths);
  const map: Record<string, string[]> = {};
  for (const row of rows) {
    const url = signed[row.storage_path];
    if (url) (map[row.listing_id] ??= []).push(url);
  }
  return map;
}

export async function getListingImages(listingId: string): Promise<ListingImageRow[]> {
  const { data, error } = await supabase
    .from("listing_images")
    .select("*")
    .eq("listing_id", listingId)
    .order("is_cover", { ascending: false })
    .order("sort_order");
  if (error) throw error;
  const rows = data ?? [];
  const signed = await signPaths(rows.map((r) => r.storage_path));
  return rows.map((r) => ({
    id: r.id,
    listingId: r.listing_id,
    storagePath: r.storage_path,
    signedUrl: signed[r.storage_path] ?? "",
    isCover: !!r.is_cover,
    sortOrder: r.sort_order ?? 0,
  }));
}

function applyClientFilters(items: Listing[], filters: ListingFilters, sort: ListingSort): Listing[] {
  let out = items;
  if (filters.q) {
    const q = filters.q.toLowerCase();
    out = out.filter((l) => l.title.toLowerCase().includes(q) || l.styleTags.some((t) => t.toLowerCase().includes(q)));
  }
  // Compare via modelLabel so slugs ("midjourney-v7") and legacy pretty-label
  // rows ("Midjourney V7") both match the same filter selection.
  if (filters.model) out = out.filter((l) => modelLabel(l.model) === modelLabel(filters.model));
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

  let items: Listing[] = [];
  if (data && data.length > 0) {
    const [imgs, creators] = await Promise.all([
      fetchImageUrlsByListing(data.map((r) => r.id)),
      getCreatorSummaries(data.map((r) => r.creator_id)),
    ]);
    items = data
      .map((r) => ({ ...mapListingRow(r, imgs[r.id] ?? []), creator: creators[r.creator_id] }))
      // Hide listings whose creator is suspended (defence in depth vs RLS).
      .filter((l) => !l.creator?.suspended);
  }

  const filtered = applyClientFilters(items, filters, sort);
  const start = (page - 1) * pageSize;
  return { items: filtered.slice(start, start + pageSize), total: filtered.length };
}

export async function getListing(id: string) {
  const { data: listing } = await supabase.from("listings").select("*").eq("id", id).maybeSingle();
  if (!listing) {
    // Unknown or invisible listing (RLS): honest not-found, no mock fallback.
    return { listing: null, secret: null };
  }
  const [imgs, creators] = await Promise.all([
    fetchImageUrlsByListing([id]),
    getCreatorSummaries([listing.creator_id]),
  ]);
  const { data: secretRow } = await supabase
    .from("recipe_secrets")
    .select("*")
    .eq("listing_id", id)
    .maybeSingle();
  return {
    listing: { ...mapListingRow(listing, imgs[id] ?? []), creator: creators[listing.creator_id] },
    secret: secretRow ? mapRecipeSecretRow(secretRow) : null,
  };
}

export async function getRecipeSecret(id: string): Promise<RecipeSecret | null> {
  const { data } = await supabase.from("recipe_secrets").select("*").eq("listing_id", id).maybeSingle();
  return data ? mapRecipeSecretRow(data) : null;
}

export interface ListingDraft {
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
  status?: ListingStatus;
}

export async function createListing(draft: ListingDraft): Promise<Listing> {
  const status = draft.status === "draft" ? "draft" : "published";
  // Partial prompt preview is no longer shown publicly. Persist an empty
  // string for DB compatibility only.
  const partial = "";
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
      partial_prompt_preview: partial,
      consistency_score: draft.consistencyScore,
      status,
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

export async function updateListing(id: string, patch: Partial<ListingDraft>): Promise<Listing> {
  const listingUpdate: Partial<{
    title: string; description: string; model: string; model_version: string;
    aspect_ratio: string; image_type: string; style_tags: string[];
    usage_rights: Listing["usageRights"]; price_cents: number;
    partial_prompt_preview: string; consistency_score: number;
  }> = {};
  if (patch.title !== undefined) listingUpdate.title = patch.title;
  if (patch.description !== undefined) listingUpdate.description = patch.description;
  if (patch.model !== undefined) listingUpdate.model = patch.model;
  if (patch.modelVersion !== undefined) listingUpdate.model_version = patch.modelVersion;
  if (patch.aspectRatio !== undefined) listingUpdate.aspect_ratio = patch.aspectRatio;
  if (patch.imageType !== undefined) listingUpdate.image_type = patch.imageType;
  if (patch.styleTags !== undefined) listingUpdate.style_tags = patch.styleTags;
  if (patch.usageRights !== undefined) listingUpdate.usage_rights = patch.usageRights;
  if (patch.priceCents !== undefined) listingUpdate.price_cents = patch.priceCents;
  if (patch.partialPromptPreview !== undefined) listingUpdate.partial_prompt_preview = patch.partialPromptPreview;
  if (patch.consistencyScore !== undefined) listingUpdate.consistency_score = patch.consistencyScore;

  let updated = null;
  if (Object.keys(listingUpdate).length > 0) {
    const { data, error } = await supabase.from("listings").update(listingUpdate).eq("id", id).select("*").single();
    if (error) throw error;
    updated = data;
  } else {
    const { data } = await supabase.from("listings").select("*").eq("id", id).maybeSingle();
    updated = data;
  }

  const secretPatch: Partial<{ full_prompt: string; negative_prompt: string; settings: Record<string, string | number>; usage_notes: string }> = {};
  if (patch.fullPrompt !== undefined) secretPatch.full_prompt = patch.fullPrompt;
  if (patch.negativePrompt !== undefined) secretPatch.negative_prompt = patch.negativePrompt;
  if (patch.settings !== undefined) secretPatch.settings = patch.settings;
  if (patch.usageNotes !== undefined) secretPatch.usage_notes = patch.usageNotes;
  if (Object.keys(secretPatch).length > 0) {
    // upsert in case a legacy listing has no recipe_secrets row yet
    const { error } = await supabase
      .from("recipe_secrets")
      .upsert({ listing_id: id, ...secretPatch }, { onConflict: "listing_id" });
    if (error) throw error;
  }
  if (!updated) throw new Error("listing_not_found");
  return mapListingRow(updated);
}

export async function setListingStatus(id: string, status: "draft" | "published"): Promise<Listing> {
  const { data, error } = await supabase.rpc("set_listing_status", {
    _listing_id: id,
    _status: status,
  });
  if (error) throw error;
  return mapListingRow(data);
}

export async function deleteListing(id: string): Promise<void> {
  const { error } = await supabase.rpc("delete_listing_if_safe", { _listing_id: id });
  if (error) throw error;
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
  const imgs = await fetchImageUrlsByListing((data ?? []).map((r) => r.id));
  return (data ?? []).map((r) => mapListingRow(r, imgs[r.id] ?? []));
}

// ---- image management --------------------------------------------------

export async function uploadListingImage(listingId: string, file: File): Promise<ListingImageRow> {
  const ext = (file.name.split(".").pop() || "png").toLowerCase();
  const path = `${listingId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage.from("listing-images").upload(path, file, {
    upsert: false,
    contentType: file.type || undefined,
  });
  if (error) throw error;

  // Existing image count → next sort_order; cover only if first.
  const { count } = await supabase
    .from("listing_images")
    .select("id", { count: "exact", head: true })
    .eq("listing_id", listingId);
  const isFirst = (count ?? 0) === 0;

  const { data: row, error: rowError } = await supabase
    .from("listing_images")
    .insert({
      listing_id: listingId,
      storage_path: path,
      is_cover: isFirst,
      sort_order: count ?? 0,
    })
    .select("*")
    .single();
  if (rowError) {
    await supabase.storage.from("listing-images").remove([path]).catch(() => {});
    throw rowError;
  }
  const signed = await signPaths([path]);
  return {
    id: row.id,
    listingId: row.listing_id,
    storagePath: row.storage_path,
    signedUrl: signed[path] ?? "",
    isCover: !!row.is_cover,
    sortOrder: row.sort_order ?? 0,
  };
}

export async function deleteListingImage(imageId: string): Promise<void> {
  const { data: row } = await supabase.from("listing_images").select("*").eq("id", imageId).maybeSingle();
  if (!row) return;
  await supabase.from("listing_images").delete().eq("id", imageId);
  await supabase.storage.from("listing-images").remove([row.storage_path]).catch(() => {});
  if (row.is_cover) {
    const { data: next } = await supabase
      .from("listing_images")
      .select("id")
      .eq("listing_id", row.listing_id)
      .order("sort_order")
      .limit(1)
      .maybeSingle();
    if (next) await supabase.from("listing_images").update({ is_cover: true }).eq("id", next.id);
  }
}

export async function setCoverImage(imageId: string): Promise<void> {
  const { data: row } = await supabase.from("listing_images").select("listing_id").eq("id", imageId).maybeSingle();
  if (!row) return;
  await supabase.from("listing_images").update({ is_cover: false }).eq("listing_id", row.listing_id);
  await supabase.from("listing_images").update({ is_cover: true }).eq("id", imageId);
}

export async function reorderImages(listingId: string, orderedIds: string[]): Promise<void> {
  await Promise.all(
    orderedIds.map((id, idx) =>
      supabase.from("listing_images").update({ sort_order: idx }).eq("id", id).eq("listing_id", listingId),
    ),
  );
}
