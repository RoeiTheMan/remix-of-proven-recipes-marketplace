import { Link } from "@tanstack/react-router";
import type { Listing } from "@/types";
import { ImagePlaceholder } from "./ImagePlaceholder";
import { ConsistencyBadge } from "./ConsistencyBadge";
import { ReviewStars } from "./ReviewStars";
import { Button } from "./ui/button";
import { getDemoListingArtwork } from "@/lib/demoArtwork";

export function ListingCard({ listing }: { listing: Listing }) {
  return (
    <article className="group flex flex-col border border-border bg-card hover:border-ink transition-colors">
      <Link to="/listing/$id" params={{ id: listing.id }} className="block">
        <ImagePlaceholder id={getDemoListingArtwork(listing)} label={listing.imageType} ratio="aspect-[4/5]" />
      </Link>
      <div className="p-4 flex flex-col gap-3 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="label-eyebrow">{listing.imageType}</span>
          <ConsistencyBadge score={listing.consistencyScore} />
        </div>
        <Link to="/listing/$id" params={{ id: listing.id }} className="block">
          <h3 className="font-display text-lg leading-tight text-ink line-clamp-2">{listing.title}</h3>
        </Link>
        <div className="text-xs text-neutral-gray">
          {listing.model} · <span className="font-mono">{listing.modelVersion}</span> · {listing.aspectRatio}
        </div>
        <div className="flex items-center justify-between mt-auto pt-3 border-t border-border">
          <ReviewStars rating={listing.avgRating} count={listing.ratingCount} />
          <span className="font-mono text-sm text-ink">${(listing.priceCents / 100).toFixed(2)}</span>
        </div>
        <Button asChild variant="signal" size="sm" className="w-full">
          <Link to="/listing/$id" params={{ id: listing.id }}>Buy Recipe</Link>
        </Button>
      </div>
    </article>
  );
}
