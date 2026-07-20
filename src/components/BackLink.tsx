import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

/**
 * Contextual back navigation for detail and workflow pages.
 * Predictable destination (a top-level list page) with a clear label, so
 * users are never forced up into the header nav. Consistent on desktop/mobile.
 */
type BackTo = "/browse" | "/purchases" | "/requests" | "/creator" | "/admin";

export function BackLink({ to, label, className = "" }: { to: BackTo; label: string; className?: string }) {
  return (
    <Link
      to={to}
      className={
        "inline-flex items-center gap-1.5 text-sm text-neutral-gray hover:text-ink transition-colors " +
        className
      }
    >
      <ArrowLeft className="h-4 w-4" />
      {label}
    </Link>
  );
}
