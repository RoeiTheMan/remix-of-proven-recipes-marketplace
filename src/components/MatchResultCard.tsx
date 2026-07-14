import { Link } from "@tanstack/react-router";
import type { AdvisorResult } from "@/services/advisorService";
import { ImagePlaceholder } from "./ImagePlaceholder";
import { ConsistencyBadge } from "./ConsistencyBadge";
import { Button } from "./ui/button";
import { getDemoListingArtwork } from "@/lib/demoArtwork";
import { modelLabel } from "@/lib/models";

export function MatchResultCard({ result }: { result: AdvisorResult }) {
  const { listing, matchPct, rationale } = result;
  return (
    <div className="flex gap-4 border border-border bg-card p-4">
      <div className="w-40 shrink-0">
        <ImagePlaceholder id={getDemoListingArtwork(listing)} label={listing.imageType} ratio="aspect-[4/5]" />
      </div>
      <div className="flex-1 flex flex-col gap-2 min-w-0">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-baseline gap-1 border border-ink px-2 py-0.5">
            <span className="font-mono text-xl leading-none">{matchPct}</span>
            <span className="label-eyebrow">match</span>
          </span>
          <ConsistencyBadge score={listing.consistencyScore} />
          <span className="label-eyebrow">{modelLabel(listing.model)}</span>
        </div>
        <h3 className="font-display text-lg leading-tight">{listing.title}</h3>
        <p className="text-sm text-neutral-gray">{rationale}</p>
        <div className="flex items-center justify-between mt-auto pt-2 border-t border-border">
          <span className="text-xs text-neutral-gray uppercase tracking-wider">{listing.usageRights} · ${(listing.priceCents / 100).toFixed(2)}</span>
          <Button asChild size="sm" variant="outline">
            <Link to="/listing/$id" params={{ id: listing.id }}>View Recipe</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
