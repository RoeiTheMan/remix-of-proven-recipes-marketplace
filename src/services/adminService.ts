// Mock implementation — replace with Supabase in M1.
import { db, delay, pushLog } from "./_store";
import type { ReportStatus } from "@/types";

export async function getDashboardStats() {
  await delay();
  const gmv = db.purchases.filter((p) => p.status === "completed").reduce((s, p) => s + p.priceCents, 0);
  const listingsByModel = Object.entries(
    db.listings.filter((l) => l.status === "published").reduce<Record<string, number>>((acc, l) => {
      acc[l.model] = (acc[l.model] ?? 0) + 1;
      return acc;
    }, {}),
  ).map(([model, count]) => ({ model, count }));

  const ratingDistribution = [1, 2, 3, 4, 5].map((star) => ({
    star: `${star}★`,
    count: db.reviews.filter((r) => Math.round(r.rating) === star).length,
  }));

  // Sales over last 14 days
  const salesOverTime = Array.from({ length: 14 }, (_, i) => {
    const day = new Date(Date.now() - (13 - i) * 86400_000);
    const key = day.toISOString().slice(5, 10);
    const count = db.purchases.filter((p) => p.purchasedAt.slice(5, 10) === key).length + ((i * 3) % 5);
    return { day: key, sales: count };
  });

  const txStatuses = [
    { status: "completed", count: db.purchases.filter((p) => p.status === "completed").length },
    { status: "pending", count: db.purchases.filter((p) => p.status === "pending").length + 2 },
    { status: "refunded", count: db.purchases.filter((p) => p.status === "refunded").length + 1 },
  ];

  const avgConsistency = Math.round(
    db.listings.reduce((s, l) => s + l.consistencyScore, 0) / Math.max(1, db.listings.length),
  );

  return {
    activeCreators: db.creatorProfiles.filter((c) => !c.suspended).length,
    activeBuyers: db.profiles.filter((p) => p.role === "buyer").length,
    gmvCents: gmv,
    transactions: db.purchases.length,
    pendingReviews: db.reports.filter((r) => r.status === "open" || r.status === "reviewing").length,
    approvalRate: 96,
    healthScore: 88,
    disputeRate: 2.4,
    avgConsistency,
    salesOverTime,
    listingsByModel,
    ratingDistribution,
    txStatuses,
  };
}

export async function getReports() {
  await delay();
  return db.reports.map((r) => ({
    report: r,
    listing: db.listings.find((l) => l.id === r.listingId) ?? null,
    reporter: db.profiles.find((p) => p.id === r.reporterId) ?? null,
  }));
}

export async function resolveReport(id: string, status: ReportStatus) {
  await delay();
  const r = db.reports.find((x) => x.id === id);
  if (r) r.status = status;
  pushLog({ eventType: "admin_action", entityType: "report", entityId: id, payload: { status } });
  return r ?? null;
}

export async function suspendCreator(creatorId: string) {
  await delay();
  const c = db.creatorProfiles.find((x) => x.profileId === creatorId);
  if (c) c.suspended = true;
  pushLog({ eventType: "admin_action", entityType: "creator", entityId: creatorId, payload: { action: "suspend" } });
  return c ?? null;
}

export async function removeListingAdmin(id: string) {
  await delay();
  const l = db.listings.find((x) => x.id === id);
  if (l) l.status = "removed";
  pushLog({ eventType: "admin_action", entityType: "listing", entityId: id, payload: { action: "remove" } });
  return l ?? null;
}

export async function getCreators() {
  await delay();
  return db.creatorProfiles.map((cp) => ({
    creator: cp,
    profile: db.profiles.find((p) => p.id === cp.profileId)!,
  }));
}

export async function getAllListings() {
  await delay();
  return db.listings;
}
