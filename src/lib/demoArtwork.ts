// Resolves the correct preview image for a listing. Priority:
//   1. Any real uploaded image (previewImages[0] as an http(s):// or /path/ URL)
//   2. A local Pickture demo SVG matched to the listing category/title
//   3. A generic Pickture fallback with "Preview coming soon"
//
// Never queries the network. Never randomizes — same input → same output.

import type { Listing } from "@/types";

const DEMO_DIR = "/demo-listings";

// Ordered rules: first matching keyword wins. Keep the specific ones first
// so e.g. "Skincare Flatlay" hits `social` before `cosmetic`.
const RULES: Array<{ match: RegExp; file: string }> = [
  { match: /amber\s*&\s*moss|botanical fragrance/i, file: "chatgpt-amber-fragrance.png" },
  { match: /sunlit patisserie|caf[eé] launch/i, file: "chatgpt-sunlit-patisserie.png" },
  { match: /moonlit fox|children.?s storybook/i, file: "chatgpt-moonlit-fox.png" },
  { match: /sculpted silver/i, file: "chatgpt-sculpted-silver.png" },
  { match: /mediterranean morning/i, file: "chatgpt-mediterranean-morning.png" },
  { match: /obsidian performance/i, file: "chatgpt-obsidian-performance.png" },
  { match: /quiet form headphones/i, file: "chatgpt-quiet-form-headphones.png" },
  { match: /desert camp at blue hour/i, file: "chatgpt-desert-blue-hour.png" },
  { match: /house above the sea/i, file: "midjourney-house-above-sea.png" },
  { match: /yellow pathways/i, file: "midjourney-organic-landscape.png" },
  { match: /morning latte/i, file: "midjourney-morning-latte.png" },
  { match: /angular urban landmark/i, file: "midjourney-parametric-residence.png" },
  { match: /shell and sea/i, file: "midjourney-shell-portrait.png" },
  { match: /iced matcha/i, file: "midjourney-iced-matcha.png" },
  { match: /red house reflection/i, file: "midjourney-red-house-reflection.png" },
  { match: /messi 10/i, file: "midjourney-messi-10.png" },
  { match: /moon knight astral form/i, file: "midjourney-moon-knight-astral.png" },
  { match: /galactic wheatfield/i, file: "midjourney-cosmic-road.png" },
  { match: /diamond solitaire/i, file: "nano-diamond-solitaire.jpg" },
  { match: /golden retriever studio/i, file: "nano-golden-retriever.jpg" },
  { match: /modern farmhouse at dusk/i, file: "nano-modern-farmhouse.jpg" },
  { match: /skylit marble spa/i, file: "nano-spa-bathroom.jpg" },
  { match: /dewy sage portrait/i, file: "nano-dewy-sage-portrait.jpg" },
  { match: /skincare\s*flatlay|social\s*media/i, file: "social.svg" },
  { match: /watch/i, file: "luxury-watch.svg" },
  { match: /sneaker/i, file: "sneaker.svg" },
  { match: /portrait|beauty/i, file: "portrait.svg" },
  { match: /villa|architect/i, file: "architecture.svg" },
  { match: /fashion|streetwear/i, file: "fashion.svg" },
  { match: /food|dish|espresso|beverage|café|cafe/i, file: "food.svg" },
  { match: /app\s*mockup|mockup|dashboard/i, file: "app-mockup.svg" },
  { match: /logo|monogram/i, file: "logo.svg" },
  { match: /travel|alpine|poster/i, file: "travel-poster.svg" },
  { match: /automotive|coupe|car/i, file: "automotive.svg" },
  { match: /interior|scandinavian|loft/i, file: "interior.svg" },
  { match: /cosmetic|serum/i, file: "cosmetic.svg" },
  { match: /fantasy|twilight|forest|concept/i, file: "fantasy.svg" },
  { match: /ceramic|vase|editorial\s*product|product\s*photograph/i, file: "editorial-product.svg" },
];

function isRealImageRef(src: string | undefined): boolean {
  if (!src) return false;
  // http(s) signed URL or an explicit /public/... path counts as real.
  if (/^https?:\/\//i.test(src)) return true;
  if (src.startsWith("/") && !src.startsWith("/demo-listings/")) return true;
  return false;
}

function demoFileForListing(listing: Listing): string {
  const haystack = `${listing.title} ${listing.imageType} ${listing.styleTags.join(" ")}`;
  for (const rule of RULES) {
    if (rule.match.test(haystack)) return rule.file;
  }
  return "fallback.svg";
}

export function getDemoListingArtwork(listing: Listing): string {
  const uploaded = listing.previewImages?.[0];
  if (isRealImageRef(uploaded)) return uploaded as string;

  const isDemo = listing.styleTags?.includes("pickture-demo");
  if (isDemo) return `${DEMO_DIR}/${demoFileForListing(listing)}`;

  return `${DEMO_DIR}/fallback.svg`;
}

// For places that want a labelled preview but don't have a full Listing.
export function getGenericFallbackUrl(): string {
  return `${DEMO_DIR}/fallback.svg`;
}
