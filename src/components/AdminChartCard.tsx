import type { ReactNode } from "react";

export function AdminChartCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="border border-border bg-card p-5">
      <h3 className="label-eyebrow mb-4">{title}</h3>
      <div className="h-64">{children}</div>
    </div>
  );
}
