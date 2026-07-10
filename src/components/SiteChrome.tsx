import { Link, useRouterState } from "@tanstack/react-router";
import { Logo } from "./Logo";
import { RoleSwitcher } from "./RoleSwitcher";
import { useAuth } from "@/context/AuthContext";

const NAV = [
  { to: "/browse", label: "Browse" },
  { to: "/advisor", label: "Advisor" },
  { to: "/requests", label: "Requests" },
] as const;

export function SiteHeader() {
  const { role } = useAuth();
  const path = useRouterState({ select: (s) => s.location.pathname });
  return (
    <header className="border-b border-ink bg-warm sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between gap-6">
        <Link to="/" className="text-ink"><Logo /></Link>
        <nav className="hidden md:flex items-center gap-6 text-sm">
          {NAV.map((n) => (
            <Link key={n.to} to={n.to} className={"hover:text-ink " + (path.startsWith(n.to) ? "text-ink" : "text-neutral-gray")}>
              {n.label}
            </Link>
          ))}
          {role === "buyer" && <Link to="/purchases" className={path.startsWith("/purchases") ? "text-ink" : "text-neutral-gray hover:text-ink"}>Purchases</Link>}
          {role === "creator" && <Link to="/creator" className={path.startsWith("/creator") ? "text-ink" : "text-neutral-gray hover:text-ink"}>Creator</Link>}
          {role === "admin" && <Link to="/admin" className={path.startsWith("/admin") ? "text-ink" : "text-neutral-gray hover:text-ink"}>Admin</Link>}
          <Link to="/auth" className="text-neutral-gray hover:text-ink">Sign in</Link>
        </nav>
        <RoleSwitcher />
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-ink mt-24">
      <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs text-neutral-gray">
        <Logo size={22} />
        <p>Proven visuals, verified every time.</p>
        <p>© Pickture</p>
      </div>
    </footer>
  );
}
