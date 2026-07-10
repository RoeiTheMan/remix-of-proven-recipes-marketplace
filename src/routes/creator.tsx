import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { getListingsByCreator, createListing } from "@/services/listingsService";
import { useAuth } from "@/context/AuthContext";
import { StatCard } from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Wand2 } from "lucide-react";
import type { UsageRights } from "@/types";

export const Route = createFileRoute("/creator")({ component: Creator });

function Creator() {
  const { user, role } = useAuth();
  const qc = useQueryClient();
  const { data: listings = [] } = useQuery({
    queryKey: ["creator-listings", user?.id],
    queryFn: () => (user ? getListingsByCreator(user.id) : Promise.resolve([])),
    enabled: !!user,
  });

  if (role !== "creator") return <div className="max-w-3xl mx-auto px-6 py-16"><h1 className="font-display text-3xl">Creator only</h1><p className="text-neutral-gray mt-2">Switch to Creator role to open your dashboard.</p></div>;

  const published = listings.filter((l) => l.status === "published");
  const sales = published.reduce((s, l) => s + l.salesCount, 0);
  const revenue = published.reduce((s, l) => s + l.salesCount * l.priceCents, 0);
  const avgRating = published.length ? published.reduce((s, l) => s + l.avgRating, 0) / published.length : 0;
  const avgConsistency = published.length ? Math.round(published.reduce((s, l) => s + l.consistencyScore, 0) / published.length) : 0;

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      <div className="flex items-end justify-between">
        <div>
          <span className="label-eyebrow">Creator dashboard</span>
          <h1 className="font-display text-4xl mt-2">{user?.displayName}</h1>
        </div>
        <NewListingDialog onCreated={() => qc.invalidateQueries()} />
      </div>

      <div className="mt-8 grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard label="Published recipes" value={published.length} />
        <StatCard label="Sales" value={sales} />
        <StatCard label="Revenue" value={`$${(revenue / 100).toFixed(0)}`} accent="signal" />
        <StatCard label="Avg rating" value={avgRating.toFixed(2)} />
        <StatCard label="Avg consistency" value={avgConsistency} accent="teal" />
      </div>

      <div className="mt-10 border border-border bg-card">
        <div className="border-b border-border px-4 py-2 label-eyebrow">Your listings</div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Model</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="text-right">Sales</TableHead>
              <TableHead className="text-right">Rating</TableHead>
              <TableHead className="text-right">Consistency</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {listings.map((l) => (
              <TableRow key={l.id}>
                <TableCell className="font-medium">{l.title}</TableCell>
                <TableCell>{l.model} {l.modelVersion}</TableCell>
                <TableCell className="label-eyebrow">{l.status}</TableCell>
                <TableCell className="text-right font-mono">${(l.priceCents / 100).toFixed(2)}</TableCell>
                <TableCell className="text-right">{l.salesCount}</TableCell>
                <TableCell className="text-right">{l.avgRating.toFixed(1)}</TableCell>
                <TableCell className="text-right text-teal">{l.consistencyScore}</TableCell>
              </TableRow>
            ))}
            {listings.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-neutral-gray py-8">No listings yet.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function NewListingDialog({ onCreated }: { onCreated: () => void }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    title: "", description: "", model: "Midjourney", modelVersion: "v6.1",
    aspectRatio: "3:2", imageType: "Product Shot", styleTags: "editorial, product",
    usageRights: "commercial" as UsageRights, priceCents: 1500, consistencyScore: 90,
    fullPrompt: "", negativePrompt: "low-res, watermark, deformed", usageNotes: "",
    settings: { steps: 32, cfg: 6.5, sampler: "DPM++ 2M Karras" },
  });

  async function submit() {
    if (!user) return;
    await createListing({
      creatorId: user.id,
      title: form.title, description: form.description,
      model: form.model, modelVersion: form.modelVersion,
      aspectRatio: form.aspectRatio, imageType: form.imageType,
      styleTags: form.styleTags.split(",").map((s) => s.trim()).filter(Boolean),
      usageRights: form.usageRights, priceCents: form.priceCents,
      partialPromptPreview: "", consistencyScore: form.consistencyScore,
      previewImages: ["ph-2"],
      fullPrompt: form.fullPrompt, negativePrompt: form.negativePrompt,
      settings: form.settings, usageNotes: form.usageNotes,
    });
    toast.success("Listing published");
    setOpen(false); setStep(1); onCreated();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button variant="signal">New listing</Button></DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle className="font-display">New listing — step {step} of 4</DialogTitle></DialogHeader>
        {step === 1 && (
          <div className="space-y-3">
            <Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Model</Label>
                <Select value={form.model} onValueChange={(v) => setForm({ ...form, model: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{["Midjourney", "Flux", "SDXL", "DALL-E", "Gemini Image"].map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Version</Label><Input value={form.modelVersion} onChange={(e) => setForm({ ...form, modelVersion: e.target.value })} /></div>
            </div>
          </div>
        )}
        {step === 2 && (
          <div className="space-y-3">
            <Label>Full prompt</Label><Textarea rows={4} value={form.fullPrompt} onChange={(e) => setForm({ ...form, fullPrompt: e.target.value })} />
            <Label>Negative prompt</Label><Textarea rows={2} value={form.negativePrompt} onChange={(e) => setForm({ ...form, negativePrompt: e.target.value })} />
            <Label>Usage notes</Label><Textarea rows={2} value={form.usageNotes} onChange={(e) => setForm({ ...form, usageNotes: e.target.value })} />
          </div>
        )}
        {step === 3 && (
          <div className="space-y-3">
            <Label>Preview image</Label>
            <div className="border border-dashed border-border h-40 flex items-center justify-center text-neutral-gray text-sm">Upload placeholder (local preview only)</div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-block"><Button disabled variant="signal"><Wand2 /> Generate preview image</Button></span>
                </TooltipTrigger>
                <TooltipContent>Image API connects later.</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )}
        {step === 4 && (
          <div className="space-y-3">
            <Label>Price (cents)</Label><Input type="number" value={form.priceCents} onChange={(e) => setForm({ ...form, priceCents: parseInt(e.target.value || "0") })} />
            <Label>Usage rights</Label>
            <Select value={form.usageRights} onValueChange={(v) => setForm({ ...form, usageRights: v as UsageRights })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{["personal", "commercial", "extended"].map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        )}
        <div className="flex justify-between pt-4 border-t border-border">
          <Button variant="ghost" onClick={() => setStep(Math.max(1, step - 1))} disabled={step === 1}>Back</Button>
          {step < 4
            ? <Button onClick={() => setStep(step + 1)}>Next</Button>
            : <Button variant="signal" onClick={submit}>Publish</Button>}
        </div>
      </DialogContent>
    </Dialog>
  );
}
