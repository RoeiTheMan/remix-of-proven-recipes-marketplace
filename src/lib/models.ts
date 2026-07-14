// Supported image models across the Pickture marketplace.
// The database column stays flexible so we can add more later, but the UI
// only exposes this curated list.

export interface SupportedModel {
  value: string;   // internal identifier written to the DB
  label: string;   // display label
  defaultVersion: string;
}

export const SUPPORTED_MODELS: SupportedModel[] = [
  { value: "gpt-image-2", label: "ChatGPT Images 2", defaultVersion: "2" },
  { value: "nano-banana-pro", label: "Nano Banana Pro", defaultVersion: "pro" },
  { value: "nano-banana-2", label: "Nano Banana 2", defaultVersion: "2" },
  { value: "midjourney-v7", label: "Midjourney V7", defaultVersion: "v7" },
];

const LABELS: Record<string, string> = Object.fromEntries(
  SUPPORTED_MODELS.map((m) => [m.value, m.label]),
);

// Backwards-compat: some legacy DB rows still carry pretty labels ("Midjourney V7")
// as the model value. Normalize any known label back to its display form so
// badges never show a raw slug like `nano-banana-pro`.
export function modelLabel(value: string | undefined | null): string {
  if (!value) return "";
  if (LABELS[value]) return LABELS[value];
  // If the stored value is already a supported label, keep it as-is.
  const asLabel = SUPPORTED_MODELS.find((m) => m.label.toLowerCase() === value.toLowerCase());
  return asLabel ? asLabel.label : value;
}

// Settings fields to surface in the creator form per model family.
export function settingsHintFor(modelValue: string): string[] {
  switch (modelValue) {
    case "midjourney-v7":
      return ["aspect ratio", "stylize", "chaos", "quality", "seed policy", "style reference", "omni-reference"];
    case "gpt-image-2":
      return ["aspect ratio", "quality", "reference-image guidance", "editing instructions", "output requirements"];
    case "nano-banana-pro":
    case "nano-banana-2":
      return ["aspect ratio", "reference-image guidance", "text rendering", "subject consistency", "output requirements"];
    default:
      return ["aspect ratio"];
  }
}
