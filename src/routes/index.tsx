import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getListings } from "@/services/listingsService";
import { ListingCard } from "@/components/ListingCard";
import { Button } from "@/components/ui/button";
import { ShieldCheck, MessagesSquare } from "lucide-react";
import { TextMorph } from "@/components/ui/text-morph";
import { Marquee } from "@/components/ui/marquee";
import { TestimonialsColumn, type Testimonial } from "@/components/ui/testimonials-columns-1";
import { modelLabel } from "@/lib/models";

const testimonials: Testimonial[] = [
  {
    text: "I stopped burning hours re-rolling prompts. I bought a product-shot recipe, followed it exactly, and got the same clean result on the first try.",
    image: "https://randomuser.me/api/portraits/women/44.jpg",
    name: "Maya Rosen",
    role: "Brand Designer",
  },
  {
    text: "Selling my tested Midjourney recipes turned my process into real income. Buyers trust the consistency score, so they actually convert.",
    image: "https://randomuser.me/api/portraits/men/32.jpg",
    name: "Daniel Okafor",
    role: "AI Artist & Creator",
  },
  {
    text: "The verified reviews are the difference. I can see a recipe actually reproduces before I pay for it — no more guessing.",
    image: "https://randomuser.me/api/portraits/women/68.jpg",
    name: "Sofia Marchetti",
    role: "Content Creator",
  },
  {
    text: "We needed a specific brand look. I posted a custom request, got three offers, and had a delivered recipe the same week.",
    image: "https://randomuser.me/api/portraits/men/75.jpg",
    name: "Tom Bergman",
    role: "Marketing Lead",
  },
  {
    text: "As a creator, the protected-recipe unlock means my prompts stay mine until someone buys. That trust is why I list here.",
    image: "https://randomuser.me/api/portraits/women/65.jpg",
    name: "Amara Singh",
    role: "Freelance Illustrator",
  },
  {
    text: "Pickture cut our creative turnaround in half. Consistent product imagery across the whole store, no in-house prompt expert needed.",
    image: "https://randomuser.me/api/portraits/men/54.jpg",
    name: "Lucas Fields",
    role: "E-commerce Founder",
  },
  {
    text: "The consistency score is genuinely useful — I filter for high scores and the results hold up across seeds and aspect ratios.",
    image: "https://randomuser.me/api/portraits/women/90.jpg",
    name: "Nina Kovač",
    role: "Art Director",
  },
  {
    text: "I made back my first month just selling three recipe packs. The sale notifications and dashboard make it feel like a real storefront.",
    image: "https://randomuser.me/api/portraits/men/11.jpg",
    name: "Ryan Mitchell",
    role: "Prompt Engineer",
  },
  {
    text: "Onboarding was instant. I searched, found a portrait recipe, unlocked it, and generated something client-ready in minutes.",
    image: "https://randomuser.me/api/portraits/women/33.jpg",
    name: "Elena Torres",
    role: "Studio Photographer",
  },
];

const firstColumn = testimonials.slice(0, 3);
const secondColumn = testimonials.slice(3, 6);
const thirdColumn = testimonials.slice(6, 9);

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
              Search verified<br />
              <TextMorph
                words={["visual recipes.", "product shots.", "portraits.", "brand visuals.", "poster art."]}
                interval={2800}
                className="text-teal"
              />
            </h1>
            <p className="mt-6 text-lg text-neutral-gray max-w-xl">
              Buy complete AI image-generation specifications that are tested, reproducible, and rated by real users.
            </p>
            <p className="mt-3 text-sm text-teal uppercase tracking-widest">Proven visuals, verified every time.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="bg-ink text-warm hover:bg-ink/90">
                <Link to="/browse">Enter the Marketplace</Link>
              </Button>
              <Button asChild size="lg" variant="signal">
                <Link to="/advisor">Find My Best Recipe</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/creator">Start Selling</Link>
              </Button>
            </div>
          </div>
          <div className="md:col-span-5">
            <video
              className="aspect-video w-full border border-ink bg-secondary object-cover"
              src="/media/pickture-explainer.mp4"
              poster="/media/pickture-explainer-poster.jpg"
              controls
              playsInline
              preload="metadata"
              aria-label="Pickture explainer video"
            />
            <span className="label-eyebrow mt-2 block text-neutral-gray">Watch the explainer</span>
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

      {/* LIVE CATALOG MARQUEE — 21st.dev Marquee over real listings */}
      {featured.length > 0 && (
        <section className="border-t border-ink bg-card">
          <Marquee pauseOnHover className="[--duration:35s] py-1">
            {featured.map((l) => (
              <Link
                key={l.id}
                to="/listing/$id"
                params={{ id: l.id }}
                className="flex items-center gap-2 text-sm whitespace-nowrap px-4 hover:text-teal"
              >
                <span className="font-medium">{l.title}</span>
                <span className="label-eyebrow text-neutral-gray">{modelLabel(l.model)}</span>
              </Link>
            ))}
          </Marquee>
        </section>
      )}

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

      {/* TESTIMONIALS — 21st.dev Testimonials Columns over marketplace users */}
      <section className="border-t border-ink">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="text-center max-w-xl mx-auto">
            <span className="label-eyebrow">Testimonials</span>
            <h2 className="font-display text-3xl md:text-4xl mt-2">Trusted by buyers and creators</h2>
            <p className="text-neutral-gray mt-3">
              Real results from the people who search, sell, and generate with Pickture.
            </p>
          </div>
          <div className="flex justify-center gap-6 mt-12 [mask-image:linear-gradient(to_bottom,transparent,black_25%,black_75%,transparent)] max-h-[600px] overflow-hidden">
            <TestimonialsColumn testimonials={firstColumn} duration={15} />
            <TestimonialsColumn testimonials={secondColumn} className="hidden md:block" duration={19} />
            <TestimonialsColumn testimonials={thirdColumn} className="hidden lg:block" duration={17} />
          </div>
        </div>
      </section>
    </div>
  );
}
