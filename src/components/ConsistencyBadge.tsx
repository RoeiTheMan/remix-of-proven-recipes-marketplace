import { ShieldCheck } from "lucide-react";

export function ConsistencyBadge({ score, size = "sm" }: { score: number; size?: "sm" | "md" }) {
  return (
    <span
      className={
        "inline-flex items-center gap-1 border border-teal text-teal bg-teal/5 " +
        (size === "sm" ? "px-1.5 py-0.5 text-[11px]" : "px-2 py-1 text-xs") +
        " font-medium rounded-sm"
      }
      title="Consistency Score — how reliably this recipe reproduces its verified preview."
    >
      <ShieldCheck className={size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"} />
      <span className="uppercase tracking-wider">Consistency</span>
      <span className="font-mono">{score}</span>
    </span>
  );
}
