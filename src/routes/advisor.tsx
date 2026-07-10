import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { findBestPrompts, type AdvisorResult } from "@/services/advisorService";
import { MatchResultCard } from "@/components/MatchResultCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Mic, Sparkles } from "lucide-react";

export const Route = createFileRoute("/advisor")({
  head: () => ({ meta: [{ title: "Advisor — Pickture" }, { name: "description", content: "Describe the visual you need; we match it to verified recipes." }] }),
  component: Advisor,
});

function Advisor() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<AdvisorResult[] | null>(null);
  const [loading, setLoading] = useState(false);

  async function run() {
    if (!query.trim()) return;
    setLoading(true);
    const r = await findBestPrompts(query);
    setResults(r);
    setLoading(false);
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-16">
      <span className="label-eyebrow">Advisor · Prompt Match Score</span>
      <h1 className="font-display text-5xl mt-3">Describe the visual you need.</h1>
      <p className="text-neutral-gray mt-3">We rank verified recipes by match score, consistency, model fit, license fit, price, and rating.</p>

      <div className="mt-8 flex gap-2">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && run()}
          placeholder="Example: cinematic sneaker campaign, moody light, commercial license, under $15"
          className="h-12 text-base"
        />
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon" disabled className="h-12 w-12"><Mic /></Button>
            </TooltipTrigger>
            <TooltipContent>Voice search connects later.</TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <Button size="lg" onClick={run} disabled={loading} className="h-12">Find My Best Recipe</Button>
      </div>

      <div className="mt-10">
        {loading && (
          <div className="border border-border bg-card p-10 text-center flex flex-col items-center gap-3">
            <Sparkles className="h-6 w-6 text-teal animate-pulse" />
            <span className="label-eyebrow">AI thinking animation placeholder</span>
          </div>
        )}
        {!loading && results && (
          <div className="space-y-3">
            <span className="label-eyebrow">Ranked matches</span>
            {results.map((r) => <MatchResultCard key={r.listing.id} result={r} />)}
            {results.length === 0 && <p className="text-neutral-gray">No matches. Try broadening your description.</p>}
          </div>
        )}
      </div>
    </div>
  );
}
