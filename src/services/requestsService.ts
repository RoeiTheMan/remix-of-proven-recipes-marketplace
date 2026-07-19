// Real Lovable Cloud custom requests / offers / chat.
import { supabase } from "@/integrations/supabase/client";
import type { CustomRequest, Offer, ChatMessage, UsageRights } from "@/types";
import { mapRequestRow, mapOfferRow, mapChatRow } from "./_mappers";

export async function getRequests(): Promise<CustomRequest[]> {
  const { data, error } = await supabase
    .from("custom_requests")
    .select("*, offers(count)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  /* eslint-disable @typescript-eslint/no-explicit-any */
  return (data ?? []).map((r: any) => mapRequestRow(r, r.offers?.[0]?.count ?? 0));
}

export async function getRequest(id: string) {
  const [{ data: request }, { data: offers }, { data: messages }] = await Promise.all([
    supabase.from("custom_requests").select("*").eq("id", id).maybeSingle(),
    supabase.from("offers").select("*").eq("request_id", id).order("created_at"),
    supabase.from("chat_messages").select("*").eq("request_id", id).order("created_at"),
  ]);
  if (!request) return null;

  // Resolve display names from the real profiles table (publicly readable by RLS)
  // for the buyer, every offer creator, and every chat sender.
  const userIds = Array.from(
    new Set([
      request.buyer_id,
      ...(offers ?? []).map((o) => o.creator_id),
      ...(messages ?? []).map((m) => m.sender_id),
    ].filter(Boolean)),
  );
  const names: Record<string, string> = {};
  if (userIds.length) {
    const { data: profs } = await supabase.from("profiles").select("id, display_name").in("id", userIds);
    for (const p of profs ?? []) names[p.id] = p.display_name || "User";
  }

  return {
    request: mapRequestRow(request, offers?.length ?? 0),
    offers: (offers ?? []).map(mapOfferRow),
    messages: (messages ?? []).map(mapChatRow),
    names,
  };
}

export async function createRequest(input: {
  buyerId: string;
  title: string;
  brief: string;
  modelPreference?: string;
  budgetCents: number;
  deadline: string;
  usageRights: UsageRights;
}): Promise<CustomRequest> {
  const { data, error } = await supabase
    .from("custom_requests")
    .insert({
      buyer_id: input.buyerId,
      title: input.title,
      brief: input.brief,
      model_preference: input.modelPreference ?? null,
      budget_cents: input.budgetCents,
      deadline: input.deadline || null,
      usage_rights: input.usageRights,
    })
    .select("*")
    .single();
  if (error) throw error;
  return mapRequestRow(data);
}

export async function submitOffer(input: {
  requestId: string;
  creatorId: string;
  message: string;
  priceCents: number;
  etaDays: number;
}): Promise<Offer> {
  const { data, error } = await supabase
    .from("offers")
    .insert({
      request_id: input.requestId,
      creator_id: input.creatorId,
      sample_direction: input.message,
      price_cents: input.priceCents,
      turnaround_days: input.etaDays,
    })
    .select("*")
    .single();
  if (error) throw error;
  return mapOfferRow(data);
}

export async function acceptOffer(offerId: string): Promise<Offer> {
  const { data, error } = await supabase.rpc("accept_offer", { _offer_id: offerId });
  if (error) throw error;
  return mapOfferRow(data);
}

export async function sendMessage(requestId: string, authorId: string, body: string): Promise<ChatMessage> {
  const { data, error } = await supabase
    .from("chat_messages")
    .insert({ request_id: requestId, sender_id: authorId, body })
    .select("*")
    .single();
  if (error) throw error;
  return mapChatRow(data);
}

// ---- deliveries --------------------------------------------------------
// One delivery row per accepted offer (UNIQUE offer_id). RLS: participants
// read, accepted creator inserts/updates content, buyer updates status.

export interface RequestDelivery {
  id: string;
  offerId: string;
  fullPrompt: string;
  negativePrompt: string;
  status: "delivered" | "revision_requested" | "approved";
  createdAt: string;
  updatedAt: string;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function mapDelivery(r: any): RequestDelivery {
  return {
    id: r.id,
    offerId: r.offer_id,
    fullPrompt: r.full_prompt ?? "",
    negativePrompt: r.negative_prompt ?? "",
    status: r.status,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export async function getDelivery(offerId: string): Promise<RequestDelivery | null> {
  const { data } = await supabase.from("deliveries").select("*").eq("offer_id", offerId).maybeSingle();
  return data ? mapDelivery(data) : null;
}

export async function submitDelivery(input: {
  offerId: string;
  fullPrompt: string;
  negativePrompt: string;
}): Promise<RequestDelivery> {
  const { data, error } = await supabase
    .from("deliveries")
    .upsert(
      {
        offer_id: input.offerId,
        full_prompt: input.fullPrompt,
        negative_prompt: input.negativePrompt,
        status: "delivered",
      },
      { onConflict: "offer_id" },
    )
    .select("*")
    .single();
  if (error) throw error;
  return mapDelivery(data);
}

export async function setDeliveryStatus(
  deliveryId: string,
  status: "approved" | "revision_requested",
): Promise<RequestDelivery> {
  const { data, error } = await supabase
    .from("deliveries")
    .update({ status })
    .eq("id", deliveryId)
    .select("*")
    .single();
  if (error) throw error;
  return mapDelivery(data);
}

export async function markRequestApproved(requestId: string): Promise<void> {
  // Buyer-only per RLS; marks the request closed after an approved delivery.
  await supabase.from("custom_requests").update({ status: "approved" }).eq("id", requestId);
}
