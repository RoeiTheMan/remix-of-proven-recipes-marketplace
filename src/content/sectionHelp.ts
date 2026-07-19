export interface SectionHelpContent {
  id: string;
  section: string;
  title: string;
  description: string;
  steps: string[];
  narration: string;
}

const HELP_CONTENT = {
  browse: {
    id: "browse",
    section: "Browse",
    title: "Find a proven visual recipe",
    description:
      "Browse is Pickture's marketplace of tested AI image-generation recipes. Preview the result and recipe details before deciding what fits your project.",
    steps: [
      "Use the filters to narrow recipes by model, style, price, usage rights, and consistency.",
      "Open a recipe to review its examples, creator, rating, and included license.",
      "Purchase a recipe to unlock its full prompt, settings, and usage notes in Purchases.",
    ],
    narration:
      "Welcome to Browse. This is where you can explore tested visual recipes from Pickture creators. Start with the filters to narrow down the model, style, budget, and usage rights you need. When something catches your eye, open it to review the examples and creator details. If it feels right for your project, purchasing it will add the complete recipe to your private library.",
  },
  listing: {
    id: "listing",
    section: "Browse",
    title: "Review this recipe before buying",
    description:
      "A listing shows the evidence and terms for one visual recipe while keeping its full prompt protected until purchase.",
    steps: [
      "Compare the preview images, consistency score, model version, and buyer ratings.",
      "Check the usage rights and what the purchase includes.",
      "Buy the recipe to unlock the private prompt and settings in Purchases.",
    ],
    narration:
      "You're looking at a recipe listing. Use this page to decide whether the recipe is a good fit before you buy it. Take a look at the preview images, consistency score, model version, license, and buyer feedback. The creator's full prompt stays protected until purchase, and then it becomes available in your Purchases library.",
  },
  advisor: {
    id: "advisor",
    section: "Advisor",
    title: "Let Advisor narrow the marketplace",
    description:
      "Advisor turns a plain-language visual brief into ranked matches from Pickture's verified recipes.",
    steps: [
      "Type your brief or use the microphone to describe the image you need.",
      "Gemini ranks suitable recipes using fit, consistency, model, license, price, and rating.",
      "Open the recommended recipes to compare them before purchasing.",
    ],
    narration:
      "Welcome to Advisor. Simply describe the visual you're trying to create, either by typing or using the microphone. Advisor will compare your brief with Pickture's verified recipes and bring the strongest matches to the top. You can then open the recommendations, compare their details, and choose the one that best fits your project.",
  },
  requests: {
    id: "requests",
    section: "Requests",
    title: "Commission a recipe for a specific brief",
    description:
      "Requests connects buyers with creators when the marketplace does not already have the exact visual recipe they need.",
    steps: [
      "Post a clear brief with your budget, deadline, model, and usage requirements.",
      "Creators can submit offers explaining their approach, price, and delivery time.",
      "Choose an offer, review the delivered recipe, and keep the conversation in the request.",
    ],
    narration:
      "Requests is for projects that need something more specific than the recipes already in the marketplace. Post a clear brief with your budget, deadline, preferred model, and usage needs. Creators can respond with their approach and price, and you can choose the offer that feels like the best fit. The conversation and final delivery stay together inside the request.",
  },
  purchases: {
    id: "purchases",
    section: "Purchases",
    title: "Use your unlocked recipe library",
    description: "Purchases is your private library for every recipe you have bought on Pickture.",
    steps: [
      "Open a purchase to see the full prompt, negative prompt, settings, and usage notes.",
      "Follow the listed model version and settings for the most reproducible result.",
      "After trying the recipe, leave a verified-purchase review for other buyers.",
    ],
    narration:
      "Welcome to Purchases, your private recipe library. Every recipe you buy appears here with its complete prompt, settings, model details, and usage notes. Open a recipe whenever you're ready to generate, follow the creator's setup for the most consistent result, and leave a review after you've had a chance to try it.",
  },
  creator: {
    id: "creator",
    section: "Creator",
    title: "Publish and manage proven recipes",
    description:
      "Creator is your workspace for turning tested visual workflows into marketplace listings.",
    steps: [
      "Create a listing with its public details, protected recipe, price, and usage rights.",
      "Upload representative preview images and publish when the listing is ready.",
      "Track listings, buyer activity, reviews, and recent sales from the dashboard.",
    ],
    narration:
      "Welcome to your Creator workspace. This is where you turn a tested visual workflow into a marketplace listing. Add the public description, protected recipe, preview images, price, and usage rights, then publish when everything is ready. You can return here to manage your listings and keep an eye on sales and buyer activity.",
  },
  creatorProfile: {
    id: "creator-profile",
    section: "Creator",
    title: "Understand a creator's track record",
    description:
      "Creator profiles help buyers evaluate who made a recipe and how reliably their listings perform.",
    steps: [
      "Review the creator's identity, specialty, reliability, ratings, and sales history.",
      "Browse their published recipes and compare their consistency scores.",
      "Open any listing to inspect its license, evidence, and buyer reviews.",
    ],
    narration:
      "This creator profile gives you a quick sense of who made the recipes and how their work performs. You can review their specialty, reliability, ratings, and sales history, then browse the recipes they've published. Open any listing that interests you to see its examples, license, and buyer feedback.",
  },
  admin: {
    id: "admin",
    section: "Admin",
    title: "Operate and moderate Pickture",
    description:
      "Admin brings marketplace health, moderation, and operational activity into one protected workspace.",
    steps: [
      "Use Overview to monitor marketplace activity and key operational signals.",
      "Review reports, listings, and creators when moderation is required.",
      "Use Logs to investigate important platform events without exposing protected recipe content.",
    ],
    narration:
      "Welcome to the Admin workspace. This area brings together the tools needed to monitor and moderate Pickture. Start with the overview for a snapshot of marketplace activity, use the review areas when a listing, creator, or report needs attention, and check the logs when you need more context about an important platform event.",
  },
} satisfies Record<string, SectionHelpContent>;

export function getSectionHelp(pathname: string): SectionHelpContent | null {
  if (pathname.startsWith("/listing/")) return HELP_CONTENT.listing;
  if (pathname.startsWith("/creator-profile/")) return HELP_CONTENT.creatorProfile;
  if (pathname.startsWith("/browse")) return HELP_CONTENT.browse;
  if (pathname.startsWith("/advisor")) return HELP_CONTENT.advisor;
  if (pathname.startsWith("/requests")) return HELP_CONTENT.requests;
  if (pathname.startsWith("/purchases")) return HELP_CONTENT.purchases;
  if (pathname.startsWith("/creator")) return HELP_CONTENT.creator;
  if (pathname.startsWith("/admin")) return HELP_CONTENT.admin;
  return null;
}

export function getSectionHelpNarration(content: SectionHelpContent): string {
  return content.narration;
}
