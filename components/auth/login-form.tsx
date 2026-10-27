"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { KeyRound, Mail, ArrowRight } from "lucide-react";
import { signIn, sendSignInCode, verifySignInCode } from "@/lib/actions/auth";
import { Field, Input, FormMessage } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

export function LoginForm({ next, linkError, notice }: { next?: string; linkError?: boolean; notice?: string }) {
  const [mode, setMode] = useState<"password" | "code">("password");
  const [codeSent, setCodeSent] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(linkError ? "That link has expired or was already used. Please sign in again." : notice ?? null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [pending, start] = useTransition();
  const router = useRouter();

  const go = (to: string) => { router.push(to); router.refresh(); };

  const submitPassword = (em = email, pw = password) => {
    setError(null); setFieldErrors({});
    start(async () => {
      const r = await signIn({ email: em, password: pw, next });
      if (r.ok) go(r.data.redirectTo);
      else { setError(r.error); setFieldErrors(r.fieldErrors ?? {}); }
    });
  };

  const sendCode = () => {
    setError(null);
    start(async () => {
      const r = await sendSignInCode({ email, next });
      if (r.ok) setCodeSent(true); else setError(r.error);
    });
  };

  const verify = (code: string) => {
    setError(null);
    start(async () => {
      const r = await verifySignInCode({ email, code, next });
      if (r.ok) go(r.data.redirectTo); else { setError(r.error); setFieldErrors(r.fieldErrors ?? {}); }
    });
  };

  return (
    <div>
      <h1 className="text-4xl font-semibold">Welcome back</h1>
      <p className="mt-2 text-slate">Sign in to manage your enquiries, orders and business on Tarkkash.</p>

      <div role="tablist" className="mt-8 grid grid-cols-2 rounded-full bg-cream-200 p-1">
        {(["password", "code"] as const).map((m) => (
          <button key={m} role="tab" aria-selected={mode === m} type="button" onClick={() => { setMode(m); setError(null); }}
            className={cn("flex h-10 items-center justify-center gap-2 rounded-full text-sm font-semibold transition", mode === m ? "bg-white text-teal shadow-sm" : "text-slate")}>
            {m === "password" ? <><KeyRound className="size-4" />Password</> : <><Mail className="size-4" />Email code</>}
          </button>
        ))}
      </div>

      <div className="mt-6 space-y-4">
        {error && <FormMessage>{error}</FormMessage>}
        {mode === "password" ? (
          <form onSubmit={(e) => { e.preventDefault(); submitPassword(); }} className="space-y-4" noValidate>
            <Field label="Email" name="email" error={fieldErrors.email}>
              <Input name="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} error={fieldErrors.email} placeholder="you@example.com" />
            </Field>
            <Field label="Password" name="password" error={fieldErrors.password}>
              <Input name="password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} error={fieldErrors.password} />
            </Field>
            <div className="flex justify-end"><Link href="/reset-password" className="text-sm font-semibold text-teal hover:underline">Forgot password?</Link></div>
            <Button type="submit" size="lg" loading={pending} className="w-full">Sign in <ArrowRight className="size-4" /></Button>
          </form>
        ) : !codeSent ? (
          <form onSubmit={(e) => { e.preventDefault(); sendCode(); }} className="space-y-4" noValidate>
            <Field label="Email" name="email" hint="We'll email you a one-time code.">
              <Input name="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
            </Field>
            <Button type="submit" size="lg" loading={pending} className="w-full">Send code</Button>
          </form>
        ) : (
          <form onSubmit={(e) => { e.preventDefault(); verify(String(new FormData(e.currentTarget).get("code") ?? "")); }} className="space-y-4" noValidate>
            <FormMessage tone="success">If an account exists for {email}, a code is on its way. Check spam if it doesn&apos;t arrive.</FormMessage>
            <Field label="One-time code" name="code" error={fieldErrors.code}>
              <Input name="code" inputMode="numeric" autoComplete="one-time-code" maxLength={8} className="text-center font-mono text-xl tracking-[0.4em]" error={fieldErrors.code} />
            </Field>
            <Button type="submit" size="lg" loading={pending} className="w-full">Verify &amp; sign in</Button>
            <button type="button" onClick={() => setCodeSent(false)} className="w-full text-sm font-semibold text-teal hover:underline">Use a different email</button>
          </form>
        )}
      </div>

      <p className="mt-8 text-center text-sm text-slate">
        New to Tarkkash? <Link href={`/signup${next ? `?next=${encodeURIComponent(next)}` : ""}`} className="font-semibold text-teal hover:underline">Create an account</Link>
        {" · "}<Link href="/list-your-service" className="font-semibold text-gold-600 hover:underline">Register as a vendor</Link>
      </p>

    </div>
  );
}
