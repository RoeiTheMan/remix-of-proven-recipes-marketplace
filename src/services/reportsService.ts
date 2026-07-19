// Listing reports. Insert is done via the report_listing RPC (SECURITY DEFINER)
// which records the report AND writes a listing_reported log; that log row is
// what fans out to the Slack admin channel via a database trigger.
import { supabase } from "@/integrations/supabase/client";

export type ReportReason = "copyright" | "misleading_preview" | "inappropriate" | "other";

export const REPORT_REASONS: Array<{ value: ReportReason; label: string }> = [
  { value: "copyright", label: "Copyright / stolen work" },
  { value: "misleading_preview", label: "Misleading preview or claims" },
  { value: "inappropriate", label: "Inappropriate content" },
  { value: "other", label: "Something else" },
];

export async function reportListing(
  listingId: string,
  reason: ReportReason,
  details: string,
): Promise<void> {
  // report_listing is added in migration 20260719190000 and not yet in the
  // generated Supabase types, so the name/args are cast.
  const { error } = await supabase.rpc(
    "report_listing" as never,
    { _listing_id: listingId, _reason: reason, _details: details.trim().slice(0, 1000) } as never,
  );
  if (error) throw error;
}
