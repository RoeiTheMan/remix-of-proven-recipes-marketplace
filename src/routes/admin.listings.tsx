import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { getAllListings, removeListingAdmin } from "@/services/adminService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { getDemoListingArtwork } from "@/lib/demoArtwork";
import { modelLabel } from "@/lib/models";

export const Route = createFileRoute("/admin/listings")({ component: AdminListings });

function AdminListings() {
  const { data = [] } = useQuery({ queryKey: ["all-listings"], queryFn: getAllListings });
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const filtered = data.filter((l) => !q || l.title.toLowerCase().includes(q.toLowerCase()) || l.model.toLowerCase().includes(q.toLowerCase()));

  return (
    <div>
      <span className="label-eyebrow">Listings</span>
      <h1 className="font-display text-4xl mt-2 mb-6">All marketplace listings</h1>
      <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter by title or model…" className="max-w-sm mb-4" />
      <div className="border border-border bg-card">
        <Table>
          <TableHeader><TableRow>
            <TableHead>Listing</TableHead><TableHead>Model</TableHead><TableHead>Status</TableHead>
            <TableHead className="text-right">Rating</TableHead><TableHead className="text-right">Consistency</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {filtered.map((l) => (
              <TableRow key={l.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 border border-border overflow-hidden bg-secondary shrink-0">
                      <img src={getDemoListingArtwork(l)} alt="" className="h-full w-full object-cover" />
                    </div>
                    <span className="truncate max-w-[320px]">{l.title}</span>
                  </div>
                </TableCell>
                <TableCell>{modelLabel(l.model)} {l.modelVersion}</TableCell>
                <TableCell className="label-eyebrow">{l.status}</TableCell>
                <TableCell className="text-right">{l.avgRating.toFixed(1)}</TableCell>
                <TableCell className="text-right text-teal">{l.consistencyScore}</TableCell>
                <TableCell className="text-right">
                  {l.status !== "removed" && (
                    <Button size="sm" variant="destructive" onClick={async () => { await removeListingAdmin(l.id); toast.success("Listing removed"); qc.invalidateQueries(); }}>Remove</Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

