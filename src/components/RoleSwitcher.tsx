// Real "who am I" indicator + sign-out. Replaces the public role dropdown.
// Public role switching is a build-time concept only — real roles come from the
// user_roles table on the backend.
import { Link } from "@tanstack/react-router";
import { useAuth } from "@/context/AuthContext";
import { Button } from "./ui/button";
import { LogOut } from "lucide-react";

export function RoleSwitcher() {
  const { role, isSignedIn, user, signOut, loading } = useAuth();

  if (loading) {
    return <div className="h-8 w-24 border border-border animate-pulse" aria-hidden />;
  }

  if (!isSignedIn) {
    return (
      <Button asChild size="sm" variant="signal">
        <Link to="/auth">Sign in</Link>
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <div className="hidden sm:flex flex-col items-end leading-tight">
        <span className="label-eyebrow text-teal">{role}</span>
        <span className="text-xs text-neutral-gray truncate max-w-[140px]">{user?.displayName}</span>
      </div>
      <Button
        onClick={() => signOut()}
        variant="outline"
        size="sm"
        className="h-8 gap-1.5 text-xs"
      >
        <LogOut className="h-3 w-3" />
        <span className="hidden sm:inline">Sign out</span>
      </Button>
    </div>
  );
}
