// Types mirror future DB schema. Keep field names stable.

export type Role = "guest" | "buyer" | "creator" | "admin";
export type UsageRights = "personal" | "commercial" | "extended";
export type ListingStatus = "draft" | "published" | "removed" | "suspended";
export type ReportStatus = "open" | "reviewing" | "actioned" | "dismissed";
export type RequestStatus = "open" | "in_progress" | "delivered" | "closed";
export type OfferStatus = "pending" | "accepted" | "declined" | "withdrawn";
export type PurchaseStatus = "pending" | "completed" | "refunded";
export type LogLevel = "info" | "warn" | "error";

export type LogEventType =
  | "login"
  | "prompt_upload"
  | "purchase"
  | "image_generation"
  | "ai_assistant_request"
  | "voice_usage"
  | "email_sent"
  | "api_failure"
  | "listing_reported"
  | "admin_action";

export interface Profile {
  id: string;
  displayName: string;
  handle: string;
  avatarUrl?: string;
  role: Role;
  createdAt: string;
}

export interface CreatorProfile {
  id: string;
  profileId: string;
  bio: string;
  reliabilityScore: number; // 0-100
  totalSales: number;
  avgRating: number;
  reportCount: number;
  suspended: boolean;
}

export interface CreatorSummary {
  id: string;
  displayName: string;
  avatarUrl?: string;
  reliabilityScore: number;
  suspended: boolean;
  tagline?: string;
}

export interface Listing {
  id: string;
  creatorId: string;
  title: string;
  description: string;
  model: string;
  modelVersion: string;
  aspectRatio: string;
  imageType: string;
  styleTags: string[];
  usageRights: UsageRights;
  priceCents: number;
  partialPromptPreview: string;
  consistencyScore: number; // 0-100
  avgRating: number;
  ratingCount: number;
  salesCount: number;
  status: ListingStatus;
  previewImages: string[]; // placeholder ids
  createdAt: string;
  creator?: CreatorSummary;
}

export interface RecipeSecret {
  listingId: string;
  fullPrompt: string;
  negativePrompt: string;
  settings: Record<string, string | number>;
  usageNotes: string;
}

export interface Purchase {
  id: string;
  buyerId: string;
  listingId: string;
  priceCents: number;
  status: PurchaseStatus;
  purchasedAt: string;
}

export interface Review {
  id: string;
  purchaseId: string;
  listingId: string;
  buyerId: string;
  rating: number; // 1-5
  comment: string;
  createdAt: string;
}

export interface TestGeneration {
  id: string;
  purchaseId: string;
  imageUrl?: string;
  createdAt: string;
}

export interface CustomRequest {
  id: string;
  buyerId: string;
  title: string;
  brief: string;
  modelPreference?: string;
  budgetCents: number;
  deadline: string;
  usageRights: UsageRights;
  status: RequestStatus;
  offerCount: number;
  createdAt: string;
}

export interface Offer {
  id: string;
  requestId: string;
  creatorId: string;
  message: string;
  priceCents: number;
  etaDays: number;
  status: OfferStatus;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  requestId: string;
  authorId: string;
  body: string;
  createdAt: string;
}

export interface Delivery {
  id: string;
  requestId: string;
  offerId: string;
  notes: string;
  recipeSecretId: string;
  approved: boolean;
  deliveredAt: string;
}

export interface Report {
  id: string;
  listingId: string;
  reporterId: string;
  reason: string;
  status: ReportStatus;
  createdAt: string;
}

export interface LogEvent {
  id: string;
  eventType: LogEventType;
  level: LogLevel;
  actorId?: string;
  entityType?: string;
  entityId?: string;
  payload: Record<string, unknown>;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
}
