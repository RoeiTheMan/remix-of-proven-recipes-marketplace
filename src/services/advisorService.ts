// Advisor: deterministic mock matching (unchanged) — but candidate listings now
// come from the real database via listingsService. Real AI hookup is out of
// scope for M1.
import { getListings } from "./listingsService";
import { supabase } from "@/integrations/supabase/client";
import type { Listing } from "@/types";

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

const STOP = new Set(["the", "a", "an", "for", "with", "and", "of", "in", "on", "to", "under", "over"]);

function tokens(s: string) {
  return s.toLowerCase().split(/[^a-z0-9]+/).filter((t) => t && !STOP.has(t));
}

export async function findBestPrompts(query: string, filters: AdvisorFilters = {}): Promise<AdvisorResult[]> {
  try {
    await supabase.rpc("log_event", { _event_type: "ai_assistant_request", _payload: { query } });
  } catch { /* best-effort */ }
  const { items } = await getListings({
    maxPrice: filters.maxPriceCents,
    usageRights: filters.usageRights,
    model: filters.model,
  }, "top_rated", 1, 200);

  const qTokens = tokens(query);
  const scored = items.map((l) => {
    const lTokens = new Set([...tokens(l.title), ...tokens(l.description), ...tokens(l.imageType), ...l.styleTags]);
    const overlap = qTokens.filter((t) => lTokens.has(t)).length;
    const tagScore = Math.min(1, overlap / Math.max(1, qTokens.length)) * 55;
    const ratingScore = (l.avgRating / 5) * 15;
    const consistencyScore = (l.consistencyScore / 100) * 20;
    const priceScore = filters.maxPriceCents ? Math.max(0, 10 - Math.max(0, l.priceCents - filters.maxPriceCents) / 100) : (l.priceCents < 1500 ? 10 : 5);
    const modelScore = filters.model && l.model === filters.model ? 5 : 0;
    const pct = Math.round(Math.min(99, tagScore + ratingScore + consistencyScore + priceScore + modelScore));
    const reasons: string[] = [];
    if (overlap > 0) reasons.push(`${overlap} keyword match${overlap > 1 ? "es" : ""}`);
    if (l.consistencyScore >= 90) reasons.push(`consistency ${l.consistencyScore}`);
    if (l.avgRating >= 4.5) reasons.push(`rated ${l.avgRating}`);
    if (filters.model && l.model === filters.model) reasons.push(`model match: ${l.model}`);
    return { listing: l, matchPct: pct, rationale: reasons.slice(0, 3).join(" · ") || "Broad style fit" };
  });
  return scored.sort((a, b) => b.matchPct - a.matchPct).slice(0, 8);
}
