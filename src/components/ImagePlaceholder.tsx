import { cn } from "@/lib/utils";

const palette = [
  "from-[#e9e3d8] to-[#c9c0b1]",
  "from-[#ded7c9] to-[#b8ae9a]",
  "from-[#e3ded2] to-[#a9a293]",
  "from-[#efe9dc] to-[#c0b7a5]",
  "from-[#d8d2c4] to-[#8f8778]",
  "from-[#e6e0d1] to-[#b5ac97]",
];

export function ImagePlaceholder({
  id = "ph-1",
  label,
  className,
  ratio = "aspect-[4/5]",
}: { id?: string; label?: string; className?: string; ratio?: string }) {
  const n = Math.max(0, (parseInt(id.replace(/\D/g, "")) || 1) - 1) % palette.length;
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
