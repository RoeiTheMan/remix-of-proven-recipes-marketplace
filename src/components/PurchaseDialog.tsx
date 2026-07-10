import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "./ui/alert-dialog";
import type { Listing } from "@/types";

export function PurchaseDialog({
  listing, open, onOpenChange, onConfirm,
}: {
  listing: Listing;
  open: boolean;
  onOpenChange: (b: boolean) => void;
  onConfirm: () => void;
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="font-display">Confirm purchase</AlertDialogTitle>
          <AlertDialogDescription>
            You are purchasing the recipe <span className="text-ink font-medium">{listing.title}</span> for
            {" "}<span className="font-mono">${(listing.priceCents / 100).toFixed(2)}</span>. Usage rights: {listing.usageRights}.
            <br /><br />
            <span className="text-xs text-neutral-gray">This is a simulated purchase. No payment is processed.</span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className="bg-signal text-signal-foreground hover:bg-signal/90">Buy recipe</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
