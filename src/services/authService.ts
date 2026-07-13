// Real Lovable Cloud auth service.
import { supabase } from "@/integrations/supabase/client";
import type { Profile, Role } from "@/types";
import { mapProfileRow } from "./_mappers";

export async function signIn(email: string, password: string) {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  try {
    await supabase.rpc("log_event", { _event_type: "login", _payload: { email } });
  } catch {
    /* logging is best-effort */
  }
  return { ok: true as const };
}

export async function signUp(email: string, password: string, displayName?: string) {
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: typeof window !== "undefined" ? window.location.origin : undefined,
      data: displayName ? { display_name: displayName } : undefined,
    },
  });
  if (error) throw error;
  return { ok: true as const };
}

export async function signOut() {
  await supabase.auth.signOut();
}

export async function getCurrentSession() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export async function getCurrentProfile(): Promise<{ profile: Profile; roles: Role[] } | null> {
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) return null;

  const [{ data: prof }, { data: roleRows }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    supabase.from("user_roles").select("role").eq("user_id", user.id),
  ]);

  const roles: Role[] = (roleRows ?? []).map((r) => r.role as Role);
  const highest: Role = roles.includes("admin")
    ? "admin"
    : roles.includes("creator")
      ? "creator"
      : roles.includes("buyer")
        ? "buyer"
        : "buyer";

  const profileRow =
    prof ?? {
      id: user.id,
      display_name: user.email?.split("@")[0] ?? "User",
      avatar_url: undefined,
      created_at: user.created_at ?? new Date().toISOString(),
    };

  return { profile: mapProfileRow(profileRow, highest), roles };
}

// Buyer → creator onboarding via secure RPC.
export async function becomeCreator(input: {
  displayName: string;
  tagline: string;
  portfolioUrl?: string;
  bio?: string;
}) {
  const { data, error } = await supabase.rpc("become_creator", {
    _display_name: input.displayName,
    _tagline: input.tagline,
    _portfolio_url: input.portfolioUrl ?? null,
    _bio: input.bio ?? null,
  });
  if (error) throw error;
  return data;
}

// Compatibility no-op kept for any leftover call sites.
export async function fakeSignIn(email: string) {
  return { ok: true as const, email };
}
export async function fakeSignUp(email: string) {
  return { ok: true as const, email };
}
