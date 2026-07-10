import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { getListing } from "@/services/listingsService";
import { getReviews, createReview } from "@/services/reviewsService";
import { simulatePurchase, getPurchases } from "@/services/purchasesService";
import { useAuth } from "@/context/AuthContext";
import { ImagePlaceholder } from "@/components/ImagePlaceholder";
import { ConsistencyBadge } from "@/components/ConsistencyBadge";
import { ReviewStars } from "@/components/ReviewStars";
import { RecipePreviewLock } from "@/components/RecipePreviewLock";
import { PurchaseDialog } from "@/components/PurchaseDialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Flag } from "lucide-react";

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

  if (!data?.listing) return <div className="max-w-7xl mx-auto px-6 py-16">Loading…</div>;
  const { listing, secret } = data;
  const purchased = purchases.some((p) => p.listing.id === listing.id);

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
        <ImagePlaceholder id={listing.previewImages[0]} label={listing.imageType} ratio="aspect-[4/5]" />
        <div className="grid grid-cols-4 gap-2 mt-2">
          {[1, 2, 3, 4].map((i) => <ImagePlaceholder key={i} id={`ph-${((i + parseInt(id.replace(/\D/g, "")) || 1) % 6) + 1}`} ratio="aspect-square" />)}
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
            {["overview", "recipe", "reviews", "license"].map((t) => (
              <TabsTrigger key={t} value={t} className="capitalize rounded-none border-b-2 border-transparent data-[state=active]:border-ink data-[state=active]:bg-transparent">
                {t === "recipe" ? "Recipe preview" : t}
              </TabsTrigger>
            ))}
          </TabsList>
          <TabsContent value="overview" className="pt-4 text-sm text-ink/80 leading-relaxed">
            {listing.description}
            <div className="mt-4 flex flex-wrap gap-2">
              {listing.styleTags.map((t) => <span key={t} className="text-xs uppercase tracking-wider border border-border px-2 py-1">{t}</span>)}
            </div>
          </TabsContent>
          <TabsContent value="recipe" className="pt-4">
            {purchased && secret ? (
              <pre className="whitespace-pre-wrap font-mono text-sm bg-secondary border border-border p-4">{secret.fullPrompt}</pre>
            ) : (
              <RecipePreviewLock preview={listing.partialPromptPreview} />
            )}
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
