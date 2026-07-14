import { Link } from "@tanstack/react-router";
import type { CreatorSummary } from "@/types";
import { User } from "lucide-react";

export function CreatorInline({
  creator,
  size = "sm",
  showReliability = true,
}: {
  creator: CreatorSummary;
  size?: "sm" | "md";
  showReliability?: boolean;
}) {
  const dim = size === "md" ? "h-8 w-8" : "h-6 w-6";
  const text = size === "md" ? "text-sm" : "text-xs";
  return (
    <Link
      to="/creator-profile/$creatorId"
      params={{ creatorId: creator.id }}
      className={`inline-flex items-center gap-2 group ${text} text-neutral-gray hover:text-ink`}
      onClick={(e) => e.stopPropagation()}
    >
      <span className={`${dim} rounded-full border border-border bg-secondary flex items-center justify-center overflow-hidden shrink-0`}>
        {creator.avatarUrl ? (
          <img src={creator.avatarUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <User className="h-3 w-3 text-neutral-gray" />
        )}
      </span>
      <span className="truncate text-ink group-hover:underline">{creator.displayName}</span>
      {showReliability && (
        <span className="border border-teal text-teal px-1 label-eyebrow shrink-0">
          {creator.reliabilityScore}
        </span>
      )}
    </Link>
  );
}
