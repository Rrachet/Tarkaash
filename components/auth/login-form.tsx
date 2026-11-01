"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Eye, EyeOff, HelpCircle, Lock, Mail, UserRound } from "lucide-react";
import { signIn, sendSignInCode, verifySignInCode } from "@/lib/actions/auth";
import { Field, Input, FormMessage } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { GoogleButton } from "@/components/auth/google-button";

const iconInput = "pl-11";

export function LoginForm({ next, linkError, notice }: { next?: string; linkError?: boolean; notice?: string }) {
  const [mode, setMode] = useState<"password" | "code">("password");
  const [codeSent, setCodeSent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(linkError ? "That link has expired or was already used. Please sign in again." : notice ?? null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [pending, start] = useTransition();
  const router = useRouter();

  const go = (to: string) => { router.push(to); router.refresh(); };

  const submitPassword = () => {
    setError(null); setFieldErrors({});
    start(async () => {
      const r = await signIn({ email, password, next });
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

  const switchMode = (m: "password" | "code") => { setMode(m); setCodeSent(false); setError(null); setFieldErrors({}); };

  const emailField = (
    <Field label="Email ID" name="email" required error={fieldErrors.email}>
      <div className="relative">
        <Mail className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate" aria-hidden />
        <Input name="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)}
          error={fieldErrors.email} placeholder="Enter your email address" className={cn(iconInput, "h-12")} />
      </div>
    </Field>
  );

  return (
    <div>
      <div className="text-center">
        <h1 className="font-display text-4xl font-semibold text-teal-deep sm:text-[2.6rem]">Vendor Login</h1>
        <p className="mx-auto mt-2 max-w-sm text-slate">Sign in to manage your services, orders, customers and business growth on Tarkkash.</p>
        <p className="mt-1 text-xs text-slate/80">Customers and the Tarkkash team sign in here too.</p>
      </div>

      <div className="mt-7 space-y-4">
        {error && <FormMessage>{error}</FormMessage>}

        {mode === "password" ? (
          <form onSubmit={(e) => { e.preventDefault(); submitPassword(); }} className="space-y-4" noValidate>
            {emailField}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-sm font-semibold text-ink">Password <span className="text-danger" aria-hidden>*</span></label>
                <Link href="/reset-password" className="text-sm font-semibold text-teal hover:underline">Forgot password?</Link>
              </div>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate" aria-hidden />
                <Input name="password" type={showPassword ? "text" : "password"} autoComplete="current-password" value={password}
                  onChange={(e) => setPassword(e.target.value)} error={fieldErrors.password} placeholder="Enter your password" className={cn(iconInput, "h-12 pr-12")} />
                <button type="button" onClick={() => setShowPassword((s) => !s)} aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-2 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-lg text-slate hover:bg-cream hover:text-teal">
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {fieldErrors.password && <p id="password-error" role="alert" className="text-xs font-medium text-danger">{fieldErrors.password}</p>}
            </div>
            <Button type="submit" size="lg" loading={pending} className="h-12 w-full rounded-xl bg-teal-deep">Log in to your account <ArrowRight className="size-4" /></Button>
          </form>
        ) : !codeSent ? (
          <form onSubmit={(e) => { e.preventDefault(); sendCode(); }} className="space-y-4" noValidate>
            {emailField}
            <p className="text-xs text-slate">We&apos;ll email you a one-time code. No password needed.</p>
            <Button type="submit" size="lg" loading={pending} className="h-12 w-full rounded-xl bg-teal-deep">Send code <ArrowRight className="size-4" /></Button>
          </form>
        ) : (
          <form onSubmit={(e) => { e.preventDefault(); verify(String(new FormData(e.currentTarget).get("code") ?? "")); }} className="space-y-4" noValidate>
            <FormMessage tone="success">If an account exists for {email}, a code is on its way. Check spam if it doesn&apos;t arrive.</FormMessage>
            <Field label="One-time code" name="code" error={fieldErrors.code}>
              <Input name="code" inputMode="numeric" autoComplete="one-time-code" maxLength={8} className="h-12 text-center font-mono text-xl tracking-[0.4em]" error={fieldErrors.code} />
            </Field>
            <Button type="submit" size="lg" loading={pending} className="h-12 w-full rounded-xl bg-teal-deep">Verify &amp; sign in</Button>
            <button type="button" onClick={() => setCodeSent(false)} className="w-full text-sm font-semibold text-teal hover:underline">Use a different email</button>
          </form>
        )}

        <div className="flex items-center gap-4 py-1 text-xs font-medium uppercase tracking-widest text-slate" aria-hidden>
          <span className="h-px flex-1 bg-line" /> or <span className="h-px flex-1 bg-line" />
        </div>
        <GoogleButton />
        <button type="button" onClick={() => switchMode(mode === "password" ? "code" : "password")}
          className="flex w-full items-center justify-center gap-2 text-sm font-semibold text-teal hover:underline">
          {mode === "password" ? <><Mail className="size-4" /> Email me a one-time code instead</> : <><Lock className="size-4" /> Log in with password instead</>}
        </button>
      </div>

      <div className="mt-8 text-center">
        <p className="text-sm text-ink">Don&apos;t have a vendor account yet?</p>
        <Link href="/list-your-service" className="mt-3 inline-flex h-12 items-center gap-2 rounded-xl bg-gold-pale px-8 text-sm font-semibold text-teal-deep transition hover:bg-gold hover:text-teal-deep">
          Register as a Vendor <ArrowRight className="size-4" />
        </Link>
        <p className="mt-3 text-xs text-slate">
          New customer? <Link href={`/signup${next ? `?next=${encodeURIComponent(next)}` : ""}`} className="font-semibold text-teal hover:underline">Create an account</Link>
        </p>
      </div>

      <div className="mt-8 grid grid-cols-2 divide-x divide-line border-t border-line pt-6 text-sm">
        <Link href="/contact?topic=support" className="group flex items-center gap-3 pr-3">
          <HelpCircle className="size-7 shrink-0 text-teal-deep" aria-hidden />
          <span><span className="block font-semibold text-ink">Need help?</span><span className="block text-teal group-hover:underline">Contact support</span></span>
        </Link>
        <Link href="/services" className="group flex items-center gap-3 pl-4">
          <UserRound className="size-7 shrink-0 text-teal-deep" aria-hidden />
          <span><span className="block font-semibold text-ink">Not a vendor?</span><span className="block text-teal group-hover:underline">Explore services</span></span>
        </Link>
      </div>
    </div>
  );
}
