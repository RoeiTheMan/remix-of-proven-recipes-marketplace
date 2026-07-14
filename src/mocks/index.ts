// Mock seed data. Never import directly from components — go through services.
import type {
  Profile, CreatorProfile, Listing, RecipeSecret, Purchase, Review,
  CustomRequest, Offer, ChatMessage, Delivery, Report, LogEvent, Notification,
  LogEventType, LogLevel,
} from "@/types";

const now = Date.now();
const daysAgo = (d: number) => new Date(now - d * 86400_000).toISOString();

export const profiles: Profile[] = [
  { id: "u_guest", displayName: "Guest", handle: "guest", role: "guest", createdAt: daysAgo(400) },
  { id: "u_buyer", displayName: "Ava Reyes", handle: "ava", role: "buyer", createdAt: daysAgo(120) },
  { id: "u_buyer2", displayName: "Marco Bell", handle: "marco", role: "buyer", createdAt: daysAgo(80) },
  { id: "u_creator1", displayName: "Iris Nakamura", handle: "iris", role: "creator", createdAt: daysAgo(300) },
  { id: "u_creator2", displayName: "Damien Cole", handle: "damien", role: "creator", createdAt: daysAgo(210) },
  { id: "u_creator3", displayName: "Sofia Vale", handle: "sofia", role: "creator", createdAt: daysAgo(160) },
  { id: "u_admin", displayName: "Admin", handle: "admin", role: "admin", createdAt: daysAgo(500) },
];

export const creatorProfiles: CreatorProfile[] = [
  { id: "cp1", profileId: "u_creator1", bio: "Editorial product & still-life recipes.", reliabilityScore: 96, totalSales: 812, avgRating: 4.8, reportCount: 1, suspended: false },
  { id: "cp2", profileId: "u_creator2", bio: "Cinematic campaigns and cover-grade portraits.", reliabilityScore: 91, totalSales: 540, avgRating: 4.6, reportCount: 3, suspended: false },
  { id: "cp3", profileId: "u_creator3", bio: "Architectural and interior visualization.", reliabilityScore: 88, totalSales: 214, avgRating: 4.5, reportCount: 0, suspended: false },
];

const models = [
  { m: "gpt-image-2", v: "2" },
  { m: "nano-banana-pro", v: "pro" },
  { m: "nano-banana-2", v: "2" },
  { m: "midjourney-v7", v: "v7" },
];

const listingSeeds: Array<Partial<Listing> & { title: string; imageType: string; styleTags: string[] }> = [
  { title: "Editorial Product Photography — Ceramic Vase", imageType: "Product", styleTags: ["editorial", "product", "minimal", "warm"] },
  { title: "Luxury Watch Campaign — Onyx & Gold", imageType: "Product", styleTags: ["luxury", "watch", "macro"] },
  { title: "Cinematic Sneaker Advertisement", imageType: "Product", styleTags: ["sneaker", "cinematic", "street"] },
  { title: "Soft Studio Portrait — Editorial Beauty", imageType: "Portrait", styleTags: ["portrait", "editorial", "soft"] },
  { title: "Architectural Visualization — Coastal Villa", imageType: "Architecture", styleTags: ["architecture", "archviz", "modern"] },
  { title: "Fashion Editorial — Minimal Streetwear", imageType: "Fashion", styleTags: ["fashion", "editorial", "street"] },
  { title: "Premium Food Photography — Dark & Moody", imageType: "Food", styleTags: ["food", "dark", "moody"] },
  { title: "Mobile App Mockup — Fintech Dashboard", imageType: "Mockup", styleTags: ["mockup", "app", "fintech"] },
  { title: "Minimal Logo Concept — Monogram", imageType: "Logo", styleTags: ["logo", "monogram", "minimal"] },
  { title: "Travel Poster — Retro Alpine", imageType: "Illustration", styleTags: ["poster", "travel", "retro"] },
  { title: "Automotive Campaign — Coastal Highway", imageType: "Automotive", styleTags: ["automotive", "cinematic", "dusk"] },
  { title: "Social Media Campaign — Skincare Flatlay", imageType: "Product", styleTags: ["skincare", "flatlay", "pastel"] },
  { title: "Interior Design Render — Warm Scandinavian", imageType: "Interior", styleTags: ["interior", "scandi", "warm"] },
  { title: "Cosmetic Product Advertisement — Glass & Gold", imageType: "Product", styleTags: ["cosmetic", "luxury", "glass"] },
  { title: "Fantasy Environment Concept — Twilight Forest", imageType: "Concept", styleTags: ["fantasy", "environment", "painterly"] },
];

export const listings: Listing[] = listingSeeds.map((seed, i) => {
  const model = models[i % models.length];
  const creator = ["u_creator1", "u_creator2", "u_creator3"][i % 3];
  const price = [900, 1200, 1500, 1800, 2400, 3200][i % 6];
  return {
    id: `l_${i + 1}`,
    creatorId: creator,
    title: seed.title,
    description: `A tested, reproducible recipe for ${seed.title.toLowerCase()}. Includes prompt, settings, and usage notes.`,
    model: model.m,
    modelVersion: model.v,
    aspectRatio: ["1:1", "3:2", "16:9", "4:5"][i % 4],
    imageType: seed.imageType,
    styleTags: [...(seed.styleTags ?? []), "pickture-demo"],
    usageRights: (["personal", "commercial", "extended"] as const)[i % 3],
    priceCents: price,
    partialPromptPreview: "",
    consistencyScore: 78 + ((i * 7) % 20),
    avgRating: Number((4.2 + ((i * 3) % 8) / 10).toFixed(1)),
    ratingCount: 12 + i * 5,
    salesCount: 20 + i * 11,
    status: "published",
    previewImages: [],
    createdAt: daysAgo(60 - i * 3),
  };
});

export const recipeSecrets: RecipeSecret[] = listings.map((l) => ({
  listingId: l.id,
  fullPrompt: `tested recipe for ${l.title.toLowerCase()}, ${l.styleTags.filter((t) => t !== "pickture-demo").join(", ")}, editorial composition, negative space, warm neutral palette`,
  negativePrompt: "low-res, watermark, deformed, extra fingers, oversaturated, hdr",
  settings: { aspect_ratio: l.aspectRatio, quality: "high" },
  usageNotes: "Keep aspect ratio locked. Regenerate 3–4 variants and pick the sharpest.",
}));

export const purchases: Purchase[] = [
  { id: "p1", buyerId: "u_buyer", listingId: "l_1", priceCents: 900, status: "completed", purchasedAt: daysAgo(10) },
  { id: "p2", buyerId: "u_buyer", listingId: "l_4", priceCents: 1800, status: "completed", purchasedAt: daysAgo(6) },
  { id: "p3", buyerId: "u_buyer2", listingId: "l_3", priceCents: 1500, status: "completed", purchasedAt: daysAgo(4) },
];

export const reviews: Review[] = [
  { id: "r1", purchaseId: "p1", listingId: "l_1", buyerId: "u_buyer", rating: 5, comment: "Reproduced exactly. Went straight into our catalog.", createdAt: daysAgo(9) },
  { id: "r2", purchaseId: "p2", listingId: "l_4", buyerId: "u_buyer", rating: 4, comment: "Beautiful lighting. Needed one seed tweak.", createdAt: daysAgo(5) },
  { id: "r3", purchaseId: "p3", listingId: "l_3", buyerId: "u_buyer2", rating: 5, comment: "Consistency score was accurate.", createdAt: daysAgo(3) },
];

export const requests: CustomRequest[] = [
  { id: "req1", buyerId: "u_buyer", title: "Skincare launch — 6 hero shots", brief: "Bone-white background, warm shadows, minimal props, consistent across 6 SKUs.", modelPreference: "ChatGPT Images 2", budgetCents: 40000, deadline: daysAgo(-7), usageRights: "commercial", status: "open", offerCount: 2, createdAt: daysAgo(2) },
  { id: "req2", buyerId: "u_buyer2", title: "Cinematic sneaker campaign", brief: "Moody urban, wet concrete, single figure, 3 aspect ratios.", modelPreference: "Midjourney V7", budgetCents: 25000, deadline: daysAgo(-10), usageRights: "commercial", status: "open", offerCount: 2, createdAt: daysAgo(1) },
  { id: "req3", buyerId: "u_buyer", title: "Architectural exterior — coastal", brief: "Late-afternoon light, calm ocean, no people, 16:9.", budgetCents: 18000, deadline: daysAgo(-14), usageRights: "personal", status: "open", offerCount: 1, createdAt: daysAgo(3) },
];

export const offers: Offer[] = [
  { id: "of1", requestId: "req1", creatorId: "u_creator1", message: "I have a matching editorial recipe already tested on 8 SKUs.", priceCents: 38000, etaDays: 4, status: "pending", createdAt: daysAgo(1) },
  { id: "of2", requestId: "req1", creatorId: "u_creator3", message: "Can deliver in 6 days with revisions.", priceCents: 32000, etaDays: 6, status: "pending", createdAt: daysAgo(1) },
  { id: "of3", requestId: "req2", creatorId: "u_creator2", message: "Cinematic sneaker is my main category.", priceCents: 24000, etaDays: 5, status: "pending", createdAt: daysAgo(1) },
  { id: "of4", requestId: "req2", creatorId: "u_creator1", message: "Alternative editorial angle available.", priceCents: 26000, etaDays: 4, status: "pending", createdAt: daysAgo(1) },
  { id: "of5", requestId: "req3", creatorId: "u_creator3", message: "Architectural is my specialty.", priceCents: 17000, etaDays: 7, status: "pending", createdAt: daysAgo(2) },
];

export const chatMessages: ChatMessage[] = [
  { id: "c1", requestId: "req1", authorId: "u_buyer", body: "How consistent will the shadow direction be across all 6?", createdAt: daysAgo(1) },
  { id: "c2", requestId: "req1", authorId: "u_creator1", body: "Locked seed + fixed camera angle. Consistency score above 90.", createdAt: daysAgo(1) },
  { id: "c3", requestId: "req2", authorId: "u_buyer2", body: "Can you deliver 1:1 and 9:16 versions?", createdAt: daysAgo(1) },
  { id: "c4", requestId: "req2", authorId: "u_creator2", body: "Yes — same recipe, adjusted crop.", createdAt: daysAgo(1) },
];

export const deliveries: Delivery[] = [];

export const reports: Report[] = [
  { id: "rep1", listingId: "l_2", reporterId: "u_buyer2", reason: "Preview does not match generated output.", status: "open", createdAt: daysAgo(2) },
  { id: "rep2", listingId: "l_7", reporterId: "u_buyer", reason: "Suspected copied prompt.", status: "reviewing", createdAt: daysAgo(4) },
  { id: "rep3", listingId: "l_9", reporterId: "u_buyer2", reason: "Usage rights unclear.", status: "actioned", createdAt: daysAgo(9) },
  { id: "rep4", listingId: "l_11", reporterId: "u_buyer", reason: "Duplicate listing.", status: "dismissed", createdAt: daysAgo(15) },
];

const eventTypes: LogEventType[] = [
  "login", "prompt_upload", "purchase", "image_generation", "ai_assistant_request",
  "voice_usage", "email_sent", "api_failure", "listing_reported", "admin_action",
];
const levels: LogLevel[] = ["info", "info", "info", "warn", "error"];

export const logs: LogEvent[] = Array.from({ length: 42 }, (_, i) => {
  const et = eventTypes[i % eventTypes.length];
  const lvl = et === "api_failure" ? "error" : levels[i % levels.length];
  return {
    id: `log_${i + 1}`,
    eventType: et,
    level: lvl,
    actorId: ["u_buyer", "u_buyer2", "u_creator1", "u_creator2", "u_admin"][i % 5],
    entityType: "listing",
    entityId: `l_${(i % 15) + 1}`,
    payload: { note: `Auto-generated ${et} event`, ip: "10.0.0." + ((i * 7) % 250) },
    createdAt: daysAgo(i * 0.7),
  };
});

export const notifications: Notification[] = [];
