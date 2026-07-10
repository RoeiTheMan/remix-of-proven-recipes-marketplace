import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { getUserForRole } from "@/services/authService";
import type { Profile, Role } from "@/types";

interface AuthState {
  role: Role;
  user: Profile | null;
  setRole: (r: Role) => void;
  canAccess: (allowed: Role[]) => boolean;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [role, setRoleState] = useState<Role>("guest");
  const [user, setUser] = useState<Profile | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("pickture:role") as Role | null;
      if (stored) setRoleState(stored);
    } catch {}
  }, []);

  useEffect(() => {
    let ok = true;
    getUserForRole(role).then((u) => { if (ok) setUser(u); });
    try { localStorage.setItem("pickture:role", role); } catch {}
    return () => { ok = false; };
  }, [role]);

  const value: AuthState = {
    role,
    user,
    setRole: setRoleState,
    canAccess: (allowed) => allowed.includes(role),
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth outside AuthProvider");
  return ctx;
}
