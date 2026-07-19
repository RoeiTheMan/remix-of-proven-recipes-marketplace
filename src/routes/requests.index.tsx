import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getRequests } from "@/services/requestsService";
import { RequestCard } from "@/components/RequestCard";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/requests/")({
  head: () => ({ meta: [{ title: "Custom recipe requests — Pickture" }] }),
  component: Requests,
});

function Requests() {
  const { data = [] } = useQuery({ queryKey: ["requests"], queryFn: getRequests });

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      <div className="flex items-end justify-between mb-8">
        <div>
          <span className="label-eyebrow">Custom requests board</span>
          <h1 className="font-display text-4xl mt-2">Open briefs</h1>
        </div>
        <Button asChild variant="signal"><Link to="/requests/new">Post a Request</Link></Button>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {data.map((r) => <RequestCard key={r.id} request={r} />)}
      </div>
    </div>
  );
}
