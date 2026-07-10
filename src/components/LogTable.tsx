import type { LogEvent } from "@/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "./ui/sheet";

const levelColor: Record<string, string> = {
  info: "text-ink",
  warn: "text-[oklch(0.65_0.15_75)]",
  error: "text-destructive",
};

export function LogTable({ logs }: { logs: LogEvent[] }) {
  return (
    <div className="border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-40">Date</TableHead>
            <TableHead>Event</TableHead>
            <TableHead className="w-20">Level</TableHead>
            <TableHead>Actor</TableHead>
            <TableHead>Entity</TableHead>
            <TableHead className="w-16"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.map((l) => (
            <TableRow key={l.id}>
              <TableCell className="font-mono text-xs">{new Date(l.createdAt).toLocaleString()}</TableCell>
              <TableCell className="font-medium">{l.eventType}</TableCell>
              <TableCell className={"uppercase tracking-wider text-[11px] " + (levelColor[l.level] ?? "")}>{l.level}</TableCell>
              <TableCell className="font-mono text-xs">{l.actorId ?? "—"}</TableCell>
              <TableCell className="font-mono text-xs">{l.entityType}:{l.entityId}</TableCell>
              <TableCell>
                <Sheet>
                  <SheetTrigger className="text-xs underline underline-offset-4">view</SheetTrigger>
                  <SheetContent>
                    <SheetHeader><SheetTitle className="font-display">Log payload</SheetTitle></SheetHeader>
                    <pre className="mt-4 text-xs bg-secondary p-3 border border-border overflow-auto font-mono">{JSON.stringify(l, null, 2)}</pre>
                  </SheetContent>
                </Sheet>
              </TableCell>
            </TableRow>
          ))}
          {logs.length === 0 && (
            <TableRow><TableCell colSpan={6} className="text-center text-neutral-gray py-8">No events.</TableCell></TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
