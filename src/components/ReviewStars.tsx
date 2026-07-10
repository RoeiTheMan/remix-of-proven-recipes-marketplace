import { Star } from "lucide-react";

export function ReviewStars({ rating, count, size = 14 }: { rating: number; count?: number; size?: number }) {
  return (
    <span className="inline-flex items-center gap-1 text-ink text-sm">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          width={size}
          height={size}
          className={i <= Math.round(rating) ? "fill-ink text-ink" : "text-neutral-gray"}
        />
      ))}
      <span className="text-neutral-gray text-xs ml-1">{rating.toFixed(1)}{count != null && ` (${count})`}</span>
    </span>
  );
}
