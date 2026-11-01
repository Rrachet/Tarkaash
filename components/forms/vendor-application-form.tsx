"use client";

import { useState, useTransition } from "react";
import { CheckCircle2 } from "lucide-react";
import { applyAsVendor } from "@/lib/actions/vendor";
import { Field, Input, Select, Textarea, FormMessage } from "@/components/ui/field";
import { Button, ButtonLink } from "@/components/ui/button";
import { LOCALITIES } from "@/lib/content/site";

type Props = {
  categories: { id: string; name: string }[];
  /** Pre-filled from the signed-in account (Google gives name and email). */
  defaults?: { fullName?: string | null; email?: string | null; phone?: string | null };
};

export function VendorApplicationForm({ categories, defaults }: Props) {
  const [fe, setFe] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [pending, start] = useTransition();
  if (done) return (
    <div className="mt-6 rounded-2xl bg-mint p-6 text-center" role="status">
      <CheckCircle2 className="mx-auto size-10 text-success" />
      <p className="mt-3 text-lg font-semibold">Application received</p>
      <p className="mt-1 text-sm">Reference <strong className="font-mono">{done}</strong>. We&apos;ve sent you a confirmation by email and WhatsApp, and our onboarding team will review it within 2 working days.</p>
      <ButtonLink href="/list-your-service" className="mt-4">See application status</ButtonLink>
    </div>
  );
  return (
    <form className="mt-6 space-y-4" noValidate onSubmit={(e) => {
      e.preventDefault();
      const fd = new FormData(e.currentTarget);
      const g = (k: string) => String(fd.get(k) ?? "");
      setFe({}); setError(null);
      start(async () => {
        const r = await applyAsVendor({ businessName: g("businessName"), categoryId: g("categoryId"), locality: g("locality"), city: "Hyderabad",
          tagline: g("tagline"), description: g("description"), serviceArea: g("serviceArea"), phone: g("phone"),
          fullName: g("fullName"), address: g("address") });
        if (r.ok) setDone(r.data.refCode); else { setError(r.error); setFe(r.fieldErrors ?? {}); }
      });
    }}>
      {error && <FormMessage>{error}</FormMessage>}

      <fieldset className="space-y-4">
        <legend className="text-xs font-bold uppercase tracking-widest text-gold-600">Your details</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Your name" name="fullName" required error={fe.fullName}>
            <Input name="fullName" autoComplete="name" defaultValue={defaults?.fullName ?? ""} error={fe.fullName} />
          </Field>
          <Field label="Email" name="email" hint="From your account">
            <Input name="email" type="email" value={defaults?.email ?? ""} readOnly className="bg-cream text-slate" />
          </Field>
        </div>
        <Field label="Mobile number (WhatsApp)" name="phone" required hint="We send enquiry alerts and updates on WhatsApp." error={fe.phone}>
          <Input name="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="98765 43210" defaultValue={defaults?.phone ?? ""} error={fe.phone} />
        </Field>
      </fieldset>

      <fieldset className="space-y-4 border-t border-line pt-5">
        <legend className="text-xs font-bold uppercase tracking-widest text-gold-600">Your business</legend>
        <Field label="Business name" name="businessName" required error={fe.businessName}><Input name="businessName" error={fe.businessName} placeholder="e.g. Meera's Home Baking" /></Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Category" name="categoryId" required error={fe.categoryId}>
            <Select name="categoryId" defaultValue="" error={fe.categoryId}><option value="" disabled>Select</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select>
          </Field>
          <Field label="Locality" name="locality" required error={fe.locality}>
            <Select name="locality" defaultValue="" error={fe.locality}><option value="" disabled>Select</option>{LOCALITIES.map((l) => <option key={l}>{l}</option>)}<option>Other</option></Select>
          </Field>
        </div>
        <Field label="Business address" name="address" required hint="Used for verification. Customers only see your locality." error={fe.address}>
          <Textarea name="address" rows={2} autoComplete="street-address" placeholder="Flat / house, street, area, Hyderabad, PIN" error={fe.address} />
        </Field>
        <Field label="Tagline" name="tagline" hint="One line customers will see, e.g. Homemade Cakes | Cookies | Snacks"><Input name="tagline" /></Field>
        <Field label="About your business" name="description"><Textarea name="description" placeholder="What you offer, experience, what makes you special…" /></Field>
        <Field label="Areas you serve" name="serviceArea" hint="Comma separated"><Input name="serviceArea" placeholder="Kondapur, Gachibowli" /></Field>
      </fieldset>
      <Button type="submit" size="lg" variant="gold" loading={pending} className="w-full">Submit application</Button>
    </form>
  );
}
