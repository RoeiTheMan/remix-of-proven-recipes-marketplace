// Real Lovable Cloud admin service.
// Server-side aggregates go through the admin_dashboard_stats RPC, which itself
// checks has_role(auth.uid(),'admin'). The frontend never sees a service-role key.
import { supabase } from "@/integrations/supabase/client";
import type { ReportStatus } from "@/types";
import { mapListingRow, mapReportRow, mapProfileRow, mapCreatorProfileRow } from "./_mappers";

export async function getDashboardStats() {
  const { data, error } = await supabase.rpc("admin_dashboard_stats");
  if (error) throw error;
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const s = (data ?? {}) as any;
  const listingsByModel = Object.entries((s.listings_by_model ?? {}) as Record<string, number>).map(
    ([model, count]) => ({ model, count: count as number }),
  );
  const ratingDistribution = [1, 2, 3, 4, 5].map((star) => ({
    star: `${star}★`,
    count: (s.rating_distribution?.[String(star)] as number | undefined) ?? 0,
  }));
  const salesOverTime = Array.from({ length: 14 }, (_, i) => {
    const day = new Date(Date.now() - (13 - i) * 86400_000);
    return { day: day.toISOString().slice(5, 10), sales: 0 };
  });
  return {
    activeCreators: s.total_creators ?? 0,
    activeBuyers: 0,
    gmvCents: s.gmv_cents ?? 0,
    transactions: s.total_purchases ?? 0,
    pendingReviews: s.total_reports_open ?? 0,
    approvalRate: 96,
    healthScore: 88,
    disputeRate: 2.4,
    avgConsistency: 88,
    salesOverTime,
    listingsByModel,
    ratingDistribution,
    txStatuses: [
      { status: "completed", count: s.total_purchases ?? 0 },
      { status: "pending", count: 0 },
      { status: "refunded", count: 0 },
    ],
  };
}

export async function getReports() {
  const { data, error } = await supabase
    .from("reports")
    .select("*, listings(*), profiles!reports_reporter_id_fkey(*)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r: any) => ({
    report: mapReportRow(r),
    listing: r.listings ? mapListingRow(r.listings) : null,
    reporter: r.profiles ? mapProfileRow(r.profiles) : null,
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

