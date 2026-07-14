import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "./ui/alert-dialog";
import type { Listing } from "@/types";
import { ImagePlaceholder } from "./ImagePlaceholder";
import { ConsistencyBadge } from "./ConsistencyBadge";
import { Check } from "lucide-react";
import { getDemoListingArtwork } from "@/lib/demoArtwork";
import { modelLabel } from "@/lib/models";

export function PurchaseDialog({
  listing, open, onOpenChange, onConfirm, busy,
}: {
  listing: Listing;
  open: boolean;
  onOpenChange: (b: boolean) => void;
  onConfirm: () => void;
  busy?: boolean;
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-lg">
        <AlertDialogHeader>
          <AlertDialogTitle className="font-display">Confirm purchase</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4 text-left">
              <div className="flex gap-3">
                <div className="w-24 shrink-0">
                  <ImagePlaceholder id={getDemoListingArtwork(listing)} ratio="aspect-[4/5]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-display text-lg text-ink leading-tight">{listing.title}</p>
                  <p className="text-xs text-neutral-gray mt-1">
                    by {listing.creator?.displayName ?? "Pickture creator"}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                    <span className="border border-border px-1.5 py-0.5">
                      {modelLabel(listing.model)} {listing.modelVersion}
                    </span>
                    <span className="border border-border px-1.5 py-0.5 capitalize">
                      {listing.usageRights} rights
                    </span>
                    <ConsistencyBadge score={listing.consistencyScore} />
                  </div>
                  <p className="font-mono text-lg text-ink mt-2">${(listing.priceCents / 100).toFixed(2)}</p>
                </div>
              </div>

              <div className="border border-border bg-secondary p-3">
                <p className="label-eyebrow mb-2">Your purchase includes</p>
                <ul className="space-y-1 text-sm text-ink">
                  {[
                    "Full generation prompt",
                    "Negative prompt",
                    "Recommended settings",
                    "Usage notes",
                    "License information",
                  ].map((i) => (
                    <li key={i} className="flex items-center gap-2">
                      <Check className="h-3.5 w-3.5 text-teal shrink-0" />
                      <span>{i}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <p className="text-xs text-neutral-gray">
                Prototype checkout — no real payment will be charged.
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={busy}
            className="bg-signal text-signal-foreground hover:bg-signal/90"
          >
            {busy ? "Processing…" : "Confirm purchase"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
