import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getCreators, suspendCreator } from "@/services/adminService";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/creators")({ component: AdminCreators });

function AdminCreators() {
  const { data = [] } = useQuery({ queryKey: ["creators"], queryFn: getCreators });
  const qc = useQueryClient();

  return (
    <div>
      <span className="label-eyebrow">Creators</span>
      <h1 className="font-display text-4xl mt-2 mb-6">All creators</h1>
      <div className="border border-border bg-card">
        <Table>
          <TableHeader><TableRow>
            <TableHead>Creator</TableHead><TableHead>Bio</TableHead>
            <TableHead className="text-right">Reliability</TableHead>
            <TableHead className="text-right">Sales</TableHead>
            <TableHead className="text-right">Rating</TableHead>
            <TableHead className="text-right">Reports</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {data.map(({ creator, profile }) => (
              <TableRow key={creator.id}>
                <TableCell className="font-medium">{profile.displayName} <span className="text-neutral-gray">@{profile.handle}</span></TableCell>
                <TableCell className="text-sm max-w-md">{creator.bio}</TableCell>
                <TableCell className="text-right text-teal">{creator.reliabilityScore}</TableCell>
                <TableCell className="text-right">{creator.totalSales}</TableCell>
                <TableCell className="text-right">{creator.avgRating.toFixed(1)}</TableCell>
                <TableCell className="text-right">{creator.reportCount}</TableCell>
                <TableCell className="text-right">
                  {creator.suspended
                    ? <span className="label-eyebrow text-destructive">Suspended</span>
                    : <Button size="sm" variant="destructive" onClick={async () => { await suspendCreator(profile.id); toast.success("Creator suspended"); qc.invalidateQueries(); }}>Suspend</Button>}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
