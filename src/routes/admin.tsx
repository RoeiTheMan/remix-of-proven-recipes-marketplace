import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useAuth } from "@/context/AuthContext";

export const Route = createFileRoute("/admin")({ component: AdminLayout });

const NAV = [
  { to: "/admin", label: "Overview", exact: true },
  { to: "/admin/reports", label: "Reports" },
  { to: "/admin/listings", label: "Listings" },
  { to: "/admin/creators", label: "Creators" },
  { to: "/admin/logs", label: "Logs" },
] as const;

function AdminLayout() {
  const { role } = useAuth();
  const path = useRouterState({ select: (s) => s.location.pathname });

  if (role !== "admin") {
    return <div className="max-w-3xl mx-auto px-6 py-16"><h1 className="font-display text-3xl">Admin only</h1><p className="text-neutral-gray mt-2">This area requires administrator permissions. Sign in with an administrator account to continue.</p></div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 grid md:grid-cols-[200px_1fr] gap-10">
      <aside>
        <span className="label-eyebrow">Admin</span>
        <nav className="mt-3 flex flex-col gap-1 border-l border-border">
          {NAV.map((n) => {
            const exact = "exact" in n && n.exact;
            const active = exact ? path === n.to : path.startsWith(n.to) && n.to !== "/admin";
            return (
              <Link key={n.to} to={n.to} className={"pl-3 py-1.5 text-sm border-l-2 -ml-px " + (active ? "border-ink text-ink" : "border-transparent text-neutral-gray hover:text-ink")}>
                {n.label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <div><Outlet /></div>
    </div>
  );
}
