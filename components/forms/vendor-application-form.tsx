"use client";

import { useState, useTransition } from "react";
import { CheckCircle2 } from "lucide-react";
import { applyAsVendor } from "@/lib/actions/vendor";
import { Field, Input, Select, Textarea, FormMessage } from "@/components/ui/field";
import { Button, ButtonLink } from "@/components/ui/button";
import { LOCALITIES } from "@/lib/content/site";

export function VendorApplicationForm({ categories }: { categories: { id: string; name: string }[] }) {
  const [fe, setFe] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [pending, start] = useTransition();
  if (done) return (
    <div className="mt-6 rounded-2xl bg-mint p-6 text-center" role="status">
      <CheckCircle2 className="mx-auto size-10 text-success" />
      <p className="mt-3 text-lg font-semibold">Application received</p>
      <p className="mt-1 text-sm">Reference <strong className="font-mono">{done}</strong>. Our onboarding team will review it shortly.</p>
      <ButtonLink href="/vendor" className="mt-4">Open vendor portal</ButtonLink>
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
          tagline: g("tagline"), description: g("description"), serviceArea: g("serviceArea"), phone: g("phone") });
        if (r.ok) setDone(r.data.refCode); else { setError(r.error); setFe(r.fieldErrors ?? {}); }
      });
    }}>
      {error && <FormMessage>{error}</FormMessage>}
      <Field label="Business name" name="businessName" required error={fe.businessName}><Input name="businessName" error={fe.businessName} placeholder="e.g. Meera's Home Baking" /></Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Category" name="categoryId" required error={fe.categoryId}>
          <Select name="categoryId" defaultValue="" error={fe.categoryId}><option value="" disabled>Select</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select>
        </Field>
        <Field label="Locality" name="locality" required error={fe.locality}>
          <Select name="locality" defaultValue="" error={fe.locality}><option value="" disabled>Select</option>{LOCALITIES.map((l) => <option key={l}>{l}</option>)}<option>Other</option></Select>
        </Field>
      </div>
      <Field label="Tagline" name="tagline" hint="One line customers will see, e.g. Homemade Cakes | Cookies | Snacks"><Input name="tagline" /></Field>
      <Field label="About your business" name="description"><Textarea name="description" placeholder="What you offer, experience, what makes you special…" /></Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Areas you serve" name="serviceArea" hint="Comma separated"><Input name="serviceArea" placeholder="Kondapur, Gachibowli" /></Field>
        <Field label="Business phone" name="phone" error={fe.phone}><Input name="phone" type="tel" error={fe.phone} /></Field>
      </div>
      <Button type="submit" size="lg" variant="gold" loading={pending} className="w-full">Submit application</Button>
    </form>
  );
}
