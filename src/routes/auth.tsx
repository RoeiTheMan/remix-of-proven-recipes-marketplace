import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { signIn, signUp } from "@/services/authService";
import { useAuth } from "@/context/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const search = z.object({ next: z.string().optional() });

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Sign in — Pickture" }] }),
  validateSearch: search,
  component: Auth,
});

function Auth() {
  const nav = useNavigate();
  const { refresh } = useAuth();
  const { next } = useSearch({ from: "/auth" });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(kind: "in" | "up", e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      if (kind === "in") {
        await signIn(email, password);
        toast.success("Welcome back.");
      } else {
        await signUp(email, password, displayName || email.split("@")[0]);
        toast.success("Account created.");
      }
      await refresh();
      nav({ to: (next as "/" | undefined) ?? "/browse" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-md mx-auto px-6 py-20">
      <span className="label-eyebrow">Account</span>
      <h1 className="font-display text-4xl mt-2 mb-8">Welcome to Pickture</h1>
      <Tabs defaultValue="in">
        <TabsList className="w-full grid grid-cols-2">
          <TabsTrigger value="in">Sign in</TabsTrigger>
          <TabsTrigger value="up">Sign up</TabsTrigger>
        </TabsList>
        <TabsContent value="in">
          <form className="space-y-4 mt-6" onSubmit={(e) => submit("in", e)}>
            <div><Label>Email</Label><Input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-2" /></div>
            <div><Label>Password</Label><Input type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-2" /></div>
            <Button type="submit" className="w-full" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</Button>
          </form>
        </TabsContent>
        <TabsContent value="up">
          <form className="space-y-4 mt-6" onSubmit={(e) => submit("up", e)}>
            <div><Label>Display name</Label><Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="mt-2" placeholder="How other Pickture users see you" /></div>
            <div><Label>Email</Label><Input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-2" /></div>
            <div><Label>Password</Label><Input type="password" required autoComplete="new-password" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className="mt-2" /></div>
            <Button type="submit" variant="signal" className="w-full" disabled={busy}>{busy ? "Creating…" : "Create account"}</Button>
          </form>
        </TabsContent>
      </Tabs>
      <p className="text-xs text-neutral-gray mt-6 text-center">By continuing you agree to Pickture's terms.</p>
    </div>
  );
}
