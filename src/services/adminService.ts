// Real Lovable Cloud admin service.
// Server-side aggregates go through the admin_dashboard_stats RPC, which itself
// checks has_role(auth.uid(),'admin'). The frontend never sees a service-role key.
import { supabase } from "@/integrations/supabase/client";
import type { ReportStatus } from "@/types";
import { mapListingRow, mapReportRow, mapProfileRow, mapCreatorProfileRow } from "./_mappers";
import { modelLabel } from "@/lib/models";

// Every dashboard number is computed from real data. Metrics that cannot be
// derived honestly (approval rate, dispute rate, health score) were removed
// rather than shown as fabricated constants.
export async function getDashboardStats() {
  // The RPC checks has_role(auth.uid(),'admin') and throws otherwise, so the
  // follow-up table reads below only ever run for admins (whose RLS policies
  // allow reading all purchases and listings).
  const { data, error } = await supabase.rpc("admin_dashboard_stats");
  if (error) throw error;
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const s = (data ?? {}) as any;

  const [{ data: purchaseRows }, { data: listingRows }] = await Promise.all([
    supabase.from("purchases").select("created_at,status,buyer_id"),
    supabase.from("listings").select("consistency_score,status").eq("status", "published"),
  ]);
  const purchases = purchaseRows ?? [];
  const completed = purchases.filter((p) => p.status === "completed");

  // Real sales-over-time: completed purchases bucketed per day, last 14 days.
  const dayKey = (d: Date) => d.toISOString().slice(0, 10);
  const buckets = new Map<string, number>();
  for (let i = 13; i >= 0; i--) {
    buckets.set(dayKey(new Date(Date.now() - i * 86400_000)), 0);
  }
  for (const p of completed) {
    const key = dayKey(new Date(p.created_at));
    if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }
  const salesOverTime = Array.from(buckets.entries()).map(([day, sales]) => ({
    day: day.slice(5), // MM-DD
    sales,
  }));

  // Real distinct buyers with at least one completed purchase.
  const activeBuyers = new Set(completed.map((p) => p.buyer_id)).size;

  // Real transaction status distribution.
  const statusCounts = new Map<string, number>();
  for (const p of purchases) statusCounts.set(p.status, (statusCounts.get(p.status) ?? 0) + 1);
  const txStatuses = Array.from(statusCounts.entries()).map(([status, count]) => ({ status, count }));
  if (txStatuses.length === 0) txStatuses.push({ status: "completed", count: 0 });

  // Real average declared consistency score across published listings.
  const scores = (listingRows ?? []).map((l) => l.consistency_score).filter((n): n is number => typeof n === "number");
  const avgConsistency = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;

  const listingsByModel = Object.entries((s.listings_by_model ?? {}) as Record<string, number>).map(
    ([model, count]) => ({ model: modelLabel(model), count: count as number }),
  );
  const ratingDistribution = [1, 2, 3, 4, 5].map((star) => ({
    star: `${star}★`,
    count: (s.rating_distribution?.[String(star)] as number | undefined) ?? 0,
  }));

  return {
    activeCreators: s.total_creators ?? 0,
    activeBuyers,
    gmvCents: s.gmv_cents ?? 0,
    transactions: s.total_purchases ?? 0,
    openReports: s.total_reports_open ?? 0,
    avgConsistency,
    salesOverTime,
    listingsByModel,
    ratingDistribution,
    txStatuses,
  };
}

export async function getReports() {
  // reports.reporter_id references auth.users, not profiles, so it can't be
  // embedded via PostgREST FK. Fetch reporter profiles separately by id.
  const { data, error } = await supabase
    .from("reports")
    .select("*, listings(*)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  const rows = data ?? [];
  const reporterIds = Array.from(new Set(rows.map((r: any) => r.reporter_id).filter(Boolean)));
  const profiles: Record<string, any> = {};
  if (reporterIds.length) {
    const { data: profs } = await supabase.from("profiles").select("*").in("id", reporterIds);
    for (const p of profs ?? []) profiles[p.id] = p;
  }
  return rows.map((r: any) => ({
    report: mapReportRow(r),
    listing: r.listings ? mapListingRow(r.listings) : null,
    reporter: profiles[r.reporter_id] ? mapProfileRow(profiles[r.reporter_id]) : null,
  }));
}

export async function resolveReport(id: string, status: ReportStatus) {
  const { data, error } = await supabase
    .from("reports")
    .update({ status })
    .eq("id", id)
    .select("*")
    .maybeSingle();
  if (error) throw error;
  try {
    await supabase.rpc("log_event", {
      _event_type: "admin_action",
      _entity_type: "report",
      _entity_id: id,
      _payload: { status },
    });
  } catch { /* best-effort */ }
  return data ? mapReportRow(data) : null;
}

export async function suspendCreator(userId: string, reason = "Suspended by admin") {
  const { error } = await supabase.rpc("admin_suspend_creator", { _user_id: userId, _reason: reason });
  if (error) throw error;
  const { data } = await supabase.from("creator_profiles").select("*").eq("user_id", userId).maybeSingle();
  return data ? mapCreatorProfileRow(data, userId) : null;
}

export async function removeListingAdmin(id: string) {
  const { error } = await supabase.rpc("admin_remove_listing", { _listing_id: id });
  if (error) throw error;
  const { data } = await supabase.from("listings").select("*").eq("id", id).maybeSingle();
  return data ? mapListingRow(data) : null;
}

export async function getCreators() {
  const { data, error } = await supabase.from("creator_profiles").select("*, profiles!creator_profiles_user_id_fkey(*)");
  if (error) throw error;
  return (data ?? []).map((cp: any) => ({
    creator: mapCreatorProfileRow(cp, cp.user_id),
    profile: cp.profiles ? mapProfileRow(cp.profiles) : { id: cp.user_id, displayName: "", handle: "", role: "creator" as const, createdAt: cp.created_at },
  }));
}

export async function getAllListings() {
  const { data, error } = await supabase.from("listings").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r) => mapListingRow(r));
}

// Admin-only demo catalog generator. RPC enforces admin + creator profile.
export async function generateDemoCatalog(): Promise<{ created: number; skipped: number }> {
  const { data, error } = await supabase.rpc("admin_generate_demo_catalog");
  if (error) throw error;
  const d = (data ?? {}) as { created?: number; skipped?: number };
  return { created: d.created ?? 0, skipped: d.skipped ?? 0 };
}

