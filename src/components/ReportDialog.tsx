import { useState } from "react";
import {
  AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "./ui/alert-dialog";
import { Textarea } from "./ui/textarea";
import { REPORT_REASONS, reportListing, type ReportReason } from "@/services/reportsService";
import { toast } from "sonner";

export function ReportDialog({
  listingId, open, onOpenChange,
}: {
  listingId: string;
  open: boolean;
  onOpenChange: (b: boolean) => void;
}) {
  const [reason, setReason] = useState<ReportReason>("copyright");
  const [details, setDetails] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    try {
      await reportListing(listingId, reason, details);
      toast.success("Report submitted. Our admins will review it.");
      onOpenChange(false);
      setDetails("");
    } catch {
      toast.error("We couldn't submit that report. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="font-display">Report this listing</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4 text-left">
              <p className="text-sm text-neutral-gray">
                Tell us what's wrong. An admin will review this listing.
              </p>
              <div className="space-y-2">
                <span className="label-eyebrow">Reason</span>
                <div className="grid gap-1.5">
                  {REPORT_REASONS.map((r) => (
                    <label key={r.value} className="flex items-center gap-2 text-sm text-ink cursor-pointer">
                      <input
                        type="radio"
                        name="report-reason"
                        value={r.value}
                        checked={reason === r.value}
                        onChange={() => setReason(r.value)}
                      />
                      <span>{r.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <Textarea
                placeholder="Add any details (optional)"
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                maxLength={1000}
              />
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
          <button
            onClick={submit}
            disabled={busy}
            className="inline-flex items-center justify-center rounded-md bg-ink text-warm-white px-4 py-2 text-sm font-medium hover:bg-ink/90 disabled:opacity-50"
          >
            {busy ? "Submitting…" : "Submit report"}
          </button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
