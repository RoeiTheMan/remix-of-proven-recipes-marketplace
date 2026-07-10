// Mock implementation — replace with Supabase in M1.
import { db, delay } from "./_store";
import type { LogEventType, LogLevel } from "@/types";

export interface LogFilters {
  eventType?: LogEventType;
  level?: LogLevel;
  actorId?: string;
  since?: string;
}

export async function query(filters: LogFilters = {}) {
  await delay();
  let out = [...db.logs];
  if (filters.eventType) out = out.filter((l) => l.eventType === filters.eventType);
  if (filters.level) out = out.filter((l) => l.level === filters.level);
  if (filters.actorId) out = out.filter((l) => l.actorId === filters.actorId);
  if (filters.since) out = out.filter((l) => l.createdAt >= filters.since!);
  return out.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
}
