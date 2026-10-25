"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { requestPasswordReset } from "@/lib/actions/auth";
import { Field, Input, FormMessage } from "@/components/ui/field";
import { Button } from "@/components/ui/button";

export default function ResetPasswordPage() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <div>
      <h1 className="text-4xl font-semibold">Reset your password</h1>
      <p className="mt-2 text-slate">Enter your email and we&apos;ll send you a secure link to choose a new password.</p>
      {sent ? (
        <div className="mt-8"><FormMessage tone="success">If an account exists for that email, a reset link is on its way.</FormMessage></div>
      ) : (
        <form className="mt-8 space-y-4" noValidate onSubmit={(e) => {
          e.preventDefault();
          const email = String(new FormData(e.currentTarget).get("email") ?? "");
          start(async () => { const r = await requestPasswordReset({ email }); if (r.ok) setSent(true); else setError(r.error); });
        }}>
          {error && <FormMessage>{error}</FormMessage>}
          <Field label="Email" name="email"><Input name="email" type="email" autoComplete="email" /></Field>
          <Button type="submit" size="lg" loading={pending} className="w-full">Send reset link</Button>
        </form>
      )}
      <p className="mt-6 text-center text-sm"><Link href="/login" className="font-semibold text-teal hover:underline">Back to sign in</Link></p>
    </div>
  );
}
