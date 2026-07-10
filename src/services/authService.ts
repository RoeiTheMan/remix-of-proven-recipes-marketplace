// Mock implementation — replace with Supabase in M1.
import { db, delay, pushLog } from "./_store";
import type { Role, Profile } from "@/types";

const ROLE_TO_ID: Record<Role, string> = {
  guest: "u_guest",
  buyer: "u_buyer",
  creator: "u_creator1",
  admin: "u_admin",
};

export async function getUserForRole(role: Role): Promise<Profile> {
  await delay(60);
  const id = ROLE_TO_ID[role];
  return db.profiles.find((p) => p.id === id)!;
}

export async function fakeSignIn(email: string) {
  await delay();
  pushLog({ eventType: "login", payload: { email } });
  return { ok: true as const };
}

export async function fakeSignUp(email: string) {
  await delay();
  pushLog({ eventType: "login", payload: { email, signup: true } });
  return { ok: true as const };
}
