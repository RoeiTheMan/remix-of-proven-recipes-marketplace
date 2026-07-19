// Real Lovable Cloud notifications.
// Rows are written by backend RPCs/triggers only (sale, offer_accepted, review);
// RLS scopes reads/updates to the owning user.
import { supabase } from "@/integrations/supabase/client";

export interface AppNotification {
  id: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
  /** In-app destination for this notification. */
  link: string;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function present(row: { id: string; type: string; payload: any; read: boolean; created_at: string }): AppNotification {
  const p = row.payload ?? {};
  let title = "Notification";
  let body = "";
  let link = "/";
  switch (row.type) {
    case "sale":
      title = "You made a sale";
      body = p.price_cents != null ? `A recipe sold for $${(p.price_cents / 100).toFixed(0)}.` : "One of your recipes was purchased.";
      link = "/creator";
      break;
    case "review":
      title = "New verified review";
      body = p.title ? `${p.rating ?? "?"}★ on “${p.title}”.` : "A buyer reviewed one of your recipes.";
      link = p.listing_id ? `/listing/${p.listing_id}` : "/creator";
      break;
    case "offer_accepted":
      title = "Your offer was accepted";
      body = "The buyer accepted your offer. Open the request to start the conversation.";
      link = p.request_id ? `/requests/${p.request_id}` : "/requests";
      break;
    case "delivery":
      title = "Delivery received";
      body = "A creator delivered your custom recipe. Review and approve it.";
      link = p.request_id ? `/requests/${p.request_id}` : "/requests";
      break;
    default:
      title = row.type.replaceAll("_", " ");
      break;
  }
  return { id: row.id, type: row.type, title, body, read: row.read, createdAt: row.created_at, link };
}

export async function getNotifications(limit = 20): Promise<AppNotification[]> {
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []).map(present);
}

export async function getUnreadCount(): Promise<number> {
  const { count, error } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("read", false);
  if (error) return 0;
  return count ?? 0;
}

export async function markAllRead(): Promise<void> {
  await supabase.from("notifications").update({ read: true }).eq("read", false);
}
