import type { ReactNode } from "react";

export function StatCard({ label, value, hint, accent }: { label: string; value: ReactNode; hint?: string; accent?: "teal" | "signal" }) {
  const color = accent === "teal" ? "text-teal" : accent === "signal" ? "text-signal" : "text-ink";
  return (
    <div className="border border-border bg-card p-5">
      <div className="label-eyebrow">{label}</div>
      <div className={"font-display text-3xl mt-2 " + color}>{value}</div>
      {hint && <div className="text-xs text-neutral-gray mt-1">{hint}</div>}
    </div>
  );
}
