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

// Model-specific settings fields for the creator form. Only fields relevant
// to the selected model family are shown (course requirement: no
// Midjourney-only parameters on ChatGPT/Nano Banana listings).
export interface SettingsField {
  key: string;
  label: string;
  placeholder: string;
}

export function settingsFieldsFor(modelValue: string): SettingsField[] {
  switch (modelValue) {
    case "midjourney-v7":
      return [
        { key: "stylize", label: "Stylize", placeholder: "e.g. 250" },
        { key: "chaos", label: "Chaos", placeholder: "e.g. 10" },
        { key: "quality", label: "Quality", placeholder: "e.g. 1" },
        { key: "seed_policy", label: "Seed guidance", placeholder: "e.g. fixed seed 1234 for consistency" },
        { key: "style_reference", label: "Style reference", placeholder: "how to use --sref" },
        { key: "omni_reference", label: "Omni-reference", placeholder: "how to use --oref" },
      ];
    case "gpt-image-2":
      return [
        { key: "quality", label: "Quality", placeholder: "e.g. high" },
        { key: "reference_guidance", label: "Reference-image guidance", placeholder: "how to attach & weight references" },
        { key: "edit_instructions", label: "Edit instructions", placeholder: "follow-up edit prompts that work" },
        { key: "output_requirements", label: "Output requirements", placeholder: "e.g. transparent background, PNG" },
      ];
    case "nano-banana-pro":
    case "nano-banana-2":
      return [
        { key: "reference_guidance", label: "Reference-image guidance", placeholder: "how to attach references" },
        { key: "text_rendering", label: "Text rendering", placeholder: "instructions for in-image text" },
        { key: "subject_consistency", label: "Subject consistency", placeholder: "how to keep the subject stable" },
        { key: "output_requirements", label: "Output requirements", placeholder: "e.g. 4K, no watermark" },
      ];
    default:
      return [];
  }
}
