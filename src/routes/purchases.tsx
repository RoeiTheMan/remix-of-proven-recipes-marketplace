import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getPurchases } from "@/services/purchasesService";
import { useAuth } from "@/context/AuthContext";
import { ImagePlaceholder } from "@/components/ImagePlaceholder";
import { ConsistencyBadge } from "@/components/ConsistencyBadge";

export const Route = createFileRoute("/purchases")({ component: Purchases });

function Purchases() {
  const { user, role } = useAuth();
  const { data = [] } = useQuery({
    queryKey: ["purchases", user?.id],
    queryFn: () => (user ? getPurchases(user.id) : Promise.resolve([])),
    enabled: !!user,
  });

  if (role !== "buyer") {
    return <div className="max-w-3xl mx-auto px-6 py-16">
      <h1 className="font-display text-3xl">Buyer only</h1>
      <p className="text-neutral-gray mt-2">Switch to Buyer role to view your library.</p>
    </div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      <span className="label-eyebrow">Library</span>
      <h1 className="font-display text-4xl mt-2">Your recipes</h1>
      {data.length === 0 ? (
        <div className="mt-10 border border-border p-16 text-center">
          <h3 className="font-display text-2xl">Recipes you buy appear here.</h3>
          <p className="text-sm text-neutral-gray mt-2">Head over to <Link to="/browse" className="underline">Browse</Link> to find your first.</p>
        </div>
      ) : (
        <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.map(({ purchase, listing }) => (
            <Link key={purchase.id} to="/purchases/$id" params={{ id: purchase.id }} className="border border-border bg-card block hover:border-ink">
              <ImagePlaceholder id={listing.previewImages[0]} label={listing.imageType} />
              <div className="p-4 space-y-2">
                <ConsistencyBadge score={listing.consistencyScore} />
                <h3 className="font-display text-lg leading-tight">{listing.title}</h3>
                <p className="text-xs text-neutral-gray">{listing.model} · {listing.modelVersion}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
