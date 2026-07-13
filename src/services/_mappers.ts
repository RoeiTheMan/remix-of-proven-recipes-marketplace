// Row mappers: DB snake_case → app camelCase types.
// Keeps service function signatures identical to the M0 mock layer.
import type {
  Listing,
  ListingStatus,
  RecipeSecret,
  Purchase,
  Review,
  CustomRequest,
  Offer,
  ChatMessage,
  Report,
  LogEvent,
  Profile,
  CreatorProfile,
  RequestStatus,
} from "@/types";

// Listing status: DB has removed_by_admin; app type has removed.
export function mapListingStatus(s: string): ListingStatus {
  if (s === "removed_by_admin") return "removed";
  if (s === "suspended") return "suspended";
  if (s === "published") return "published";
  return "draft";
}

// Request status: DB adds awarded/approved/cancelled; app type uses in_progress.
export function mapRequestStatus(s: string): RequestStatus {
  if (s === "awarded") return "in_progress";
  if (s === "delivered" || s === "approved") return "delivered";
  if (s === "closed" || s === "cancelled") return "closed";
  return "open";
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export function mapListingRow(r: any, previewImages: string[] = []): Listing {
  return {
    id: r.id,
    creatorId: r.creator_id,
    title: r.title,
    description: r.description ?? "",
    model: r.model,
    modelVersion: r.model_version ?? "",
    aspectRatio: r.aspect_ratio ?? "1:1",
    imageType: r.image_type ?? "",
    styleTags: r.style_tags ?? [],
    usageRights: r.usage_rights,
    priceCents: r.price_cents,
    partialPromptPreview: r.partial_prompt_preview ?? "",
    consistencyScore: r.consistency_score ?? 80,
    avgRating: Number(r.avg_rating ?? 0),
    ratingCount: r.rating_count ?? 0,
    salesCount: r.sales_count ?? 0,
    status: mapListingStatus(r.status),
    previewImages: previewImages.length ? previewImages : ["ph-1"],
    createdAt: r.created_at,
  };
}

export function mapRecipeSecretRow(r: any): RecipeSecret {
  return {
    listingId: r.listing_id,
    fullPrompt: r.full_prompt ?? "",
    negativePrompt: r.negative_prompt ?? "",
    settings: (r.settings ?? {}) as Record<string, string | number>,
    usageNotes: r.usage_notes ?? "",
  };
}

export function mapPurchaseRow(r: any): Purchase {
  return {
    id: r.id,
    buyerId: r.buyer_id,
    listingId: r.listing_id,
    priceCents: r.price_cents,
    status: r.status === "failed" ? "pending" : r.status,
    purchasedAt: r.created_at,
  };
}

export function mapReviewRow(r: any): Review {
  return {
    id: r.id,
    purchaseId: r.purchase_id,
    listingId: r.listing_id,
    buyerId: r.buyer_id,
    rating: r.rating,
    comment: r.comment ?? "",
    createdAt: r.created_at,
  };
}

export function mapRequestRow(r: any, offerCount = 0): CustomRequest {
  return {
    id: r.id,
    buyerId: r.buyer_id,
    title: r.title,
    brief: r.brief ?? "",
    modelPreference: r.model_preference ?? undefined,
    budgetCents: r.budget_cents,
    deadline: r.deadline ?? "",
    usageRights: r.usage_rights,
    status: mapRequestStatus(r.status),
    offerCount,
    createdAt: r.created_at,
  };
}

export function mapOfferRow(r: any): Offer {
  return {
    id: r.id,
    requestId: r.request_id,
    creatorId: r.creator_id,
    message: r.sample_direction ?? "",
    priceCents: r.price_cents,
    etaDays: r.turnaround_days,
    status: r.status === "submitted" ? "pending" : r.status,
    createdAt: r.created_at,
  };
}

export function mapChatRow(r: any): ChatMessage {
  return {
    id: r.id,
    requestId: r.request_id,
    authorId: r.sender_id,
    body: r.body,
    createdAt: r.created_at,
  };
}

export function mapReportRow(r: any): Report {
  return {
    id: r.id,
    listingId: r.listing_id,
    reporterId: r.reporter_id,
    reason: r.reason,
    status: r.status,
    createdAt: r.created_at,
  };
}

export function mapLogRow(r: any): LogEvent {
  return {
    id: r.id,
    eventType: r.event_type,
    level: r.level,
    actorId: r.actor_id ?? undefined,
    entityType: r.entity_type ?? undefined,
    entityId: r.entity_id ?? undefined,
    payload: (r.payload ?? {}) as Record<string, unknown>,
    createdAt: r.created_at,
  };
}

export function mapProfileRow(r: any, role: Profile["role"] = "buyer"): Profile {
  return {
    id: r.id,
    displayName: r.display_name || "User",
    handle: (r.display_name || "user").toLowerCase().replace(/\s+/g, ""),
    avatarUrl: r.avatar_url ?? undefined,
    role,
    createdAt: r.created_at,
  };
}

export function mapCreatorProfileRow(r: any, profileId: string): CreatorProfile {
  return {
    id: r.id,
    profileId,
    bio: r.tagline ?? "",
    reliabilityScore: Math.round(Number(r.reliability_score ?? 0.8) * 100),
    totalSales: 0,
    avgRating: 0,
    reportCount: 0,
    suspended: !!r.is_suspended,
  };
}
