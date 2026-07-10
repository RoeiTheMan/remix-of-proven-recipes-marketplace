import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getListings } from "@/services/listingsService";
import { ListingCard } from "@/components/ListingCard";
import { Button } from "@/components/ui/button";
import { Play, ShieldCheck, MessagesSquare } from "lucide-react";

export const Route = createFileRoute("/")({ component: Landing });

function Landing() {
  const { data } = useQuery({ queryKey: ["listings", "featured"], queryFn: () => getListings({}, "top_rated", 1, 6) });
  const featured = data?.items ?? [];

  return (
    <div>
      {/* HERO */}
      <section className="border-b border-ink">
        <div className="max-w-7xl mx-auto px-6 pt-20 pb-16 grid md:grid-cols-12 gap-10">
          <div className="md:col-span-7">
            <span className="label-eyebrow">The verified visual-recipe marketplace</span>
            <h1 className="font-display text-5xl md:text-7xl leading-[1.02] mt-4 tracking-tight">
              Search verified<br />visual recipes.
            </h1>
            <p className="mt-6 text-lg text-neutral-gray max-w-xl">
              Buy complete AI image-generation specifications that are tested, reproducible, and rated by real users.
            </p>
            <p className="mt-3 text-sm text-teal uppercase tracking-widest">Proven visuals, verified every time.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="bg-ink text-warm hover:bg-ink/90">
                <Link to="/advisor">Find My Best Recipe</Link>
              </Button>
              <Button asChild size="lg" variant="signal">
                <Link to="/creator">Start Selling</Link>
              </Button>
            </div>
          </div>
          <div className="md:col-span-5">
            <div className="aspect-video border border-ink bg-secondary flex items-center justify-center relative">
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                <div className="h-14 w-14 rounded-full border border-ink flex items-center justify-center">
                  <Play className="h-6 w-6 text-ink" />
                </div>
                <span className="label-eyebrow">HeyGen Explainer Video — coming later</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW */}
      <section className="border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <span className="label-eyebrow">How the marketplace works</span>
          <p className="font-display text-3xl md:text-4xl max-w-3xl mt-3">
            Creators publish tested recipes. Buyers search, match, purchase, generate, and review. Admins protect quality and trust.
          </p>
        </div>
      </section>

      {/* ROLE CARDS */}
      <section className="max-w-7xl mx-auto px-6 py-16 grid md:grid-cols-3 gap-6">
        {[
          { title: "Buyer", body: "Search and buy proven recipes with match scores, consistency ratings, and clear usage rights.", to: "/browse", label: "Browse recipes" },
          { title: "Creator", body: "Publish verified visual specifications and monetize a repeatable creative process.", to: "/creator", label: "Open dashboard" },
          { title: "Marketplace Administrator", body: "Monitor trust, reports, transactions, users, and marketplace health.", to: "/admin", label: "Open admin" },
        ].map((c) => (
          <div key={c.title} className="border border-border bg-card p-6 flex flex-col">
            <span className="label-eyebrow">{c.title}</span>
            <h3 className="font-display text-2xl mt-3">{c.title === "Marketplace Administrator" ? "Trust operator" : c.title === "Creator" ? "Recipe author" : "Confident buyer"}</h3>
            <p className="text-sm text-neutral-gray mt-3 flex-1">{c.body}</p>
            <Link to={c.to} className="text-sm text-ink underline underline-offset-4 mt-6 self-start">{c.label} →</Link>
          </div>
        ))}
      </section>

      {/* FEATURED */}
      <section className="border-t border-ink">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="flex items-end justify-between mb-8">
            <div>
              <span className="label-eyebrow">Featured this week</span>
              <h2 className="font-display text-3xl md:text-4xl mt-2">Verified recipes</h2>
            </div>
            <Link to="/browse" className="text-sm underline underline-offset-4">See all →</Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featured.map((l) => <ListingCard key={l.id} listing={l} />)}
          </div>
        </div>
      </section>

      {/* CONSISTENCY + CUSTOM */}
      <section className="border-t border-border">
        <div className="max-w-7xl mx-auto px-6 py-16 grid md:grid-cols-2 gap-10">
          <div className="border border-border p-8 bg-card">
            <ShieldCheck className="h-6 w-6 text-teal" />
            <h2 className="font-display text-3xl mt-4">Consistency Score</h2>
            <p className="text-neutral-gray mt-3">
              Every recipe carries a Consistency Score — a measured indicator of how reliably it reproduces its verified preview across seeds, aspect ratios, and small prompt variations. Higher scores mean fewer surprises.
            </p>
          </div>
          <div className="border border-border p-8 bg-card">
            <MessagesSquare className="h-6 w-6 text-signal" />
            <h2 className="font-display text-3xl mt-4">Custom Requests</h2>
            <p className="text-neutral-gray mt-3">
              Need something specific? Post a brief, receive offers from creators, compare and accept one, chat, review the delivery, and leave a rating. All within Pickture.
            </p>
            <Link to="/requests" className="text-sm text-ink underline underline-offset-4 mt-6 inline-block">Explore requests →</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
