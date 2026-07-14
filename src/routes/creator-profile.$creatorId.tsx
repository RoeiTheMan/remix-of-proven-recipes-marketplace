import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getCreatorPublicProfile } from "@/services/creatorsService";
import { ListingCard } from "@/components/ListingCard";
import { User, ExternalLink, Shield } from "lucide-react";

export const Route = createFileRoute("/creator-profile/$creatorId")({
  component: CreatorProfilePage,
  head: () => ({
    meta: [{ title: "Creator — Pickture" }],
  }),
});

function CreatorProfilePage() {
  const { creatorId } = Route.useParams();
  const { data, isLoading } = useQuery({
    queryKey: ["creator-public", creatorId],
    queryFn: () => getCreatorPublicProfile(creatorId),
  });

  if (isLoading) return <div className="max-w-7xl mx-auto px-6 py-16 text-neutral-gray">Loading…</div>;

  if (!data) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-20 text-center">
        <span className="label-eyebrow">Creator</span>
        <h1 className="font-display text-4xl mt-2">Creator unavailable</h1>
        <p className="text-neutral-gray mt-2">
          This creator profile is not available on the marketplace.
        </p>
        <Link to="/browse" className="inline-block mt-6 underline">Back to browse</Link>
      </div>
    );
  }

  const { creator, bio, portfolioUrl, publishedCount, totalSales, avgRating, reviewCount, listings } = data;

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      <div className="grid md:grid-cols-3 gap-8 items-start">
        <aside className="md:col-span-1 border border-border bg-card p-6">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full border border-border bg-secondary flex items-center justify-center overflow-hidden">
              {creator.avatarUrl ? (
                <img src={creator.avatarUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <User className="h-7 w-7 text-neutral-gray" />
              )}
            </div>
            <div className="min-w-0">
              <span className="label-eyebrow">Creator</span>
              <h1 className="font-display text-2xl leading-tight truncate">{creator.displayName}</h1>
            </div>
          </div>
          {creator.tagline && (
            <p className="mt-4 text-sm text-ink/80 italic">"{creator.tagline}"</p>
          )}
          {bio && <p className="mt-4 text-sm text-neutral-gray whitespace-pre-line">{bio}</p>}
          <div className="mt-6 flex items-center gap-2 text-teal">
            <Shield className="h-4 w-4" />
            <span className="label-eyebrow">Reliability {creator.reliabilityScore}</span>
          </div>
          {portfolioUrl && (
            <a
              href={portfolioUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-1 text-sm text-ink underline hover:no-underline"
            >
              Portfolio <ExternalLink className="h-3 w-3" />
            </a>
          )}

          <dl className="mt-6 grid grid-cols-2 gap-3 text-sm">
            <Stat label="Published" value={publishedCount} />
            <Stat label="Total sales" value={totalSales} />
            <Stat label="Avg rating" value={reviewCount ? avgRating.toFixed(2) : "—"} />
            <Stat label="Reviews" value={reviewCount} />
          </dl>
        </aside>

        <div className="md:col-span-2">
          <div className="flex items-baseline justify-between">
            <div>
              <span className="label-eyebrow">Published recipes</span>
              <h2 className="font-display text-3xl mt-1">Recipes from {creator.displayName}</h2>
            </div>
            <span className="text-xs text-neutral-gray">{publishedCount} total</span>
          </div>

          {listings.length === 0 ? (
            <div className="mt-8 border border-border p-12 text-center">
              <h3 className="font-display text-xl">No published recipes yet.</h3>
              <p className="text-sm text-neutral-gray mt-2">
                This creator hasn't published any recipes on the marketplace.
              </p>
            </div>
          ) : (
            <div className="mt-8 grid sm:grid-cols-2 gap-6">
              {listings.map((l) => (
                <ListingCard key={l.id} listing={{ ...l, creator }} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="border border-border p-3">
      <div className="label-eyebrow">{label}</div>
      <div className="font-mono text-lg text-ink mt-1">{value}</div>
    </div>
  );
}
