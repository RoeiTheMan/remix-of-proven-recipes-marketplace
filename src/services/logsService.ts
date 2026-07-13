// Real Lovable Cloud logs service. RLS restricts SELECT to admins only.
import { supabase } from "@/integrations/supabase/client";
import type { LogEventType, LogLevel, LogEvent } from "@/types";
import { mapLogRow } from "./_mappers";

export interface LogFilters {
  eventType?: LogEventType;
  level?: LogLevel;
  actorId?: string;
  since?: string;
}

export async function query(filters: LogFilters = {}): Promise<LogEvent[]> {
  let q = supabase.from("logs").select("*").order("created_at", { ascending: false }).limit(500);
  if (filters.eventType) q = q.eq("event_type", filters.eventType);
  if (filters.level) q = q.eq("level", filters.level);
  if (filters.actorId) q = q.eq("actor_id", filters.actorId);
  if (filters.since) q = q.gte("created_at", filters.since);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []).map(mapLogRow);
}
