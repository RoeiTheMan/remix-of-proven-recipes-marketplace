// Advisor recommendations use Gemini through a Lovable Cloud Edge Function.
// The deterministic Pickture score remains the explainable fallback when the
// provider is unavailable, so the public Advisor never becomes a dead end.
import { supabase } from "@/integrations/supabase/client";
import type { Listing } from "@/types";
import { getListings } from "./listingsService";

export interface AdvisorFilters {
  maxPriceCents?: number;
  usageRights?: Listing["usageRights"];
  model?: string;
}

export interface AdvisorResult {
  listing: Listing;
  matchPct: number;
  rationale: string;
}

export interface AdvisorResponse {
  results: AdvisorResult[];
  source: "gemini" | "deterministic";
  summary?: string;
}

interface GeminiAdvisorResponse {
  matches?: Array<{ listingId?: unknown; matchPct?: unknown; rationale?: unknown }>;
  source?: unknown;
  summary?: unknown;
}

const STOP = new Set([
  "the",
  "a",
  "an",
  "for",
  "with",
  "and",
  "of",
  "in",
  "on",
  "to",
  "under",
  "over",
]);

function tokens(value: string) {
  return value
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token && !STOP.has(token));
}

function deterministicResults(
  items: Listing[],
  query: string,
  filters: AdvisorFilters,
): AdvisorResult[] {
  const queryTokens = tokens(query);
  const scored = items.map((listing) => {
    const listingTokens = new Set([
      ...tokens(listing.title),
      ...tokens(listing.description),
      ...tokens(listing.imageType),
      ...listing.styleTags,
    ]);
    const overlap = queryTokens.filter((token) => listingTokens.has(token)).length;
    const tagScore = Math.min(1, overlap / Math.max(1, queryTokens.length)) * 55;
    const ratingScore = (listing.avgRating / 5) * 15;
    const consistencyScore = (listing.consistencyScore / 100) * 20;
    const priceScore = filters.maxPriceCents
      ? Math.max(0, 10 - Math.max(0, listing.priceCents - filters.maxPriceCents) / 100)
      : listing.priceCents < 1500
        ? 10
        : 5;
    const modelScore = filters.model && listing.model === filters.model ? 5 : 0;
    const matchPct = Math.round(
      Math.min(99, tagScore + ratingScore + consistencyScore + priceScore + modelScore),
    );
    const reasons: string[] = [];
    if (overlap > 0) reasons.push(`${overlap} keyword match${overlap > 1 ? "es" : ""}`);
    if (listing.consistencyScore >= 90) reasons.push(`consistency ${listing.consistencyScore}`);
    if (listing.avgRating >= 4.5) reasons.push(`rated ${listing.avgRating}`);
    if (filters.model && listing.model === filters.model)
      reasons.push(`model match: ${listing.model}`);
    return {
      listing,
      matchPct,
      rationale: reasons.slice(0, 3).join(" · ") || "Broad style fit",
    };
  });
  return scored.sort((a, b) => b.matchPct - a.matchPct).slice(0, 8);
}

function mapGeminiResults(data: GeminiAdvisorResponse, items: Listing[]): AdvisorResult[] {
  if (data.source !== "gemini" || !Array.isArray(data.matches)) return [];
  const byId = new Map(items.map((listing) => [listing.id, listing]));
  const seen = new Set<string>();
  const results: AdvisorResult[] = [];

  for (const match of data.matches) {
    if (
      typeof match.listingId !== "string" ||
      seen.has(match.listingId) ||
      typeof match.matchPct !== "number" ||
      !Number.isFinite(match.matchPct) ||
      typeof match.rationale !== "string"
    ) {
      continue;
    }
    const listing = byId.get(match.listingId);
    if (!listing) continue;
    seen.add(match.listingId);
    results.push({
      listing,
      matchPct: Math.max(0, Math.min(99, Math.round(match.matchPct))),
      rationale: match.rationale.trim().slice(0, 240),
    });
    if (results.length === 8) break;
  }
  return results;
}

export async function findBestPrompts(
  query: string,
  filters: AdvisorFilters = {},
): Promise<AdvisorResponse> {
  const cleanQuery = query.trim().slice(0, 500);
  const { items } = await getListings(
    {
      maxPrice: filters.maxPriceCents,
      usageRights: filters.usageRights,
      model: filters.model,
    },
    "top_rated",
    1,
    200,
  );

  if (items.length === 0) return { results: [], source: "deterministic" };

  try {
    const { data, error } = await supabase.functions.invoke<GeminiAdvisorResponse>(
      "advisor-recommend",
      {
        body: { query: cleanQuery, filters },
      },
    );
    if (error) throw error;
    const results = mapGeminiResults(data ?? {}, items);
    if (results.length === 0) throw new Error("Gemini returned no valid marketplace matches");
    return {
      results,
      source: "gemini",
      summary: typeof data?.summary === "string" ? data.summary.trim().slice(0, 300) : undefined,
    };
  } catch (error) {
    console.warn(
      "[Advisor] Gemini unavailable; using deterministic matching.",
      error instanceof Error ? error.message : error,
    );
    try {
      await supabase.rpc("log_event", {
        _event_type: "ai_assistant_request",
        _payload: { source: "deterministic", query_length: cleanQuery.length },
      });
    } catch {
      // Anonymous visitors cannot write logs; fallback still works.
    }
    return {
      results: deterministicResults(items, cleanQuery, filters),
      source: "deterministic",
      summary:
        "Gemini is temporarily unavailable, so these results use Pickture's local match score.",
    };
  }
}
