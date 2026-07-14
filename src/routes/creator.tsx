import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  getListingsByCreator,
  createListing,
  updateListing,
  setListingStatus,
  deleteListing,
  getListingImages,
  uploadListingImage,
  deleteListingImage,
  setCoverImage,
  reorderImages,
  getRecipeSecret,
  type ListingImageRow,
} from "@/services/listingsService";
import { becomeCreator } from "@/services/authService";
import { useAuth } from "@/context/AuthContext";
import { StatCard } from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Star, ArrowUp, ArrowDown, Trash2, Image as ImageIcon, Eye, Pencil } from "lucide-react";
import type { Listing, UsageRights } from "@/types";
import { SUPPORTED_MODELS, modelLabel } from "@/lib/models";
import { getDemoListingArtwork } from "@/lib/demoArtwork";

export const Route = createFileRoute("/creator")({ component: Creator });

interface DraftForm {
  title: string;
  description: string;
  model: string;
  modelVersion: string;
  aspectRatio: string;
  imageType: string;
  styleTags: string;
  usageRights: UsageRights;
  priceCents: number;
  consistencyScore: number;
  fullPrompt: string;
  negativePrompt: string;
  partialPromptPreview: string;
  usageNotes: string;
  settings: { steps: number; cfg: number; sampler: string };
}

const EMPTY_FORM: DraftForm = {
  title: "", description: "", model: "midjourney-v7", modelVersion: "v7",
  aspectRatio: "3:2", imageType: "Product", styleTags: "editorial, product",
  usageRights: "commercial", priceCents: 1500, consistencyScore: 90,
  fullPrompt: "", negativePrompt: "low-res, watermark, deformed",
  partialPromptPreview: "", usageNotes: "",
  settings: { steps: 32, cfg: 6.5, sampler: "default" },
};

function Creator() {
  const { user, isSignedIn, isCreator, refresh, loading } = useAuth();
  const qc = useQueryClient();
  const { data: listings = [] } = useQuery({
    queryKey: ["creator-listings", user?.id],
    queryFn: () => (user ? getListingsByCreator(user.id) : Promise.resolve([])),
    enabled: !!user && isCreator,
  });

  if (loading) return <div className="max-w-3xl mx-auto px-6 py-16 text-neutral-gray">Loading…</div>;

  if (!isSignedIn) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-16">
        <span className="label-eyebrow">Creator</span>
        <h1 className="font-display text-4xl mt-2">Sign in to sell recipes</h1>
        <p className="text-neutral-gray mt-2">You need an account before publishing to the marketplace.</p>
        <Button asChild className="mt-6" variant="signal"><Link to="/auth" search={{ next: "/creator" }}>Sign in</Link></Button>
      </div>
    );
  }

  if (!isCreator) return <BecomeCreatorForm onDone={refresh} />;

  const published = listings.filter((l) => l.status === "published");
  const drafts = listings.filter((l) => l.status === "draft");
  const sales = published.reduce((s, l) => s + l.salesCount, 0);
  const revenue = published.reduce((s, l) => s + l.salesCount * l.priceCents, 0);
  const rated = published.filter((l) => l.ratingCount > 0);
  const avgRating = rated.length ? rated.reduce((s, l) => s + l.avgRating, 0) / rated.length : 0;
  const avgConsistency = published.length ? Math.round(published.reduce((s, l) => s + l.consistencyScore, 0) / published.length) : 0;

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      <div className="flex items-end justify-between">
        <div>
          <span className="label-eyebrow">Creator dashboard</span>
          <h1 className="font-display text-4xl mt-2">{user?.displayName}</h1>
        </div>
        <ListingEditorDialog onSaved={() => qc.invalidateQueries()} />
      </div>

      <div className="mt-8 grid grid-cols-2 md:grid-cols-6 gap-4">
        <StatCard label="Published" value={published.length} />
        <StatCard label="Drafts" value={drafts.length} />
        <StatCard label="Sales" value={sales} />
        <StatCard label="Revenue" value={`$${(revenue / 100).toFixed(0)}`} accent="signal" />
        <StatCard label="Avg rating" value={rated.length ? avgRating.toFixed(2) : "—"} />
        <StatCard label="Avg consistency" value={published.length ? avgConsistency : "—"} accent="teal" />
      </div>

      <div className="mt-10 border border-border bg-card">
        <div className="border-b border-border px-4 py-2 label-eyebrow flex items-center justify-between">
          <span>Your listings</span>
          <span className="text-neutral-gray normal-case tracking-normal">{listings.length} total</span>
        </div>
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
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {listings.map((l) => (
              <ListingRow key={l.id} listing={l} onChanged={() => qc.invalidateQueries()} />
            ))}
            {listings.length === 0 && <TableRow><TableCell colSpan={8} className="text-center text-neutral-gray py-8">No listings yet.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function ListingRow({ listing, onChanged }: { listing: Listing; onChanged: () => void }) {
  const [busy, setBusy] = useState(false);
  const [imgOpen, setImgOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  async function toggle() {
    setBusy(true);
    try {
      const next = listing.status === "published" ? "draft" : "published";
      await setListingStatus(listing.id, next);
      toast.success(next === "published" ? "Listing published" : "Moved to draft");
      onChanged();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to change status");
    } finally { setBusy(false); }
  }

  async function remove() {
    if (!confirm(`Delete "${listing.title}"? This can't be undone.`)) return;
    setBusy(true);
    try {
      await deleteListing(listing.id);
      toast.success("Listing deleted");
      onChanged();
    } catch (e) {
      const msg = e instanceof Error && e.message.includes("listing_has_purchases")
        ? "This listing has completed purchases and can't be deleted. Unpublish instead."
        : e instanceof Error ? e.message : "Delete failed";
      toast.error(msg);
    } finally { setBusy(false); }
  }

  const isRemoved = listing.status === "removed" || listing.status === "suspended";

  return (
    <TableRow>
      <TableCell className="font-medium max-w-[320px]">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 border border-border overflow-hidden bg-secondary shrink-0">
            <img src={getDemoListingArtwork(listing)} alt="" className="h-full w-full object-cover" />
          </div>
          <span className="truncate">{listing.title}</span>
        </div>
      </TableCell>
      <TableCell>{modelLabel(listing.model)} {listing.modelVersion}</TableCell>
      <TableCell className="label-eyebrow">{listing.status}</TableCell>
      <TableCell className="text-right font-mono">${(listing.priceCents / 100).toFixed(2)}</TableCell>
      <TableCell className="text-right">{listing.salesCount}</TableCell>
      <TableCell className="text-right">{listing.ratingCount > 0 ? listing.avgRating.toFixed(1) : "—"}</TableCell>
      <TableCell className="text-right text-teal">{listing.consistencyScore}</TableCell>
      <TableCell className="text-right">
        <div className="inline-flex gap-1">
          <Button asChild size="sm" variant="ghost" title="View public listing">
            <Link to="/listing/$id" params={{ id: listing.id }}><Eye className="h-4 w-4" /></Link>
          </Button>
          <Button size="sm" variant="ghost" title="Manage images" onClick={() => setImgOpen(true)}>
            <ImageIcon className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" title="Edit" onClick={() => setEditOpen(true)} disabled={isRemoved}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="outline" onClick={toggle} disabled={busy || isRemoved}>
            {listing.status === "published" ? "Unpublish" : "Publish"}
          </Button>
          <Button size="sm" variant="ghost" title="Delete" onClick={remove} disabled={busy}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
        {imgOpen && <ImageManagerDialog listing={listing} open={imgOpen} onOpenChange={setImgOpen} />}
        {editOpen && <ListingEditorDialog editing={listing} open={editOpen} onOpenChange={setEditOpen} onSaved={onChanged} />}
      </TableCell>
    </TableRow>
  );
}

function ListingEditorDialog({
  editing, open: controlledOpen, onOpenChange, onSaved,
}: {
  editing?: Listing;
  open?: boolean;
  onOpenChange?: (o: boolean) => void;
  onSaved: () => void;
}) {
  const { user } = useAuth();
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = onOpenChange ?? setUncontrolledOpen;
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<DraftForm>(EMPTY_FORM);
  const [busy, setBusy] = useState(false);

  // Load existing values when editing.
  useEffect(() => {
    if (!open) return;
    if (!editing) { setForm(EMPTY_FORM); setStep(1); return; }
    (async () => {
      const secret = await getRecipeSecret(editing.id);
      setForm({
        title: editing.title,
        description: editing.description,
        model: editing.model,
        modelVersion: editing.modelVersion,
        aspectRatio: editing.aspectRatio,
        imageType: editing.imageType,
        styleTags: editing.styleTags.join(", "),
        usageRights: editing.usageRights,
        priceCents: editing.priceCents,
        consistencyScore: editing.consistencyScore,
        partialPromptPreview: editing.partialPromptPreview,
        fullPrompt: secret?.fullPrompt ?? "",
        negativePrompt: secret?.negativePrompt ?? "",
        usageNotes: secret?.usageNotes ?? "",
        settings: {
          steps: Number(secret?.settings?.steps ?? 32),
          cfg: Number(secret?.settings?.cfg ?? 6.5),
          sampler: String(secret?.settings?.sampler ?? "DPM++ 2M Karras"),
        },
      });
      setStep(1);
    })();
  }, [open, editing]);

  async function submit(status: "draft" | "published") {
    if (!user) return;
    if (!form.title.trim() || !form.fullPrompt.trim()) {
      toast.error("Title and full prompt are required.");
      return;
    }
    setBusy(true);
    try {
      const shared = {
        title: form.title, description: form.description,
        model: form.model, modelVersion: form.modelVersion,
        aspectRatio: form.aspectRatio, imageType: form.imageType,
        styleTags: form.styleTags.split(",").map((s) => s.trim()).filter(Boolean),
        usageRights: form.usageRights, priceCents: form.priceCents,
        partialPromptPreview: form.partialPromptPreview,
        consistencyScore: form.consistencyScore,
        fullPrompt: form.fullPrompt, negativePrompt: form.negativePrompt,
        settings: form.settings as unknown as Record<string, string | number>,
        usageNotes: form.usageNotes,
      };
      if (editing) {
        await updateListing(editing.id, shared);
        if (editing.status !== status) await setListingStatus(editing.id, status);
        toast.success("Listing updated");
      } else {
        await createListing({ ...shared, creatorId: user.id, status });
        toast.success(status === "published" ? "Listing published" : "Draft saved");
      }
      setOpen(false);
      onSaved();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally { setBusy(false); }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!editing && (
        <DialogTrigger asChild><Button variant="signal">New listing</Button></DialogTrigger>
      )}
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle className="font-display">{editing ? "Edit listing" : "New listing"} — step {step} of 3</DialogTitle></DialogHeader>
        {step === 1 && (
          <div className="space-y-3">
            <Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Model</Label>
                <Select value={form.model} onValueChange={(v) => {
                  const m = SUPPORTED_MODELS.find((x) => x.value === v);
                  setForm({ ...form, model: v, modelVersion: m?.defaultVersion ?? form.modelVersion });
                }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{SUPPORTED_MODELS.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Version</Label><Input value={form.modelVersion} onChange={(e) => setForm({ ...form, modelVersion: e.target.value })} /></div>
              <div><Label>Aspect ratio</Label><Input value={form.aspectRatio} onChange={(e) => setForm({ ...form, aspectRatio: e.target.value })} /></div>
              <div><Label>Image type</Label><Input value={form.imageType} onChange={(e) => setForm({ ...form, imageType: e.target.value })} /></div>
            </div>
            <Label>Style tags (comma separated)</Label>
            <Input value={form.styleTags} onChange={(e) => setForm({ ...form, styleTags: e.target.value })} />
          </div>
        )}
        {step === 2 && (
          <div className="space-y-3">
            <Label>Full prompt (unlocked after purchase)</Label>
            <Textarea rows={5} value={form.fullPrompt} onChange={(e) => setForm({ ...form, fullPrompt: e.target.value })} />
            <p className="text-xs text-neutral-gray">The full prompt is never shown before purchase. Buyers only see structured info in “What’s Included”.</p>
            <Label>Negative prompt</Label>
            <Textarea rows={2} value={form.negativePrompt} onChange={(e) => setForm({ ...form, negativePrompt: e.target.value })} />
            <Label>Usage notes</Label>
            <Textarea rows={2} value={form.usageNotes} onChange={(e) => setForm({ ...form, usageNotes: e.target.value })} />
            <div className="grid grid-cols-3 gap-3">
              <div><Label>Steps</Label><Input type="number" value={form.settings.steps} onChange={(e) => setForm({ ...form, settings: { ...form.settings, steps: parseInt(e.target.value || "0") } })} /></div>
              <div><Label>CFG</Label><Input type="number" step="0.1" value={form.settings.cfg} onChange={(e) => setForm({ ...form, settings: { ...form.settings, cfg: parseFloat(e.target.value || "0") } })} /></div>
              <div><Label>Sampler</Label><Input value={form.settings.sampler} onChange={(e) => setForm({ ...form, settings: { ...form.settings, sampler: e.target.value } })} /></div>
            </div>
          </div>
        )}
        {step === 3 && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Price (cents)</Label><Input type="number" value={form.priceCents} onChange={(e) => setForm({ ...form, priceCents: parseInt(e.target.value || "0") })} /></div>
              <div><Label>Consistency score (0-100)</Label><Input type="number" min={0} max={100} value={form.consistencyScore} onChange={(e) => setForm({ ...form, consistencyScore: parseInt(e.target.value || "0") })} /></div>
            </div>
            <Label>Usage rights</Label>
            <Select value={form.usageRights} onValueChange={(v) => setForm({ ...form, usageRights: v as UsageRights })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{["personal", "commercial", "extended"].map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
            </Select>
            <p className="text-xs text-neutral-gray">Upload preview images after saving using the image manager on the listing row.</p>
          </div>
        )}
        <div className="flex justify-between pt-4 border-t border-border gap-2 flex-wrap">
          <Button variant="ghost" onClick={() => setStep(Math.max(1, step - 1))} disabled={step === 1 || busy}>Back</Button>
          <div className="flex gap-2">
            {step < 3 ? (
              <Button onClick={() => setStep(step + 1)} disabled={busy}>Next</Button>
            ) : (
              <>
                <Button variant="outline" onClick={() => submit("draft")} disabled={busy}>Save draft</Button>
                <Button variant="signal" onClick={() => submit("published")} disabled={busy}>{editing?.status === "published" ? "Save & keep published" : "Publish"}</Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ImageManagerDialog({
  listing, open, onOpenChange,
}: { listing: Listing; open: boolean; onOpenChange: (o: boolean) => void }) {
  const [images, setImages] = useState<ListingImageRow[]>([]);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try { setImages(await getListingImages(listing.id)); }
    finally { setLoading(false); }
  }
  useEffect(() => { if (open) load(); /* eslint-disable-next-line */ }, [open]);

  async function onFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    setBusy(true);
    try {
      for (const f of Array.from(fileList)) {
        if (f.size > 8 * 1024 * 1024) { toast.error(`${f.name} is over 8MB`); continue; }
        await uploadListingImage(listing.id, f);
      }
      await load();
      toast.success("Uploaded");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally { setBusy(false); }
  }

  async function move(idx: number, dir: -1 | 1) {
    const next = [...images];
    const j = idx + dir;
    if (j < 0 || j >= next.length) return;
    [next[idx], next[j]] = [next[j], next[idx]];
    setImages(next);
    await reorderImages(listing.id, next.map((r) => r.id));
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle className="font-display">Preview images — {listing.title}</DialogTitle></DialogHeader>
        <label className="border border-dashed border-border p-4 flex flex-col items-center gap-2 cursor-pointer hover:border-ink">
          <span className="text-sm">Drop images here or click to upload (JPG/PNG, up to 8MB each)</span>
          <input type="file" accept="image/*" multiple hidden onChange={(e) => onFiles(e.target.files)} disabled={busy} />
        </label>
        {loading ? (
          <p className="text-sm text-neutral-gray">Loading…</p>
        ) : images.length === 0 ? (
          <p className="text-sm text-neutral-gray">No images yet. Upload at least one so buyers can preview the recipe.</p>
        ) : (
          <ul className="divide-y divide-border border border-border">
            {images.map((img, idx) => (
              <li key={img.id} className="flex items-center gap-3 p-2">
                <div className="h-16 w-16 border border-border overflow-hidden bg-secondary shrink-0">
                  {img.signedUrl ? <img src={img.signedUrl} alt="" className="h-full w-full object-cover" /> : null}
                </div>
                <div className="flex-1 text-xs text-neutral-gray truncate">{img.storagePath.split("/").pop()}</div>
                {img.isCover && <span className="text-[10px] uppercase tracking-wider text-teal border border-teal px-1.5">Cover</span>}
                <Button size="sm" variant="ghost" onClick={() => move(idx, -1)} disabled={idx === 0}><ArrowUp className="h-4 w-4" /></Button>
                <Button size="sm" variant="ghost" onClick={() => move(idx, 1)} disabled={idx === images.length - 1}><ArrowDown className="h-4 w-4" /></Button>
                <Button size="sm" variant="ghost" title="Set as cover" onClick={async () => { await setCoverImage(img.id); load(); }} disabled={img.isCover}>
                  <Star className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="ghost" title="Delete" onClick={async () => { await deleteListingImage(img.id); load(); }}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}

function BecomeCreatorForm({ onDone }: { onDone: () => Promise<void> | void }) {
  const [displayName, setDisplayName] = useState("");
  const [tagline, setTagline] = useState("");
  const [portfolio, setPortfolio] = useState("");
  const [bio, setBio] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!displayName.trim() || !tagline.trim()) {
      toast.error("Display name and tagline are required.");
      return;
    }
    setBusy(true);
    try {
      await becomeCreator({ displayName, tagline, portfolioUrl: portfolio, bio });
      toast.success("You're now a Pickture creator.");
      await onDone();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not complete onboarding");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <span className="label-eyebrow">Become a creator</span>
      <h1 className="font-display text-4xl mt-2">Publish verified recipes on Pickture</h1>
      <p className="text-neutral-gray mt-3">
        Tell buyers who you are. You keep your buyer access, and unlock the creator dashboard, listings, and offers on custom requests.
      </p>
      <form onSubmit={submit} className="mt-8 space-y-4">
        <div><Label>Display name</Label><Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="mt-2" required /></div>
        <div><Label>Tagline</Label><Input value={tagline} onChange={(e) => setTagline(e.target.value)} className="mt-2" placeholder="Editorial product photographer — Midjourney v6" required /></div>
        <div><Label>Portfolio URL</Label><Input value={portfolio} onChange={(e) => setPortfolio(e.target.value)} className="mt-2" placeholder="https://…" /></div>
        <div><Label>Short bio</Label><Textarea value={bio} onChange={(e) => setBio(e.target.value)} className="mt-2" rows={4} /></div>
        <Button type="submit" variant="signal" disabled={busy}>{busy ? "Setting up…" : "Become a creator"}</Button>
      </form>
    </div>
  );
}
