// Mock implementation — replace with Supabase in M1.
import { db, delay, pushLog } from "./_store";
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

const STOP = new Set(["the", "a", "an", "for", "with", "and", "of", "in", "on", "to", "under", "over", "under$"]);

function tokens(s: string) {
  return s.toLowerCase().split(/[^a-z0-9]+/).filter((t) => t && !STOP.has(t));
}

export async function findBestPrompts(query: string, filters: AdvisorFilters = {}): Promise<AdvisorResult[]> {
  await delay(500);
  pushLog({ eventType: "ai_assistant_request", payload: { query } });
  const qTokens = tokens(query);
  const pool = db.listings.filter((l) => {
    if (l.status !== "published") return false;
    if (filters.maxPriceCents != null && l.priceCents > filters.maxPriceCents) return false;
    if (filters.usageRights && l.usageRights !== filters.usageRights) return false;
    if (filters.model && l.model !== filters.model) return false;
    return true;
  });

  const scored = pool.map((l) => {
    const lTokens = new Set([
      ...tokens(l.title),
      ...tokens(l.description),
      ...tokens(l.imageType),
      ...l.styleTags,
    ]);
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
