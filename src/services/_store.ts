// Mock implementation — replace with Supabase in M1.
// Central in-memory mutable store cloned from mocks. Reset on refresh.
import * as seeds from "@/mocks";
import type { LogEvent, LogEventType, LogLevel } from "@/types";

export const db = {
  profiles: [...seeds.profiles],
  creatorProfiles: [...seeds.creatorProfiles],
  listings: seeds.listings.map((l) => ({ ...l })),
  recipeSecrets: seeds.recipeSecrets.map((r) => ({ ...r })),
  purchases: seeds.purchases.map((p) => ({ ...p })),
  reviews: seeds.reviews.map((r) => ({ ...r })),
  requests: seeds.requests.map((r) => ({ ...r })),
  offers: seeds.offers.map((o) => ({ ...o })),
  chatMessages: seeds.chatMessages.map((m) => ({ ...m })),
  deliveries: [...seeds.deliveries],
  reports: seeds.reports.map((r) => ({ ...r })),
  logs: seeds.logs.map((l) => ({ ...l })),
  notifications: [...seeds.notifications],
};

export const delay = (ms = 220) => new Promise<void>((r) => setTimeout(r, ms));
export const uid = (p = "id") => `${p}_${Math.random().toString(36).slice(2, 9)}`;

export function pushLog(input: {
  eventType: LogEventType;
  level?: LogLevel;
  actorId?: string;
  entityType?: string;
  entityId?: string;
  payload?: Record<string, unknown>;
}) {
  const ev: LogEvent = {
    id: uid("log"),
    level: input.level ?? "info",
    payload: input.payload ?? {},
    createdAt: new Date().toISOString(),
    eventType: input.eventType,
    actorId: input.actorId,
    entityType: input.entityType,
    entityId: input.entityId,
  };
  db.logs.unshift(ev);
  return ev;
}
