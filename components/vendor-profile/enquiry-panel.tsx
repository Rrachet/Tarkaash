"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { Send, ShieldCheck, Gift, CheckCircle2, Copy, Info, PhoneOff, Route, ClipboardList } from "lucide-react";
import { submitEnquiry } from "@/lib/actions/public";
import type { PublicService } from "@/lib/data/public";
import { priceLabel, formatINR } from "@/lib/format";
import { getSessionId } from "@/lib/session";
import { Field, Input, Select, Textarea, Checkbox, FormMessage } from "@/components/ui/field";
import { Button, ButtonLink } from "@/components/ui/button";
import { LOCALITIES } from "@/lib/content/site";
import type { WorkspaceVendor } from "./workspace";
import { cn } from "@/lib/cn";

type Props = {
  vendor: WorkspaceVendor;
  services: PublicService[];
  selectedId?: string;
  onSelect: (id: string | undefined) => void;
  assist: { enabled: boolean; fee: number; label: string; approved: boolean };
  viewer: { name: string | null; email: string | null } | null;
};

type Errors = Record<string, string>;

function todayIST() {
  return new Date(Date.now() + 5.5 * 3600 * 1000).toISOString().slice(0, 10);
}

export function EnquiryPanel({ vendor, services, selectedId, onSelect, assist, viewer }: Props) {
  const [key, setKey] = useState(() => (typeof crypto !== "undefined" ? crypto.randomUUID() : String(Date.now())));
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [done, setDone] = useState<{ refCode: string; duplicate: boolean } | null>(null);
  const [pending, start] = useTransition();
  const [request, setRequest] = useState("");
  const [assistOn, setAssistOn] = useState(false);
  const selected = useMemo(() => services.find((s) => s.id === selectedId), [services, selectedId]);
  const cat = vendor.categorySlug;
  const successRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (done) successRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [done]);

  // Pre-fill the request with the chosen service so the customer only adds specifics.
  const [prefilledFor, setPrefilledFor] = useState<string | undefined>(undefined);
  if (selected && prefilledFor !== selected.id) {
    setPrefilledFor(selected.id);
    if (!request || request.startsWith("I'd like to enquire about")) setRequest(`I'd like to enquire about ${selected.title}. `);
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const get = (k: string) => (fd.get(k) as string | null)?.trim() || undefined;
    const details: Record<string, string | number> = {};
    for (const k of ["destination", "travellers", "nights", "quantity", "meal_preference", "fulfilment", "occasion", "dietary"]) {
      const v = get(`d_${k}`);
      if (v) details[k] = /^\d+$/.test(v) ? Number(v) : v;
    }
    setErrors({});
    setFormError(null);
    start(async () => {
      const res = await submitEnquiry({
        idempotencyKey: key,
        name: get("name") ?? "",
        phone: get("phone"),
        email: get("email"),
        request: request,
        vendorId: vendor.id,
        serviceId: selectedId,
        categoryId: vendor.categoryId ?? undefined,
        preferredDate: get("preferred_date"),
        preferredTime: get("preferred_time"),
        locality: get("locality"),
        details,
        assistOptIn: assistOn,
        consent: fd.get("consent") === "on" ? true : (false as unknown as true),
        source: window.innerWidth < 768 ? "mobile_web" : "web",
        sessionId: getSessionId(),
      });
      if (res.ok) {
        setDone(res.data);
      } else {
        setErrors(res.fieldErrors ?? {});
        setFormError(res.error);
      }
    });
  }

  if (done) {
    return (
      <div ref={successRef} className="card scroll-mt-24 overflow-hidden" role="status" aria-live="polite">
        <div className="bg-teal-deep px-6 py-8 text-center text-white">
          <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-gold text-teal-deep animate-fade-up"><CheckCircle2 className="size-8" /></span>
          <h2 className="mt-4 text-2xl font-semibold">Enquiry sent to Tarkaash</h2>
          <p className="mt-1 text-sm text-white/80">{done.duplicate ? "We already have this enquiry — here is its reference." : "Our team will coordinate with the provider and get back to you."}</p>
        </div>
        <div className="space-y-5 p-6">
          <div className="rounded-2xl border border-dashed border-gold bg-gold-pale/50 p-4 text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate">Your reference ID</p>
            <p className="mt-1 font-mono text-2xl font-bold tracking-wider text-teal-deep">{done.refCode}</p>
            <button type="button" onClick={() => navigator.clipboard?.writeText(done.refCode)} className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-teal hover:underline">
              <Copy className="size-3.5" /> Copy
            </button>
          </div>
          <ol className="space-y-3 text-sm">
            {[
              "Tarkaash reviews your request and confirms details.",
              `We assign it to ${vendor.name} (or a suitable alternative).`,
              "You get confirmation of price, date and next steps.",
            ].map((s, i) => (
              <li key={s} className="flex gap-3"><span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-teal text-xs font-bold text-white">{i + 1}</span>{s}</li>
            ))}
          </ol>
          {viewer ? (
            <ButtonLink href="/account" className="w-full">Track in my account</ButtonLink>
          ) : (
            <ButtonLink href="/signup?next=/account" className="w-full">Create an account to track it</ButtonLink>
          )}
          <button type="button" className="w-full text-sm font-semibold text-teal hover:underline"
            onClick={() => { setDone(null); setKey(crypto.randomUUID()); setRequest(""); onSelect(undefined); }}>
            Send another enquiry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <form onSubmit={onSubmit} noValidate className="card overflow-hidden">
        <div className="border-b border-line bg-gradient-to-br from-mint/70 to-white px-6 py-5">
          <h2 className="text-2xl font-semibold">Make your enquiry through Tarkaash</h2>
          <p className="mt-1 text-sm text-slate">Tell us what you need and we&apos;ll coordinate with {vendor.name.split(" ")[0]} for you.</p>
        </div>
        <div className="space-y-4 p-6">
          {formError && <FormMessage>{formError}</FormMessage>}

          <Field label="Service required" name="service">
            <Select name="service" value={selectedId ?? ""} onChange={(e) => onSelect(e.target.value || undefined)}>
              <option value="">Not sure yet / something custom</option>
              {services.map((s) => <option key={s.id} value={s.id}>{s.title} — {priceLabel(s)}</option>)}
            </Select>
          </Field>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            <Field label="Your name" name="name" required error={errors.name}>
              <Input name="name" autoComplete="name" defaultValue={viewer?.name ?? ""} error={errors.name} placeholder="Full name" />
            </Field>
            <Field label="Mobile number" name="phone" error={errors.phone}>
              <Input name="phone" type="tel" inputMode="tel" autoComplete="tel" error={errors.phone} placeholder="10-digit mobile" />
            </Field>
          </div>
          <Field label="Email" name="email" error={errors.email} hint="Add a phone number or email (or both).">
            <Input name="email" type="email" autoComplete="email" defaultValue={viewer?.email ?? ""} error={errors.email} placeholder="you@example.com" />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            <Field label={cat === "travel-tours" ? "Travel date" : "Preferred date"} name="preferred_date" error={errors.preferredDate}>
              <Input name="preferred_date" type="date" min={todayIST()} error={errors.preferredDate} />
            </Field>
            <Field label="Preferred time" name="preferred_time">
              <Select name="preferred_time" defaultValue="">
                <option value="">Any time</option>
                <option>Morning (9–12)</option><option>Afternoon (12–4)</option><option>Evening (4–8)</option><option>Flexible</option>
              </Select>
            </Field>
          </div>

          <CategoryFields cat={cat} />

          <Field label="Your locality" name="locality">
            <Select name="locality" defaultValue={vendor.locality ?? ""}>
              <option value="">Select locality</option>
              {LOCALITIES.map((l) => <option key={l}>{l}</option>)}
              <option>Other</option>
            </Select>
          </Field>

          <Field label="Order details / special requirements" name="request" required error={errors.request}>
            <Textarea name="request" value={request} onChange={(e) => setRequest(e.target.value)} maxLength={2000} error={errors.request}
              placeholder={cat === "food-baking" ? "Flavour, design, size, message on cake…" : cat === "travel-tours" ? "Destination ideas, budget, hotel preferences…" : "Tell us about your requirement…"} />
            <p className="text-right text-xs text-slate">{request.length}/2000</p>
          </Field>

          {assist.enabled && (
            <label className={cn("block cursor-pointer rounded-2xl border-2 p-4 transition", assistOn ? "border-gold bg-gold-pale/40" : "border-line bg-cream/60 hover:border-gold/50")}>
              <div className="flex items-start gap-3">
                <input type="checkbox" checked={assistOn} onChange={(e) => setAssistOn(e.target.checked)} className="mt-1 size-5 accent-teal" />
                <div className="flex-1">
                  <p className="flex flex-wrap items-center gap-2 font-semibold">
                    <Gift className="size-4 text-gold-600" />Add {assist.label}
                    <span className="rounded-full bg-teal-deep px-2 py-0.5 text-xs font-semibold text-gold">{formatINR(assist.fee)}</span>
                    <span className="text-xs font-normal text-slate">optional</span>
                  </p>
                  <p className="mt-1 text-sm text-slate">Priority coordination, order detail confirmation and follow-up support until resolution. Charged only if the order goes ahead; provider price is separate.</p>
                </div>
              </div>
            </label>
          )}

          <Checkbox name="consent" error={errors.consent}
            label={<>I agree that Tarkaash may contact me about this enquiry and share the details needed with the assigned provider. See our <Link href="/privacy" className="font-semibold text-teal underline" target="_blank">privacy notice</Link>.</>} />

          <Button type="submit" size="lg" loading={pending} className="w-full">
            {!pending && <Send className="size-4" />}{pending ? "Sending…" : "Send enquiry to Tarkaash"}
          </Button>
          <p className="flex items-start gap-2 rounded-xl bg-mint/60 p-3 text-xs text-teal-deep">
            <Info className="mt-0.5 size-4 shrink-0" />Your request goes to the Tarkaash team first. We&apos;ll coordinate with the listed provider and keep you updated.
          </p>
        </div>
      </form>

      <div className="card p-5">
        <h3 className="flex items-center gap-2 font-sans text-base font-semibold"><ShieldCheck className="size-5 text-teal" />Why enquire through Tarkaash?</h3>
        <ul className="mt-3 space-y-2.5 text-sm text-ink/85">
          <li className="flex gap-2.5"><Route className="mt-0.5 size-4 shrink-0 text-gold-600" />One point of contact — no need to chase multiple providers</li>
          <li className="flex gap-2.5"><ClipboardList className="mt-0.5 size-4 shrink-0 text-gold-600" />Clear enquiry trail with a reference ID</li>
          <li className="flex gap-2.5"><PhoneOff className="mt-0.5 size-4 shrink-0 text-gold-600" />Your number is shared only with the provider who takes your order</li>
          <li className="flex gap-2.5"><CheckCircle2 className="mt-0.5 size-4 shrink-0 text-gold-600" />Support if plans change</li>
        </ul>
      </div>
    </div>
  );
}

function CategoryFields({ cat }: { cat: string | null }) {
  if (cat === "travel-tours") {
    return (
      <div className="grid gap-4 rounded-2xl bg-cream/70 p-4 sm:grid-cols-3 lg:grid-cols-1">
        <Field label="Destination" name="d_destination"><Input name="d_destination" placeholder="e.g. Kerala" /></Field>
        <Field label="Travellers" name="d_travellers"><Input name="d_travellers" type="number" min={1} max={50} placeholder="2" /></Field>
        <Field label="Nights" name="d_nights"><Input name="d_nights" type="number" min={1} max={60} placeholder="5" /></Field>
      </div>
    );
  }
  if (cat === "home-kitchen") {
    return (
      <div className="grid gap-4 rounded-2xl bg-cream/70 p-4 sm:grid-cols-3 lg:grid-cols-1">
        <Field label="Quantity / meals" name="d_quantity"><Input name="d_quantity" type="number" min={1} max={500} placeholder="10" /></Field>
        <Field label="Meal preference" name="d_meal_preference">
          <Select name="d_meal_preference" defaultValue=""><option value="">Any</option><option>Veg</option><option>Non-veg</option><option>Jain</option><option>Mixed</option></Select>
        </Field>
        <Field label="Delivery or pickup" name="d_fulfilment">
          <Select name="d_fulfilment" defaultValue="delivery"><option value="delivery">Delivery</option><option value="pickup">Pickup</option></Select>
        </Field>
      </div>
    );
  }
  if (cat === "food-baking") {
    return (
      <div className="grid gap-4 rounded-2xl bg-cream/70 p-4 sm:grid-cols-3 lg:grid-cols-1">
        <Field label="Occasion" name="d_occasion">
          <Select name="d_occasion" defaultValue=""><option value="">Select</option><option>Birthday</option><option>Anniversary</option><option>Office party</option><option>Festival</option><option>Just because</option></Select>
        </Field>
        <Field label="Quantity / size" name="d_quantity"><Input name="d_quantity" placeholder="1 kg / 2 packs" /></Field>
        <Field label="Delivery or pickup" name="d_fulfilment">
          <Select name="d_fulfilment" defaultValue="delivery"><option value="delivery">Delivery</option><option value="pickup">Pickup</option></Select>
        </Field>
      </div>
    );
  }
  return null;
}
