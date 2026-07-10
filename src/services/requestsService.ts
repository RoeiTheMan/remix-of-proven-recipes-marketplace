// Mock implementation — replace with Supabase in M1.
import { db, delay, uid, pushLog } from "./_store";
import type { CustomRequest, Offer, ChatMessage, UsageRights } from "@/types";

export async function getRequests() {
  await delay();
  return db.requests;
}

export async function getRequest(id: string) {
  await delay();
  const request = db.requests.find((r) => r.id === id) ?? null;
  if (!request) return null;
  const offers = db.offers.filter((o) => o.requestId === id);
  const messages = db.chatMessages.filter((m) => m.requestId === id);
  return { request, offers, messages };
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
  await delay();
  const req: CustomRequest = {
    id: uid("req"),
    ...input,
    status: "open",
    offerCount: 0,
    createdAt: new Date().toISOString(),
  };
  db.requests.unshift(req);
  return req;
}

export async function submitOffer(input: {
  requestId: string;
  creatorId: string;
  message: string;
  priceCents: number;
  etaDays: number;
}): Promise<Offer> {
  await delay();
  const offer: Offer = {
    id: uid("of"),
    ...input,
    status: "pending",
    createdAt: new Date().toISOString(),
  };
  db.offers.push(offer);
  const req = db.requests.find((r) => r.id === input.requestId);
  if (req) req.offerCount += 1;
  return offer;
}

export async function acceptOffer(offerId: string) {
  await delay();
  const offer = db.offers.find((o) => o.id === offerId);
  if (!offer) throw new Error("Offer not found");
  offer.status = "accepted";
  db.offers.forEach((o) => {
    if (o.requestId === offer.requestId && o.id !== offerId) o.status = "declined";
  });
  const req = db.requests.find((r) => r.id === offer.requestId);
  if (req) req.status = "in_progress";
  pushLog({ eventType: "admin_action", entityType: "offer", entityId: offerId, payload: { action: "accept_offer" } });
  return offer;
}

export async function sendMessage(requestId: string, authorId: string, body: string): Promise<ChatMessage> {
  await delay(120);
  const msg: ChatMessage = {
    id: uid("c"),
    requestId,
    authorId,
    body,
    createdAt: new Date().toISOString(),
  };
  db.chatMessages.push(msg);
  return msg;
}
