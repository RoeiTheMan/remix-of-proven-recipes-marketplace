import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { getListing, getListingImages } from "@/services/listingsService";
import { getReviews } from "@/services/reviewsService";
import { simulatePurchase, getPurchases } from "@/services/purchasesService";
import { useAuth } from "@/context/AuthContext";
import { ImagePlaceholder } from "@/components/ImagePlaceholder";
import { ConsistencyBadge } from "@/components/ConsistencyBadge";
import { ReviewStars } from "@/components/ReviewStars";
import { PurchaseDialog } from "@/components/PurchaseDialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Flag, Lock, Check } from "lucide-react";
import { getDemoListingArtwork } from "@/lib/demoArtwork";

export const Route = createFileRoute("/listing/$id")({ component: ListingDetail });

function ListingDetail() {
  const { id } = Route.useParams();
  const { role, user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data } = useQuery({ queryKey: ["listing", id], queryFn: () => getListing(id) });
  const { data: reviews = [] } = useQuery({ queryKey: ["reviews", id], queryFn: () => getReviews(id) });
  const { data: purchases = [] } = useQuery({
    queryKey: ["purchases", user?.id],
    queryFn: () => (user ? getPurchases(user.id) : Promise.resolve([])),
    enabled: !!user,
  });
  const { data: gallery = [] } = useQuery({
    queryKey: ["listing-images", id],
    queryFn: () => getListingImages(id),
  });

  if (!data?.listing) return <div className="max-w-7xl mx-auto px-6 py-16">Loading…</div>;
  const { listing, secret } = data;
  const purchased = purchases.some((p) => p.listing.id === listing.id);

  const heroSrc = gallery[0]?.signedUrl || getDemoListingArtwork(listing);
  const thumbs = gallery.slice(1, 5).map((g) => g.signedUrl);

  async function handleBuy() {
    if (!user || role !== "buyer") { toast("Switch to Buyer role to purchase."); setOpen(false); return; }
    await simulatePurchase(listing.id, user.id);
    setOpen(false);
    toast.success("Purchase complete. Recipe unlocked.");
    qc.invalidateQueries();
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 grid lg:grid-cols-12 gap-10">
      <div className="lg:col-span-7">
        <div className="mx-auto max-w-[520px]">
          <ImagePlaceholder id={heroSrc} label={listing.imageType} ratio="aspect-[4/5]" />
          {thumbs.length > 0 && (
            <div className="grid grid-cols-4 gap-2 mt-2">
              {thumbs.map((src, i) => (
                <ImagePlaceholder key={i} id={src} ratio="aspect-square" />
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="lg:col-span-5">
        <span className="label-eyebrow">{listing.imageType}</span>
        <h1 className="font-display text-4xl mt-2 leading-tight">{listing.title}</h1>
        <div className="mt-3 flex items-center gap-3">
          <ReviewStars rating={listing.avgRating} count={listing.ratingCount} />
          <span className="text-xs text-neutral-gray">{listing.salesCount} sales</span>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Badge variant="outline">{listing.model} {listing.modelVersion}</Badge>
          <Badge variant="outline">{listing.aspectRatio}</Badge>
          <Badge variant="outline" className="capitalize">{listing.usageRights} rights</Badge>
          <ConsistencyBadge score={listing.consistencyScore} size="md" />
        </div>

        <div className="mt-6 flex items-center justify-between border-t border-b border-ink py-4">
          <span className="font-mono text-2xl">${(listing.priceCents / 100).toFixed(2)}</span>
          {purchased ? (
            <Button asChild variant="teal"><Link to="/purchases">View in library</Link></Button>
          ) : (
            <Button variant="signal" size="lg" onClick={() => setOpen(true)}>Buy Recipe</Button>
          )}
        </div>

        <Tabs defaultValue="overview" className="mt-6">
          <TabsList className="w-full justify-start bg-transparent border-b border-border rounded-none p-0 h-auto">
            {[
              { v: "overview", label: "Overview" },
              { v: "included", label: "What's Included" },
              { v: "reviews", label: "Reviews" },
              { v: "license", label: "License" },
            ].map((t) => (
              <TabsTrigger key={t.v} value={t.v} className="rounded-none border-b-2 border-transparent data-[state=active]:border-ink data-[state=active]:bg-transparent">
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="overview" className="pt-4 text-sm text-ink/80 leading-relaxed">
            {listing.description}
            <div className="mt-4 flex flex-wrap gap-2">
              {listing.styleTags.filter((t) => t !== "pickture-demo").map((t) => (
                <span key={t} className="text-xs uppercase tracking-wider border border-border px-2 py-1">{t}</span>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="included" className="pt-4">
            <IncludedPanel
              listing={listing}
              purchased={purchased}
              secret={secret ?? null}
            />
          </TabsContent>

          <TabsContent value="reviews" className="pt-4 space-y-3">
            {reviews.length === 0 && <p className="text-sm text-neutral-gray">No reviews yet.</p>}
            {reviews.map((r) => (
              <div key={r.id} className="border border-border p-4">
                <div className="flex items-center gap-2">
                  <ReviewStars rating={r.rating} />
                  <span className="text-[11px] uppercase tracking-wider text-teal border border-teal px-1.5">Verified buyer</span>
                </div>
                <p className="text-sm mt-2">{r.comment}</p>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="license" className="pt-4 text-sm text-ink/80">
            <p className="capitalize"><strong>{listing.usageRights}</strong> usage rights included.</p>
            <p className="mt-2 text-neutral-gray">Full license terms will render here.</p>
          </TabsContent>
        </Tabs>

        <button
          onClick={() => toast("Report submitted for review.")}
          className="mt-6 inline-flex items-center gap-2 text-xs text-neutral-gray hover:text-ink"
        >
          <Flag className="h-3 w-3" /> Report this listing
        </button>
      </div>

      <PurchaseDialog listing={listing} open={open} onOpenChange={setOpen} onConfirm={handleBuy} />
    </div>
  );
}

interface IncludedPanelProps {
  listing: { model: string; modelVersion: string; aspectRatio: string; usageRights: string; consistencyScore: number };
  purchased: boolean;
  secret: { fullPrompt: string; negativePrompt: string; settings: Record<string, string | number>; usageNotes: string } | null;
}

function IncludedPanel({ listing, purchased, secret }: IncludedPanelProps) {
  const items = [
    "Full generation prompt",
    "Negative prompt",
    `Model and version — ${listing.model} ${listing.modelVersion}`,
    "Recommended settings",
    `Aspect ratio — ${listing.aspectRatio}`,
    "Usage notes",
    `${listing.usageRights === "personal" ? "Personal" : "Commercial"} license`,
    `Consistency score — ${listing.consistencyScore}`,
    "Example outputs",
  ];

  return (
    <div className="space-y-4">
      <ul className="border border-border bg-card divide-y divide-border">
        {items.map((label) => (
          <li key={label} className="flex items-center gap-3 px-4 py-2.5 text-sm">
            <Check className="h-4 w-4 text-teal shrink-0" />
            <span className="text-ink">{label}</span>
          </li>
        ))}
      </ul>

      {purchased && secret ? (
        <div className="space-y-3">
          <div>
            <div className="label-eyebrow mb-1">Full prompt</div>
            <pre className="whitespace-pre-wrap font-mono text-sm bg-secondary border border-border p-4">{secret.fullPrompt}</pre>
          </div>
          {secret.negativePrompt && (
            <div>
              <div className="label-eyebrow mb-1">Negative prompt</div>
              <pre className="whitespace-pre-wrap font-mono text-sm bg-secondary border border-border p-4">{secret.negativePrompt}</pre>
            </div>
          )}
          {Object.keys(secret.settings ?? {}).length > 0 && (
            <div>
              <div className="label-eyebrow mb-1">Settings</div>
              <pre className="whitespace-pre-wrap font-mono text-xs bg-secondary border border-border p-4">
{JSON.stringify(secret.settings, null, 2)}
              </pre>
            </div>
          )}
          {secret.usageNotes && (
            <div>
              <div className="label-eyebrow mb-1">Usage notes</div>
              <p className="text-sm bg-secondary border border-border p-4">{secret.usageNotes}</p>
            </div>
          )}
        </div>
      ) : (
        <div className="border border-ink bg-warm/60 p-5 flex items-start gap-3">
          <Lock className="h-4 w-4 text-ink shrink-0 mt-0.5" />
          <p className="text-sm text-ink">
            Purchase this recipe to unlock the complete prompt, negative prompt, settings, and usage notes.
          </p>
        </div>
      )}
    </div>
  );
}
