import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  getRequest, acceptOffer, sendMessage, submitOffer,
  getDelivery, submitDelivery, setDeliveryStatus, markRequestApproved,
  type RequestDelivery,
} from "@/services/requestsService";
import { useAuth } from "@/context/AuthContext";
import { OfferCard } from "@/components/OfferCard";
import { ChatPanel } from "@/components/ChatPanel";
import { supabase } from "@/integrations/supabase/client";
import { modelLabel } from "@/lib/models";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { BackLink } from "@/components/BackLink";

export const Route = createFileRoute("/requests/$id")({ component: RequestDetail });

function RequestDetail() {
  const { id } = Route.useParams();
  const { user, isBuyer, isCreator } = useAuth();
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["request", id], queryFn: () => getRequest(id) });

  const [msg, setMsg] = useState("");
  const [offerPrice, setOfferPrice] = useState("");
  const [offerEta, setOfferEta] = useState("5");

  // Live chat: refresh this request when a new chat message is inserted.
  // Supabase Realtime respects RLS (participants only). If Realtime is not
  // enabled for chat_messages, this receives nothing and the existing
  // refetch-on-send behavior below still works as the fallback.
  useEffect(() => {
    const channel = supabase
      .channel(`request-chat-${id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages", filter: `request_id=eq.${id}` },
        () => qc.invalidateQueries({ queryKey: ["request", id] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, qc]);

  if (!data?.request) return <div className="max-w-4xl mx-auto px-6 py-16">Loading…</div>;
  const { request, offers, messages, names } = data;
  const accepted = offers.find((o) => o.status === "accepted");
  const canChat = !!accepted && !!user && (user.id === request.buyerId || accepted.creatorId === user.id);

  const nameFor = (uid: string) => names[uid] ?? "User";

  async function handleAccept(offerId: string) {
    await acceptOffer(offerId);
    toast.success("Offer accepted. Other offers declined.");
    qc.invalidateQueries();
  }

  async function handleSend(body: string) {
    if (!user) return;
    await sendMessage(id, user.id, body);
    qc.invalidateQueries({ queryKey: ["request", id] });
  }

  async function handleSubmitOffer(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    await submitOffer({ requestId: id, creatorId: user.id, message: msg, priceCents: Math.round(parseFloat(offerPrice) * 100), etaDays: parseInt(offerEta) });
    setMsg(""); setOfferPrice("");
    toast.success("Offer submitted");
    qc.invalidateQueries({ queryKey: ["request", id] });
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <BackLink to="/requests" label="Back to Requests" className="mb-6" />
    <div className="grid lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-8">
        <div>
          <span className="label-eyebrow">Request · {request.status}</span>
          <h1 className="font-display text-4xl mt-2">{request.title}</h1>
          <div className="text-xs text-neutral-gray mt-2">Budget ${(request.budgetCents / 100).toFixed(0)} · {request.usageRights} · Model: {request.modelPreference ? modelLabel(request.modelPreference) : "Any"}</div>
        </div>
        <p className="text-ink/80">{request.brief}</p>

        <div>
          <span className="label-eyebrow">Offers ({offers.length})</span>
          <div className="mt-3 grid sm:grid-cols-2 gap-4">
            {offers.map((o) => (
              <OfferCard
                key={o.id}
                offer={o}
                creatorName={nameFor(o.creatorId)}
                canAccept={isBuyer && user?.id === request.buyerId && !accepted}
                onAccept={() => handleAccept(o.id)}
              />
            ))}
            {offers.length === 0 && <p className="text-neutral-gray text-sm">No offers yet.</p>}
          </div>
        </div>

        {isCreator && user?.id !== request.buyerId && !accepted && (
          <form onSubmit={handleSubmitOffer} className="border border-border p-5 space-y-3">
            <span className="label-eyebrow">Submit an offer</span>
            <Textarea value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="Explain your approach…" required />
            <div className="grid grid-cols-2 gap-3">
              <Input type="number" min="1" placeholder="Price (USD)" value={offerPrice} onChange={(e) => setOfferPrice(e.target.value)} required />
              <Input type="number" min="1" placeholder="ETA days" value={offerEta} onChange={(e) => setOfferEta(e.target.value)} required />
            </div>
            <Button type="submit" variant="signal">Send offer</Button>
          </form>
        )}

        {accepted && (
          <DeliveryPanel
            requestId={id}
            offerId={accepted.id}
            creatorName={nameFor(accepted.creatorId)}
            isAcceptedCreator={user?.id === accepted.creatorId}
            isRequestBuyer={user?.id === request.buyerId}
          />
        )}
      </div>

      <aside>
        <ChatPanel messages={messages} currentUserId={user?.id ?? ""} onSend={handleSend} disabled={!canChat} />
      </aside>
    </div>
    </div>
  );
}

function DeliveryPanel({
  requestId, offerId, creatorName, isAcceptedCreator, isRequestBuyer,
}: {
  requestId: string;
  offerId: string;
  creatorName: string;
  isAcceptedCreator: boolean;
  isRequestBuyer: boolean;
}) {
  const qc = useQueryClient();
  const { data: delivery, isPending } = useQuery({
    queryKey: ["delivery", offerId],
    queryFn: () => getDelivery(offerId),
  });
  const [fullPrompt, setFullPrompt] = useState("");
  const [negativePrompt, setNegativePrompt] = useState("");
  const [busy, setBusy] = useState(false);

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["delivery", offerId] });
    qc.invalidateQueries({ queryKey: ["request", requestId] });
  };

  async function deliver(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await submitDelivery({ offerId, fullPrompt, negativePrompt });
      toast.success("Recipe delivered to the buyer.");
      refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delivery failed");
    } finally {
      setBusy(false);
    }
  }

  async function decide(status: "approved" | "revision_requested", d: RequestDelivery) {
    setBusy(true);
    try {
      await setDeliveryStatus(d.id, status);
      if (status === "approved") await markRequestApproved(requestId);
      toast.success(status === "approved" ? "Delivery approved." : "Revision requested.");
      refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Action failed");
    } finally {
      setBusy(false);
    }
  }

  if (isPending) return null;

  return (
    <div className="border border-teal bg-teal/5 p-5">
      <span className="label-eyebrow text-teal">Delivery</span>

      {/* Creator side: submit (or resubmit after a revision request). */}
      {isAcceptedCreator && (!delivery || delivery.status === "revision_requested") && (
        <form onSubmit={deliver} className="mt-3 space-y-3">
          <h3 className="font-display text-xl">
            {delivery ? "The buyer requested revisions — deliver an update" : "Deliver the visual recipe"}
          </h3>
          <Textarea required rows={5} placeholder="Full prompt…" value={fullPrompt} onChange={(e) => setFullPrompt(e.target.value)} />
          <Textarea rows={2} placeholder="Negative prompt (optional)…" value={negativePrompt} onChange={(e) => setNegativePrompt(e.target.value)} />
          <Button type="submit" variant="teal" size="sm" disabled={busy}>{busy ? "Delivering…" : "Deliver recipe"}</Button>
        </form>
      )}
      {isAcceptedCreator && delivery && delivery.status !== "revision_requested" && (
        <h3 className="font-display text-xl mt-2">
          {delivery.status === "approved" ? "Delivery approved — nice work." : "Delivered. Waiting for the buyer's approval."}
        </h3>
      )}

      {/* Buyer side: view + approve / request revisions. */}
      {isRequestBuyer && !delivery && (
        <h3 className="font-display text-xl mt-2">Awaiting delivery from {creatorName}</h3>
      )}
      {isRequestBuyer && delivery && (
        <div className="mt-2 space-y-3">
          <h3 className="font-display text-xl">
            {delivery.status === "approved" ? "Approved — the recipe is yours."
              : delivery.status === "revision_requested" ? `Waiting for ${creatorName}'s revision`
              : `${creatorName} delivered your recipe`}
          </h3>
          {delivery.status !== "revision_requested" && (
            <div className="border border-border bg-card p-4 text-sm whitespace-pre-wrap">
              <div className="label-eyebrow mb-2">Full prompt</div>
              {delivery.fullPrompt}
              {delivery.negativePrompt && (
                <>
                  <div className="label-eyebrow mt-4 mb-2">Negative prompt</div>
                  {delivery.negativePrompt}
                </>
              )}
            </div>
          )}
          {delivery.status === "delivered" && (
            <div className="flex gap-2">
              <Button variant="teal" size="sm" disabled={busy} onClick={() => decide("approved", delivery)}>Approve delivery</Button>
              <Button variant="outline" size="sm" disabled={busy} onClick={() => decide("revision_requested", delivery)}>Request revisions</Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
