import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { createRequest } from "@/services/requestsService";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { UsageRights } from "@/types";
import { SUPPORTED_MODELS } from "@/lib/models";

export const Route = createFileRoute("/requests/new")({ component: NewRequest });

function NewRequest() {
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [brief, setBrief] = useState("");
  const [model, setModel] = useState<string>("");
  const [budget, setBudget] = useState("200");
  const [deadline, setDeadline] = useState("");
  const [rights, setRights] = useState<UsageRights>("commercial");

  if (role !== "buyer") return <div className="max-w-2xl mx-auto px-6 py-16"><h1 className="font-display text-3xl">Buyers only</h1><p className="text-neutral-gray mt-2">Switch to Buyer role to post a request.</p></div>;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    const req = await createRequest({
      buyerId: user.id, title, brief, modelPreference: model || undefined,
      budgetCents: Math.round(parseFloat(budget || "0") * 100),
      deadline: deadline || new Date(Date.now() + 7 * 86400_000).toISOString(),
      usageRights: rights,
    });
    toast.success("Request posted");
    navigate({ to: "/requests/$id", params: { id: req.id } });
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <span className="label-eyebrow">New request</span>
      <h1 className="font-display text-4xl mt-2">Post a brief</h1>
      <form onSubmit={submit} className="mt-8 space-y-5">
        <div><Label>Request title</Label><Input required value={title} onChange={(e) => setTitle(e.target.value)} className="mt-2" /></div>
        <div><Label>Visual brief</Label><Textarea required rows={5} value={brief} onChange={(e) => setBrief(e.target.value)} className="mt-2" /></div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Model preference</Label>
            <Select value={model} onValueChange={setModel}>
              <SelectTrigger className="mt-2"><SelectValue placeholder="Any" /></SelectTrigger>
              <SelectContent>
                {SUPPORTED_MODELS.map((m) => <SelectItem key={m.value} value={m.label}>{m.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Usage rights</Label>
            <Select value={rights} onValueChange={(v) => setRights(v as UsageRights)}>
              <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
              <SelectContent>
                {["personal", "commercial", "extended"].map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><Label>Budget (USD)</Label><Input type="number" min="0" value={budget} onChange={(e) => setBudget(e.target.value)} className="mt-2" /></div>
          <div><Label>Deadline</Label><Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} className="mt-2" /></div>
        </div>
        <div>
          <Label>Reference image (optional)</Label>
          <div className="mt-2 border border-dashed border-border h-32 flex items-center justify-center text-neutral-gray text-sm">Upload placeholder</div>
        </div>
        <Button type="submit" variant="signal" size="lg">Post request</Button>
      </form>
    </div>
  );
}
