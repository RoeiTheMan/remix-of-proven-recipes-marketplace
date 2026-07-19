import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getPurchases } from "@/services/purchasesService";
import { useAuth } from "@/context/AuthContext";
import { ImagePlaceholder } from "@/components/ImagePlaceholder";
import { ConsistencyBadge } from "@/components/ConsistencyBadge";
import { CreatorInline } from "@/components/CreatorInline";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { getDemoListingArtwork } from "@/lib/demoArtwork";
import { modelDisplayName } from "@/lib/models";
import { CheckCircle2 } from "lucide-react";

type Sort = "newest" | "oldest" | "consistency" | "model";

export const Route = createFileRoute("/purchases/")({ component: Purchases });

function Purchases() {
  const { user, isSignedIn, loading } = useAuth();
  const [sort, setSort] = useState<Sort>("newest");
  const { data = [] } = useQuery({
    queryKey: ["purchases", user?.id],
    queryFn: () => (user ? getPurchases(user.id) : Promise.resolve([])),
    enabled: !!user,
  });

  const items = useMemo(() => {
    const list = [...data];
    switch (sort) {
      case "oldest": list.sort((a, b) => +new Date(a.purchase.purchasedAt) - +new Date(b.purchase.purchasedAt)); break;
      case "consistency": list.sort((a, b) => b.listing.consistencyScore - a.listing.consistencyScore); break;
      case "model": list.sort((a, b) => a.listing.model.localeCompare(b.listing.model)); break;
      case "newest":
      default: list.sort((a, b) => +new Date(b.purchase.purchasedAt) - +new Date(a.purchase.purchasedAt));
    }
    return list;
  }, [data, sort]);

  if (loading) return <div className="max-w-3xl mx-auto px-6 py-16 text-neutral-gray">Loading…</div>;

  if (!isSignedIn) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-16">
        <span className="label-eyebrow">Library</span>
        <h1 className="font-display text-3xl mt-2">Sign in to view your library</h1>
        <p className="text-neutral-gray mt-2">Your purchased recipes appear here.</p>
        <Button asChild className="mt-6" variant="signal">
          <Link to="/auth" search={{ next: "/purchases" }}>Sign in</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <span className="label-eyebrow">Library</span>
          <h1 className="font-display text-4xl mt-2">Your recipes</h1>
        </div>
        {items.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="label-eyebrow">Sort</span>
            <Select value={sort} onValueChange={(v) => setSort(v as Sort)}>
              <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="oldest">Oldest</SelectItem>
                <SelectItem value="consistency">Highest consistency</SelectItem>
                <SelectItem value="model">Model</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {items.length === 0 ? (
        <div className="mt-10 border border-border p-16 text-center">
          <h3 className="font-display text-2xl">No recipes in your library yet.</h3>
          <p className="text-sm text-neutral-gray mt-2">
            Head over to <Link to="/browse" className="underline">Browse</Link> to find your first.
          </p>
        </div>
      ) : (
        <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map(({ purchase, listing, reviewed }) => (
            <PurchaseCard
              key={purchase.id}
              purchaseId={purchase.id}
              listing={listing}
              purchasedAt={purchase.purchasedAt}
              priceCents={purchase.priceCents}
              reviewed={reviewed}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function PurchaseCard({
  purchaseId,
  listing,
  purchasedAt,
  priceCents,
  reviewed,
}: {
  purchaseId: string;
  listing: import("@/types").Listing;
  purchasedAt: string;
  priceCents: number;
  reviewed: boolean;
}) {
  const navigate = Route.useNavigate();
  const open = (hash?: string) =>
    navigate({ to: "/purchases/$id", params: { id: purchaseId }, hash });

  return (
    <div
      role="link"
      tabIndex={0}
      onClick={() => open()}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          open();
        }
      }}
      className="border border-border bg-card block cursor-pointer transition-colors hover:border-ink focus:outline-none focus-visible:border-ink focus-visible:ring-2 focus-visible:ring-ink"
    >
      <ImagePlaceholder id={getDemoListingArtwork(listing)} label={listing.imageType} ratio="aspect-[4/5]" />
      <div className="p-4 space-y-2">
        <div className="flex items-center justify-between">
          <ConsistencyBadge score={listing.consistencyScore} />
          {reviewed ? (
            <span className="inline-flex items-center gap-1 text-[11px] uppercase tracking-wider text-teal border border-teal px-1.5 py-0.5">
              <CheckCircle2 className="h-3 w-3" /> Reviewed
            </span>
          ) : (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); open("review"); }}
              className="text-[11px] uppercase tracking-wider text-signal border border-signal px-1.5 py-0.5 hover:bg-signal hover:text-white cursor-pointer"
            >
              Review this recipe
            </button>
          )}
        </div>
        <h3 className="font-display text-lg leading-tight line-clamp-2">{listing.title}</h3>
        {listing.creator && (
          <div onClick={(e) => e.stopPropagation()}>
            <CreatorInline creator={listing.creator} />
          </div>
        )}
        <div className="flex items-center justify-between text-xs text-neutral-gray pt-2 border-t border-border">
          <span>{modelDisplayName(listing.model, listing.modelVersion)}</span>
          <span className="font-mono text-ink">${(priceCents / 100).toFixed(2)}</span>
        </div>
        <div className="flex items-center justify-between text-[11px] text-neutral-gray">
          <span className="capitalize">{listing.usageRights} rights</span>
          <span>{new Date(purchasedAt).toLocaleDateString()}</span>
        </div>
        <div className="flex items-center gap-2 pt-3">
          <Button
            variant="signal"
            size="sm"
            className="flex-1"
            onClick={(e) => { e.stopPropagation(); open(); }}
          >
            Open Recipe
          </Button>
          {!reviewed && (
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={(e) => { e.stopPropagation(); open("review"); }}
            >
              Leave Review
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

