import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { signIn, signUp, resendConfirmation } from "@/services/authService";
import { useAuth } from "@/context/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff } from "lucide-react";

function PasswordInput({
  value, onChange, autoComplete, minLength,
}: {
  value: string;
  onChange: (v: string) => void;
  autoComplete: string;
  minLength?: number;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative mt-2">
      <Input
        type={show ? "text" : "password"}
        required
        autoComplete={autoComplete}
        minLength={minLength}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pr-10"
      />
      <button
        type="button"
        tabIndex={-1}
        aria-label={show ? "Hide password" : "Show password"}
        onClick={() => setShow((s) => !s)}
        className="absolute inset-y-0 right-0 flex items-center px-3 text-neutral-gray hover:text-ink"
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

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
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [resending, setResending] = useState(false);

  async function handleResend() {
    if (!pendingEmail || resending) return;
    setResending(true);
    try {
      await resendConfirmation(pendingEmail);
      toast.success("Verification email sent again. Check your inbox.");
    } catch (err) {
      const raw = err instanceof Error ? err.message : "Couldn't resend the email.";
      const msg = /rate|too many|seconds/i.test(raw)
        ? "Please wait a moment before requesting another email."
        : raw;
      toast.error(msg);
    } finally {
      setResending(false);
    }
  }

  async function submit(kind: "in" | "up", e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      if (kind === "in") {
        await signIn(email, password);
        toast.success("Welcome back.");
        await refresh();
        nav({ to: (next as "/" | undefined) ?? "/browse" });
      } else {
        const res = await signUp(email, password, displayName || email.split("@")[0]);
        if (res.session) {
          toast.success("Account created.");
          await refresh();
          nav({ to: (next as "/" | undefined) ?? "/browse" });
        } else {
          toast.success("Account created. Check your email to verify your account.");
          setPendingEmail(email);
        }
      }
    } catch (err) {
      const raw = err instanceof Error ? err.message : "Something went wrong";
      const msg = /email not confirmed|not.*confirm/i.test(raw)
        ? "Your email has not been verified yet. Check your inbox and click the verification link."
        : raw;
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  }

  if (pendingEmail) {
    return (
      <div className="max-w-md mx-auto px-6 py-20">
        <span className="label-eyebrow">Account</span>
        <h1 className="font-display text-4xl mt-2 mb-4">Check your email</h1>
        <p className="text-ink-black/80">
          We sent a verification link to <strong>{pendingEmail}</strong>. Open the email and confirm your address before signing in.
        </p>
        <p className="text-sm text-neutral-gray mt-3">
          Can't find it? Check your spam or promotions folder.
        </p>
        <Button
          variant="signal"
          className="w-full mt-8"
          onClick={handleResend}
          disabled={resending}
        >
          {resending ? "Sending…" : "Resend verification email"}
        </Button>
        <Button
          variant="outline"
          className="w-full mt-3"
          onClick={() => {
            setPendingEmail(null);
            setPassword("");
          }}
        >
          Back to sign in
        </Button>
      </div>
    );
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
            <div><Label>Password</Label><PasswordInput value={password} onChange={setPassword} autoComplete="current-password" /></div>
            <Button type="submit" className="w-full" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</Button>
          </form>
        </TabsContent>
        <TabsContent value="up">
          <form className="space-y-4 mt-6" onSubmit={(e) => submit("up", e)}>
            <div><Label>Display name</Label><Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="mt-2" placeholder="How other Pickture users see you" /></div>
            <div><Label>Email</Label><Input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-2" /></div>
            <div><Label>Password</Label><PasswordInput value={password} onChange={setPassword} autoComplete="new-password" minLength={6} /></div>
            <Button type="submit" variant="signal" className="w-full" disabled={busy}>{busy ? "Creating…" : "Create account"}</Button>
          </form>
        </TabsContent>
      </Tabs>
      <p className="text-xs text-neutral-gray mt-6 text-center">By continuing you agree to Pickture's terms.</p>
    </div>
  );
}
