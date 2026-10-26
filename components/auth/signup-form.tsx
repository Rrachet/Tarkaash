"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MailCheck } from "lucide-react";
import { signUp } from "@/lib/actions/auth";
import { Field, Input, Checkbox, FormMessage } from "@/components/ui/field";
import { Button } from "@/components/ui/button";

export function SignupForm({ next }: { next?: string }) {
  const [error, setError] = useState<string | null>(null);
  const [fe, setFe] = useState<Record<string, string>>({});
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();

  if (sentTo) {
    return (
      <div className="text-center">
        <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-mint text-success"><MailCheck className="size-8" /></span>
        <h1 className="mt-5 text-3xl font-semibold">Check your inbox</h1>
        <p className="mt-2 text-slate">We sent a confirmation link to <strong className="text-ink">{sentTo}</strong>. Click it to activate your account.</p>
        <Link href="/login" className="mt-6 inline-block font-semibold text-teal hover:underline">Back to sign in</Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-4xl font-semibold">Create your account</h1>
      <p className="mt-2 text-slate">Track your enquiries, save providers and get updates from businesses you follow.</p>
      <form className="mt-8 space-y-4" noValidate onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        if (fd.get("terms") !== "on") { setFe({ terms: "Please accept the terms to continue." }); return; }
        setError(null); setFe({});
        start(async () => {
          const r = await signUp({ name: String(fd.get("name") ?? ""), email: String(fd.get("email") ?? ""), password: String(fd.get("password") ?? ""), phone: String(fd.get("phone") ?? "") || undefined, next });
          if (!r.ok) { setError(r.error); setFe(r.fieldErrors ?? {}); return; }
          if (r.data.needsConfirmation) setSentTo(String(fd.get("email")));
          else { router.push(r.data.redirectTo); router.refresh(); }
        });
      }}>
        {error && <FormMessage>{error}</FormMessage>}
        <Field label="Full name" name="name" required error={fe.name}><Input name="name" autoComplete="name" error={fe.name} /></Field>
        <Field label="Email" name="email" required error={fe.email}><Input name="email" type="email" autoComplete="email" error={fe.email} /></Field>
        <Field label="Mobile (optional)" name="phone"><Input name="phone" type="tel" autoComplete="tel" /></Field>
        <Field label="Password" name="password" required error={fe.password} hint="At least 10 characters.">
          <Input name="password" type="password" autoComplete="new-password" error={fe.password} />
        </Field>
        <Checkbox name="terms" error={fe.terms} label={<>I agree to the <Link href="/terms" className="font-semibold text-teal underline">terms</Link> and <Link href="/privacy" className="font-semibold text-teal underline">privacy notice</Link>.</>} />
        <Button type="submit" size="lg" loading={pending} className="w-full">Create account</Button>
      </form>
      <p className="mt-6 text-center text-sm text-slate">Already have an account? <Link href="/login" className="font-semibold text-teal hover:underline">Sign in</Link></p>
    </div>
  );
}
