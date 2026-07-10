import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { query, type LogFilters } from "@/services/logsService";
import { LogTable } from "@/components/LogTable";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import type { LogEventType, LogLevel } from "@/types";

export const Route = createFileRoute("/admin/logs")({ component: AdminLogs });

const EVENTS: LogEventType[] = ["login", "prompt_upload", "purchase", "image_generation", "ai_assistant_request", "voice_usage", "email_sent", "api_failure", "listing_reported", "admin_action"];
const LEVELS: LogLevel[] = ["info", "warn", "error"];

function AdminLogs() {
  const [filters, setFilters] = useState<LogFilters>({});
  const { data = [] } = useQuery({ queryKey: ["logs", filters], queryFn: () => query(filters) });

  return (
    <div>
      <span className="label-eyebrow">Observability</span>
      <h1 className="font-display text-4xl mt-2 mb-6">Event log</h1>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
        <Select value={filters.eventType ?? "all"} onValueChange={(v) => setFilters({ ...filters, eventType: v === "all" ? undefined : (v as LogEventType) })}>
          <SelectTrigger><SelectValue placeholder="Event type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All events</SelectItem>
            {EVENTS.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filters.level ?? "all"} onValueChange={(v) => setFilters({ ...filters, level: v === "all" ? undefined : (v as LogLevel) })}>
          <SelectTrigger><SelectValue placeholder="Level" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All levels</SelectItem>
            {LEVELS.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
          </SelectContent>
        </Select>
        <Input placeholder="Actor id" value={filters.actorId ?? ""} onChange={(e) => setFilters({ ...filters, actorId: e.target.value || undefined })} />
        <Input type="date" onChange={(e) => setFilters({ ...filters, since: e.target.value ? new Date(e.target.value).toISOString() : undefined })} />
      </div>
      <LogTable logs={data} />
    </div>
  );
}
