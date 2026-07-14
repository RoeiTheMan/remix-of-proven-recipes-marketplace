import { useState } from "react";
import { cn } from "@/lib/utils";

const palette = [
  "from-[#e9e3d8] to-[#c9c0b1]",
  "from-[#ded7c9] to-[#b8ae9a]",
  "from-[#e3ded2] to-[#a9a293]",
  "from-[#efe9dc] to-[#c0b7a5]",
  "from-[#d8d2c4] to-[#8f8778]",
  "from-[#e6e0d1] to-[#b5ac97]",
];

// Renders a signed image URL when the string looks like a URL; otherwise
// falls back to the Pickture editorial gradient placeholder.
export function ImagePlaceholder({
  id = "ph-1",
  label,
  className,
  ratio = "aspect-[4/5]",
}: { id?: string; label?: string; className?: string; ratio?: string }) {
  const [errored, setErrored] = useState(false);
  const isUrl = typeof id === "string" && /^https?:\/\//i.test(id);
  const n = Math.max(0, (parseInt((id || "1").replace(/\D/g, "")) || 1) - 1) % palette.length;

  if (isUrl && !errored) {
    return (
      <div className={cn("w-full overflow-hidden bg-secondary border border-border relative", ratio, className)}>
        <img
          src={id}
          alt={label ?? "Verified visual"}
          onError={() => setErrored(true)}
          className="absolute inset-0 h-full w-full object-cover"
          loading="lazy"
        />
        {label && (
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/30 to-transparent p-3">
            <span className="label-eyebrow text-white/90">{label}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "w-full overflow-hidden bg-gradient-to-br border border-border relative",
        palette[n],
        ratio,
        className,
      )}
    >
      <div className="absolute inset-0 flex items-end p-3">
        <span className="label-eyebrow text-ink/70">{label ?? "Verified visual"}</span>
      </div>
    </div>
  );
}
