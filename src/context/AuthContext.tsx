// Real Lovable Cloud AuthContext.
// Exposes the same shape used by existing pages: { role, user, canAccess }.
// setRole is a no-op (kept for backward-compat during migration); a real role
// change happens via signUp (buyer default) or becomeCreator RPC.
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentProfile, signOut as authSignOut } from "@/services/authService";
import type { Profile, Role } from "@/types";

interface AuthState {
  role: Role; // "guest" when signed out; otherwise highest granted role
  user: Profile | null;
  roles: Role[];
  loading: boolean;
  isBuyer: boolean;
  isCreator: boolean;
  isAdmin: boolean;
  isSignedIn: boolean;
  setRole: (r: Role) => void; // no-op — kept so existing components compile
  canAccess: (allowed: Role[]) => boolean;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    const res = await getCurrentProfile();
    if (res) {
      setUser(res.profile);
      setRoles(res.roles);
    } else {
      setUser(null);
      setRoles([]);
    }
    setLoading(false);
  }

  useEffect(() => {
    // Register listener FIRST, then load session (avoids missed events).
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") {
        // Defer to avoid blocking the callback
        setTimeout(() => {
          refresh();
        }, 0);
      }
    });
    refresh();
    return () => sub.subscription.unsubscribe();
  }, []);

  const isSignedIn = !!user;
  const isAdmin = roles.includes("admin");
  const isCreator = roles.includes("creator");
  const isBuyer = roles.includes("buyer");
  const role: Role = isAdmin ? "admin" : isCreator ? "creator" : isBuyer ? "buyer" : "guest";

  const value: AuthState = {
    role,
    user,
    roles,
    loading,
    isBuyer,
    isCreator,
    isAdmin,
    isSignedIn,
    setRole: () => {
      /* no-op: roles are set on the backend, never by the browser */
    },
    canAccess: (allowed) => allowed.includes(role),
    refresh,
    signOut: async () => {
      await authSignOut();
      setUser(null);
      setRoles([]);
    },
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth outside AuthProvider");
  return ctx;
}
