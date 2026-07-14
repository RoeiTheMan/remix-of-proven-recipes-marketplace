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
import { modelLabel } from "@/lib/models";
import { CheckCircle2 } from "lucide-react";

type Sort = "newest" | "oldest" | "consistency" | "model";

export const Route = createFileRoute("/purchases")({ component: Purchases });

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
