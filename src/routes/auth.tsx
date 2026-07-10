import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { fakeSignIn, fakeSignUp } from "@/services/authService";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Sign in — Pickture" }] }),
  component: Auth,
});

function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function submit(kind: "in" | "up", e: React.FormEvent) {
    e.preventDefault();
    if (kind === "in") await fakeSignIn(email); else await fakeSignUp(email);
    toast("Auth connects in the next phase.");
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
            <div><Label>Email</Label><Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-2" /></div>
            <div><Label>Password</Label><Input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="mt-2" /></div>
            <Button type="submit" className="w-full">Sign in</Button>
          </form>
        </TabsContent>
        <TabsContent value="up">
          <form className="space-y-4 mt-6" onSubmit={(e) => submit("up", e)}>
            <div><Label>Email</Label><Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-2" /></div>
            <div><Label>Password</Label><Input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="mt-2" /></div>
            <Button type="submit" variant="signal" className="w-full">Create account</Button>
          </form>
        </TabsContent>
      </Tabs>
      <p className="text-xs text-neutral-gray mt-6 text-center">Auth connects in the next phase.</p>
    </div>
  );
}
