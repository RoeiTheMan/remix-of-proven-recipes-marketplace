import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getReports, resolveReport, removeListingAdmin, suspendCreator } from "@/services/adminService";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import type { ReportStatus } from "@/types";

export const Route = createFileRoute("/admin/reports")({ component: AdminReports });

const statusColor: Record<ReportStatus, string> = {
  open: "text-signal",
  reviewing: "text-ink",
  actioned: "text-teal",
  dismissed: "text-neutral-gray",
};

function AdminReports() {
  const { data = [] } = useQuery({ queryKey: ["reports"], queryFn: getReports });
  const qc = useQueryClient();

  // The queue only shows reports still needing a decision. Dismissing or
  // actioning a report resolves it, so it drops out of the list.
  const active = data.filter(
    ({ report }) => report.status === "open" || report.status === "reviewing",
  );

  async function resolve(id: string, status: ReportStatus) {
    await resolveReport(id, status);
    toast.success(`Report ${status}`);
    qc.invalidateQueries();
  }

  async function removeAndAction(id: string, listingId: string) {
    await removeListingAdmin(listingId);
    await resolveReport(id, "actioned");
    toast.success("Listing removed");
    qc.invalidateQueries();
  }

  return (
    <div>
      <span className="label-eyebrow">Reports queue</span>
      <h1 className="font-display text-4xl mt-2 mb-6">Trust & safety</h1>
      <div className="border border-border bg-card">
        <Table>
          <TableHeader><TableRow>
            <TableHead>Reason</TableHead><TableHead>Listing</TableHead><TableHead>Reporter</TableHead>
            <TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {active.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-neutral-gray py-10">
                  No open reports. The queue is clear.
                </TableCell>
              </TableRow>
            )}
            {active.map(({ report, listing, reporter }) => (
              <TableRow key={report.id}>
                <TableCell className="max-w-md">{report.reason}</TableCell>
                <TableCell className="font-mono text-xs">{listing?.title ?? report.listingId}</TableCell>
                <TableCell className="text-xs">{reporter?.displayName ?? "—"}</TableCell>
                <TableCell className={"label-eyebrow " + statusColor[report.status]}>{report.status}</TableCell>
                <TableCell className="text-right space-x-2">
                  <Button size="sm" variant="destructive" onClick={() => removeAndAction(report.id, report.listingId)}>Remove listing</Button>
                  <Button size="sm" variant="outline" onClick={() => resolve(report.id, "dismissed")}>Dismiss</Button>
                  {listing && <Button size="sm" variant="ghost" onClick={async () => { await suspendCreator(listing.creatorId); toast.success("Creator suspended"); qc.invalidateQueries(); }}>Suspend creator</Button>}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
