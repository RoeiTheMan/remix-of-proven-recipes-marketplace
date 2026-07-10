import { Link } from "@tanstack/react-router";
import type { CustomRequest } from "@/types";

export function RequestCard({ request }: { request: CustomRequest }) {
  return (
    <Link to="/requests/$id" params={{ id: request.id }} className="block border border-border bg-card p-5 hover:border-ink transition-colors">
      <div className="flex items-center justify-between">
        <span className="label-eyebrow">{request.status}</span>
        <span className="font-mono text-sm">${(request.budgetCents / 100).toFixed(0)}</span>
      </div>
      <h3 className="font-display text-xl mt-2">{request.title}</h3>
      <p className="text-sm text-neutral-gray mt-2 line-clamp-2">{request.brief}</p>
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-border text-xs text-neutral-gray">
        <span>{request.modelPreference ?? "Any model"} · {request.usageRights}</span>
        <span>{request.offerCount} offer{request.offerCount === 1 ? "" : "s"}</span>
      </div>
    </Link>
  );
}
