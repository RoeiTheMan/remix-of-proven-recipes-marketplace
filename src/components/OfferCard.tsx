import type { Offer } from "@/types";
import { Button } from "./ui/button";

export function OfferCard({ offer, creatorName, canAccept, onAccept }: { offer: Offer; creatorName: string; canAccept?: boolean; onAccept?: () => void }) {
  const statusColor = offer.status === "accepted" ? "text-teal" : offer.status === "declined" ? "text-neutral-gray line-through" : "text-ink";
  return (
    <div className="border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <span className="font-medium">{creatorName}</span>
        <span className={"label-eyebrow " + statusColor}>{offer.status}</span>
      </div>
      <p className="text-sm mt-2">{offer.message}</p>
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
        <div className="text-xs text-neutral-gray">
          <span className="font-mono text-ink text-sm">${(offer.priceCents / 100).toFixed(0)}</span> · {offer.etaDays}d ETA
        </div>
        {canAccept && offer.status === "pending" && (
          <Button size="sm" variant="signal" onClick={onAccept}>Accept</Button>
        )}
      </div>
    </div>
  );
}
