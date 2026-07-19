import { createFileRoute, Link, useRouterState } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { getPurchase } from "@/services/purchasesService";
import { createReview } from "@/services/reviewsService";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ImagePlaceholder } from "@/components/ImagePlaceholder";
import { CreatorInline } from "@/components/CreatorInline";
import { ReviewStars } from "@/components/ReviewStars";
import { Copy, Wand2, Star } from "lucide-react";
import { getDemoListingArtwork } from "@/lib/demoArtwork";
import { modelDisplayName } from "@/lib/models";

export const Route = createFileRoute("/purchases/$id")({ component: PurchaseDetail });

function PurchaseDetail() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const { user, isSignedIn, loading } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ["purchase", id],
    queryFn: () => getPurchase(id),
    enabled: !!user,
  });
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const reviewRef = useRef<HTMLDivElement>(null);
  const commentRef = useRef<HTMLTextAreaElement>(null);
  const hash = useRouterState({ select: (s) => s.location.hash });

  useEffect(() => {
    if (data?.existingReview) {
      setRating(data.existingReview.rating);
      setComment(data.existingReview.comment);
    }
  }, [data?.existingReview]);

  useEffect(() => {
    if (hash === "review" && data && reviewRef.current) {
      reviewRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      if (!data.existingReview) {
        setTimeout(() => commentRef.current?.focus(), 300);
      }
    }
  }, [hash, data]);

  if (loading || isLoading) return <div className="max-w-4xl mx-auto px-6 py-16 text-neutral-gray">Loading…</div>;
  if (!isSignedIn) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-20">
        <h1 className="font-display text-3xl">Sign in to view this recipe</h1>
        <Button asChild className="mt-6" variant="signal">
          <Link to="/auth" search={{ next: `/purchases/${id}` }}>Sign in</Link>
        </Button>
      </div>
    );
  }
  if (!data || !data.purchase || !data.listing || !data.secret) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-20 text-center">
        <span className="label-eyebrow">Library</span>
        <h1 className="font-display text-3xl mt-2">Purchase not found</h1>
        <p className="text-neutral-gray mt-2">This purchase isn't in your library.</p>
        <Link to="/purchases" className="inline-block mt-6 underline">Back to library</Link>
      </div>
    );
  }
  const { purchase, listing, secret, existingReview } = data;
  const hasReview = !!existingReview;

  function copy(text: string) { navigator.clipboard.writeText(text); toast.success("Copied to clipboard"); }

  async function submitReview() {
    if (!user || busy || hasReview) return;
    setBusy(true);
    try {
      await createReview(id, rating, comment);
      toast.success("Verified review published.");
      qc.invalidateQueries();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "We couldn't publish your review.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 grid lg:grid-cols-3 gap-10">
      <div className="lg:col-span-2 space-y-8">
        <div>
          <span className="label-eyebrow">Recipe</span>
          <h1 className="font-display text-3xl mt-2">{listing.title}</h1>
          {listing.creator && (
            <div className="mt-2"><CreatorInline creator={listing.creator} size="md" /></div>
          )}
        </div>

        <section className="border border-border bg-card p-5 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
          <Meta label="Purchase date" value={new Date(purchase.purchasedAt).toLocaleDateString()} />
          <Meta label="Price paid" value={`$${(purchase.priceCents / 100).toFixed(2)}`} />
          <Meta label="License" value={<span className="capitalize">{listing.usageRights}</span>} />
          <Meta label="Aspect" value={listing.aspectRatio} />
          <Meta label="Model" value={modelDisplayName(listing.model, listing.modelVersion)} />
          <Meta label="Consistency" value={String(listing.consistencyScore)} />
        </section>

        <section className="border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <span className="label-eyebrow">Full prompt</span>
            <Button size="sm" variant="ghost" onClick={() => copy(secret.fullPrompt)}><Copy /> Copy</Button>
          </div>
          <pre className="whitespace-pre-wrap font-mono text-sm mt-3">{secret.fullPrompt}</pre>
        </section>

        {secret.negativePrompt && (
          <section className="border border-border bg-card p-5">
            <div className="flex items-center justify-between">
              <span className="label-eyebrow">Negative prompt</span>
              <Button size="sm" variant="ghost" onClick={() => copy(secret.negativePrompt)}><Copy /> Copy</Button>
            </div>
            <pre className="whitespace-pre-wrap font-mono text-sm mt-3">{secret.negativePrompt}</pre>
          </section>
        )}

        {Object.keys(secret.settings ?? {}).length > 0 && (
          <section className="border border-border bg-card p-5">
            <span className="label-eyebrow">Settings</span>
            <table className="w-full mt-3 text-sm">
              <tbody>
                {Object.entries(secret.settings).map(([k, v]) => (
                  <tr key={k} className="border-t border-border">
                    <td className="py-2 label-eyebrow">{k}</td>
                    <td className="py-2 font-mono">{String(v)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {secret.usageNotes && (
          <section className="border border-border bg-card p-5">
            <span className="label-eyebrow">Usage notes</span>
            <p className="text-sm mt-3 whitespace-pre-line">{secret.usageNotes}</p>
          </section>
        )}

        <section>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="label-eyebrow">Advertised example</span>
              <ImagePlaceholder id={getDemoListingArtwork(listing)} ratio="aspect-square" />
            </div>
            <div>
              <span className="label-eyebrow">Your generated result</span>
              <div className="aspect-square border border-dashed border-border flex items-center justify-center text-neutral-gray text-sm">
                Not generated yet
              </div>
            </div>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-block mt-4">
                  <Button disabled variant="signal"><Wand2 /> Generate Test Image</Button>
                </span>
              </TooltipTrigger>
              <TooltipContent>Image generation connects in a later milestone.</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </section>
      </div>

      <aside className="space-y-4">
        <div ref={reviewRef} id="review" className="border border-border bg-card p-5 scroll-mt-24">
          <span className="label-eyebrow">Verified purchase review</span>
          {hasReview ? (
            <div className="mt-4 space-y-2">
              <ReviewStars rating={existingReview.rating} />
              <p className="text-sm text-ink whitespace-pre-line">{existingReview.comment}</p>
              <p className="text-xs text-teal">You already reviewed this recipe.</p>
            </div>
          ) : (
            <div className="mt-3 space-y-3">
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} type="button" onClick={() => setRating(n)}>
                    <Star className={"h-6 w-6 " + (n <= rating ? "fill-ink text-ink" : "text-neutral-gray")} />
                  </button>
                ))}
              </div>
              <Textarea
                ref={commentRef}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="How reproducible was it? (10-1000 characters)"
                rows={4}
              />
              <p className="text-xs text-neutral-gray">{comment.trim().length}/1000</p>
              <Button className="w-full" onClick={submitReview} disabled={busy}>
                {busy ? "Publishing…" : "Submit review"}
              </Button>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="label-eyebrow">{label}</div>
      <div className="text-ink mt-1">{value}</div>
    </div>
  );
}
