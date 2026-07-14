// Public creator profile + summary lookups.
// All queries go through Row Level Security; suspended creators are hidden
// from public reads by the creator_profiles RLS policy.
import { supabase } from "@/integrations/supabase/client";
import type { CreatorSummary, Listing } from "@/types";
import { mapListingRow } from "./_mappers";

export async function getCreatorSummaries(
  creatorIds: string[],
): Promise<Record<string, CreatorSummary>> {
  const ids = Array.from(new Set(creatorIds.filter(Boolean)));
  if (ids.length === 0) return {};
  const [{ data: profiles }, { data: creators }] = await Promise.all([
    supabase.from("profiles").select("id, display_name, avatar_url").in("id", ids),
    supabase
      .from("creator_profiles")
      .select("user_id, tagline, reliability_score, is_suspended")
      .in("user_id", ids),
  ]);
  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));
  const map: Record<string, CreatorSummary> = {};
  for (const c of creators ?? []) {
    const p = profileMap.get(c.user_id);
    map[c.user_id] = {
      id: c.user_id,
      displayName: p?.display_name || "Pickture creator",
      avatarUrl: p?.avatar_url ?? undefined,
      reliabilityScore: Math.round(Number(c.reliability_score ?? 0.8) * 100),
      suspended: !!c.is_suspended,
      tagline: c.tagline ?? undefined,
    };
  }
  // Fall back for creators without a creator_profiles row (edge case).
  for (const id of ids) {
    if (map[id]) continue;
    const p = profileMap.get(id);
    map[id] = {
      id,
      displayName: p?.display_name || "Pickture creator",
      avatarUrl: p?.avatar_url ?? undefined,
      reliabilityScore: 80,
      suspended: false,
    };
  }
  return map;
}

export interface PublicCreatorProfile {
  creator: CreatorSummary;
  bio: string;
  portfolioUrl?: string;
  publishedCount: number;
  totalSales: number;
  avgRating: number;
  reviewCount: number;
  listings: Listing[];
}

export async function getCreatorPublicProfile(
  creatorId: string,
): Promise<PublicCreatorProfile | null> {
  const [{ data: profile }, { data: creator }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", creatorId).maybeSingle(),
    supabase
      .from("creator_profiles")
      .select("*")
      .eq("user_id", creatorId)
      .maybeSingle(),
  ]);
  if (!creator || creator.is_suspended) return null;

  const { data: listingRows } = await supabase
    .from("listings")
    .select("*")
    .eq("creator_id", creatorId)
    .eq("status", "published")
    .order("created_at", { ascending: false });

  const listings = (listingRows ?? []).map((r) => mapListingRow(r));

  const summary: CreatorSummary = {
    id: creatorId,
    displayName: profile?.display_name || "Pickture creator",
    avatarUrl: profile?.avatar_url ?? undefined,
    reliabilityScore: Math.round(Number(creator.reliability_score ?? 0.8) * 100),
    suspended: false,
    tagline: creator.tagline ?? undefined,
  };

  const totalSales = listings.reduce((s, l) => s + l.salesCount, 0);
  const rated = listings.filter((l) => l.ratingCount > 0);
  const avgRating = rated.length
    ? rated.reduce((s, l) => s + l.avgRating * l.ratingCount, 0) /
      rated.reduce((s, l) => s + l.ratingCount, 0)
    : 0;
  const reviewCount = listings.reduce((s, l) => s + l.ratingCount, 0);

  return {
    creator: summary,
    bio: profile?.bio ?? "",
    portfolioUrl: creator.portfolio_url ?? undefined,
    publishedCount: listings.length,
    totalSales,
    avgRating,
    reviewCount,
    listings,
  };
}
