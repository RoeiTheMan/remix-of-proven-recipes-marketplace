import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { findBestPrompts, type AdvisorResponse } from "@/services/advisorService";
import { MatchResultCard } from "@/components/MatchResultCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { LoaderCircle, Mic } from "lucide-react";
import { BrandLottie } from "@/components/BrandLottie";
import aiThinking from "@/assets/lottie/ai-thinking";
import { toast } from "sonner";

export const Route = createFileRoute("/advisor")({
  head: () => ({
    meta: [
      { title: "Advisor — Pickture" },
      {
        name: "description",
        content: "Describe the visual you need; we match it to verified recipes.",
      },
    ],
  }),
  component: Advisor,
});

function Advisor() {
  const [query, setQuery] = useState("");
  const [response, setResponse] = useState<AdvisorResponse | null>(null);
  const [loading, setLoading] = useState(false);

  async function run() {
    if (!query.trim()) {
      toast.error("Describe the visual you need first.");
      return;
    }
    setLoading(true);
    setResponse(null);
    try {
      setResponse(await findBestPrompts(query));
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not load Advisor recommendations",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-16">
      <span className="label-eyebrow">Advisor · Prompt Match Score</span>
      <h1 className="font-display text-5xl mt-3">Describe the visual you need.</h1>
      <p className="text-neutral-gray mt-3">
        We rank verified recipes by match score, consistency, model fit, license fit, price, and
        rating.
      </p>

      <div className="mt-8 flex gap-2">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && run()}
          placeholder="Example: cinematic sneaker campaign, moody light, commercial license, under $15"
          maxLength={500}
          className="h-12 text-base"
        />
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon" disabled className="h-12 w-12">
                <Mic />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Voice search connects later.</TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <Button
          size="lg"
          onClick={run}
          disabled={loading}
          aria-busy={loading}
          className="h-12 min-w-52"
        >
          {loading ? (
            <>
              <LoaderCircle className="animate-spin" />
              Finding matches…
            </>
          ) : (
            "Find My Best Recipe"
          )}
        </Button>
      </div>

      <div className="mt-10">
        {loading && (
          <div className="border border-border bg-card p-10 text-center flex flex-col items-center gap-2">
            <BrandLottie animationData={aiThinking} loop style={{ height: 48, width: 160 }} />
            <span className="label-eyebrow">Matching verified recipes…</span>
          </div>
        )}
        {!loading && response && (
          <div className="space-y-3">
            <div>
              <span className="label-eyebrow">
                {response.source === "gemini" ? "Gemini-ranked matches" : "Pickture score matches"}
              </span>
              {response.summary && (
                <p className="text-sm text-neutral-gray mt-1">{response.summary}</p>
              )}
            </div>
            {response.results.map((result) => (
              <MatchResultCard key={result.listing.id} result={result} />
            ))}
            {response.results.length === 0 && (
              <p className="text-neutral-gray">No matches. Try broadening your description.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
