import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { getRequest, acceptOffer, sendMessage, submitOffer } from "@/services/requestsService";
import { useAuth } from "@/context/AuthContext";
import { OfferCard } from "@/components/OfferCard";
import { ChatPanel } from "@/components/ChatPanel";
import { db } from "@/services/_store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export const Route = createFileRoute("/requests/$id")({ component: RequestDetail });

function RequestDetail() {
  const { id } = Route.useParams();
  const { user, role } = useAuth();
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["request", id], queryFn: () => getRequest(id) });

  const [msg, setMsg] = useState("");
  const [offerPrice, setOfferPrice] = useState("");
  const [offerEta, setOfferEta] = useState("5");

  if (!data?.request) return <div className="max-w-4xl mx-auto px-6 py-16">Loading…</div>;
  const { request, offers, messages } = data;
  const accepted = offers.find((o) => o.status === "accepted");
  const canChat = !!accepted && !!user && (user.id === request.buyerId || accepted.creatorId === user.id);

  const nameFor = (uid: string) => db.profiles.find((p) => p.id === uid)?.displayName ?? uid;

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
    <div className="max-w-6xl mx-auto px-6 py-10 grid lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-8">
        <div>
          <span className="label-eyebrow">Request · {request.status}</span>
          <h1 className="font-display text-4xl mt-2">{request.title}</h1>
          <div className="text-xs text-neutral-gray mt-2">Budget ${(request.budgetCents / 100).toFixed(0)} · {request.usageRights} · Model: {request.modelPreference ?? "Any"}</div>
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
                canAccept={role === "buyer" && user?.id === request.buyerId && !accepted}
                onAccept={() => handleAccept(o.id)}
              />
            ))}
            {offers.length === 0 && <p className="text-neutral-gray text-sm">No offers yet.</p>}
          </div>
        </div>

        {role === "creator" && !accepted && (
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
          <div className="border border-teal bg-teal/5 p-5">
            <span className="label-eyebrow text-teal">Delivery</span>
            <h3 className="font-display text-xl mt-2">Awaiting delivery from {nameFor(accepted.creatorId)}</h3>
            <div className="mt-3 flex gap-2">
              <Button variant="teal" size="sm" onClick={() => toast.success("Delivery approved")}>Approve delivery</Button>
              <Button variant="outline" size="sm" onClick={() => toast("Requested revisions")}>Request revisions</Button>
            </div>
          </div>
        )}
      </div>

      <aside>
        <ChatPanel messages={messages} currentUserId={user?.id ?? ""} onSend={handleSend} disabled={!canChat} />
      </aside>
    </div>
  );
}
