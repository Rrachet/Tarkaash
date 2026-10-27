import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { CheckCircle2, CalendarDays, MapPin, Package, Store, Gift, LifeBuoy, ArrowRight, Lock, Clock, AlertCircle } from "lucide-react";
import { getViewer } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ENQUIRY_COOKIE, REF_PATTERN, readEnquirySummary } from "@/lib/enquiry-summary";
import { PRIVATE_ROBOTS } from "@/lib/seo";
import { ORDER_STATUS } from "@/lib/status";
import { formatDate, formatSchedule } from "@/lib/format";
import { ButtonLink } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CopyRef } from "@/components/enquiry/copy-ref";
import { cn } from "@/lib/cn";

export const metadata: Metadata = { title: "Enquiry received", robots: PRIVATE_ROBOTS };

type Params = Promise<{ ref: string }>;
type View = {
  ref: string;
  live: boolean;
  duplicate: boolean;
  vendor: { name: string; slug: string } | null;
  service: string | null;
  preferredDate: string | null;
  preferredTime: string | null;
  locality: string | null;
  assist: boolean;
  createdAt: string | null;
  enquiryStatus: string;
  order: { status: string; scheduled: string | null; vendor: { name: string; slug: string } | null } | null;
};

const STEPS = [
  { key: "received", title: "Received by Tarkkash", body: "Your request is safely with our team." },
  { key: "assigned", title: "Sent to the provider", body: "We check details and assign it to the right provider." },
  { key: "confirmed", title: "Confirmed", body: "The provider accepts and confirms price, date and details." },
  { key: "done", title: "Completed", body: "Service delivered. You can leave a review from your account." },
] as const;

function progress(v: View): number {
  const o = v.order?.status;
  if (v.enquiryStatus === "closed" || (o && ["completed", "payment_recorded", "submitted", "closed"].includes(o))) return 4;
  if (o && ["accepted", "in_progress"].includes(o)) return 3;
  if (v.order || ["assigned", "in_fulfilment"].includes(v.enquiryStatus)) return 2;
  return 1;
}

export default async function EnquiryConfirmation({ params }: { params: Params }) {
  const ref = decodeURIComponent((await params).ref).toUpperCase();
  if (!REF_PATTERN.test(ref)) notFound();

  const [viewer, jar] = await Promise.all([getViewer(), cookies()]);
  let view: View | null = null;

  // 1. Signed in: the customer's own enquiry, read through row level security (live status).
  if (viewer) {
    const supabase = await createClient();
    const { data: e } = await supabase.from("enquiries")
      .select("ref_code, status, preferred_date, preferred_time, locality, assist_opt_in, created_at, user_id, services(title), requested:vendors!enquiries_requested_vendor_id_fkey(name, slug), orders(status, scheduled_for, created_at, vendors(name, slug))")
      .eq("ref_code", ref).eq("user_id", viewer.id).maybeSingle();
    if (e) {
      const order = [...(e.orders ?? [])].sort((a, b) => b.created_at.localeCompare(a.created_at))[0];
      view = {
        ref, live: true, duplicate: false, vendor: e.requested ?? null, service: e.services?.title ?? null,
        preferredDate: e.preferred_date, preferredTime: e.preferred_time, locality: e.locality, assist: e.assist_opt_in,
        createdAt: e.created_at, enquiryStatus: e.status,
        order: order ? { status: order.status, scheduled: order.scheduled_for, vendor: order.vendors ?? null } : null,
      };
    }
  }
  // 2. Guest who just sent it from this browser: summary from the httpOnly cookie, no database read.
  if (!view) {
    const s = readEnquirySummary(jar.get(ENQUIRY_COOKIE)?.value);
    if (s && s.ref === ref) {
      view = {
        ref, live: false, duplicate: s.duplicate, vendor: s.vendor, service: s.service, preferredDate: s.preferredDate,
        preferredTime: s.preferredTime, locality: s.locality, assist: s.assist, createdAt: s.at, enquiryStatus: "new", order: null,
      };
    }
  }

  const step = view ? progress(view) : 1;
  const stopped = view?.enquiryStatus === "cancelled" || view?.enquiryStatus === "spam" || view?.order?.status === "cancelled";
  const helpHref = `/contact?topic=support&message=${encodeURIComponent(`Enquiry ${ref}: `)}#contact-form`;

  return (
    <>
      <section className="relative overflow-hidden bg-teal-deep text-white">
        <div className="pattern-jaali absolute inset-0 opacity-25" aria-hidden />
        <div className="absolute -right-32 -top-32 size-[420px] animate-drift rounded-full bg-gold/10 blur-3xl" aria-hidden />
        <div className="hero-seq container-page relative py-12 text-center sm:py-16">
          <span className="relative mx-auto flex size-20 items-center justify-center" style={{ "--d": "0ms" } as React.CSSProperties}>
            <span className="absolute inset-0 animate-ping rounded-full bg-gold/40 [animation-iteration-count:2]" aria-hidden />
            <span className="relative flex size-20 animate-pop items-center justify-center rounded-full bg-gold text-teal-deep"><CheckCircle2 className="size-10" /></span>
          </span>
          <h1 className="mt-6 text-4xl font-semibold sm:text-5xl" style={{ "--d": "120ms" } as React.CSSProperties}>
            {view?.live ? "Your enquiry" : "Enquiry sent to Tarkkash"}
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-white/80" style={{ "--d": "220ms" } as React.CSSProperties}>
            {view?.duplicate ? "We already had this enquiry, so we didn't create a second one. Here are its details."
              : view?.live ? "Here's where your request is right now."
              : "Thank you. Our team will coordinate with the provider and keep you updated."}
          </p>
        </div>
      </section>

      <div className="container-page -mt-8 grid gap-6 pb-16 lg:grid-cols-[1.2fr_1fr]">
        <div className="space-y-6">
          <section data-reveal className="card relative p-6 text-center sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate">Your reference ID</p>
            <p data-ref={ref} className="mt-2 font-mono text-3xl font-bold tracking-wider text-teal-deep sm:text-4xl">{ref}</p>
            <CopyRef value={ref} />
            <p className="mx-auto mt-3 max-w-sm text-xs text-slate">Keep this handy. Quote it whenever you contact Tarkkash about this request.</p>
          </section>

          {view ? (
            <section data-reveal className="card p-6">
              <h2 className="font-sans text-base font-semibold">What you asked for</h2>
              <dl className="mt-4 grid gap-4 sm:grid-cols-2">
                <Detail icon={Store} label="Provider" value={view.vendor
                  ? <Link href={`/vendors/${view.vendor.slug}`} className="font-semibold text-teal hover:underline">{view.vendor.name}</Link>
                  : "Tarkkash will match a provider"} />
                <Detail icon={Package} label="Service" value={view.service ?? "Custom request"} />
                <Detail icon={CalendarDays} label="Preferred date" value={view.preferredDate ? `${formatDate(view.preferredDate)}${view.preferredTime ? `, ${view.preferredTime}` : ""}` : "Flexible"} />
                <Detail icon={MapPin} label="Area" value={view.locality ?? "Not given"} />
                {view.assist && <Detail icon={Gift} label="Tarkkash Assist" value="Included" />}
                {view.createdAt && <Detail icon={Clock} label="Sent" value={formatDate(view.createdAt)} />}
              </dl>
              {view.order && (
                <div className="mt-5 flex flex-wrap items-center gap-2 rounded-xl bg-cream p-3 text-sm">
                  <span className="text-slate">Order status:</span>
                  <Badge tone={ORDER_STATUS[view.order.status]?.tone ?? "neutral"}>{ORDER_STATUS[view.order.status]?.label ?? view.order.status}</Badge>
                  {view.order.vendor && <span>with <strong>{view.order.vendor.name}</strong></span>}
                  {view.order.scheduled && <span className="text-slate">· {formatSchedule(view.order.scheduled)}</span>}
                </div>
              )}
            </section>
          ) : (
            <section data-reveal className="card flex items-start gap-4 p-6">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-gold-pale text-teal"><Lock className="size-5" /></span>
              <div>
                <h2 className="font-sans text-base font-semibold">Details are private</h2>
                <p className="mt-1 text-sm text-slate">For your privacy, enquiry details are shown only to the person who sent it. Sign in with the email you used to see details and live status.</p>
                <ButtonLink href={`/login?next=${encodeURIComponent(`/enquiry/${ref}`)}`} size="sm" className="mt-4">Sign in to view</ButtonLink>
              </div>
            </section>
          )}
        </div>

        <aside className="space-y-6">
          <section data-reveal="right" className="card p-6">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-sans text-base font-semibold">{view?.live ? "Progress" : "What happens next"}</h2>
              {view?.live && <Badge tone="teal">Live</Badge>}
            </div>
            {stopped ? (
              <p className="mt-4 flex gap-2 rounded-xl bg-danger-soft p-3 text-sm text-danger"><AlertCircle className="mt-0.5 size-4 shrink-0" />This enquiry was cancelled. If that&apos;s unexpected, contact us with your reference ID.</p>
            ) : (
              <ol className="mt-5">
                {STEPS.map((s, i) => {
                  const state = i + 1 < step ? "done" : i + 1 === step ? "current" : "todo";
                  return (
                    <li key={s.key} className="relative flex gap-4 pb-6 last:pb-0">
                      {i < STEPS.length - 1 && <span className={cn("absolute left-[15px] top-8 h-[calc(100%-2rem)] w-0.5", state === "done" ? "bg-teal" : "bg-line")} aria-hidden />}
                      <span className={cn("relative flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-bold",
                        state === "done" ? "bg-teal text-white" : state === "current" ? "bg-gold text-teal-deep ring-4 ring-gold/25" : "bg-cream-200 text-slate")}>
                        {state === "done" ? <CheckCircle2 className="size-4" /> : i + 1}
                      </span>
                      <div>
                        <p className={cn("font-semibold", state === "todo" && "text-slate")}>{s.title}</p>
                        <p className="text-sm text-slate">{s.body}</p>
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </section>

          <section data-reveal="right" className="card space-y-3 p-6">
            {viewer ? (
              <ButtonLink href="/account" className="w-full">Track all my enquiries <ArrowRight className="size-4" /></ButtonLink>
            ) : (
              <>
                <ButtonLink href={`/signup?next=${encodeURIComponent(`/enquiry/${ref}`)}`} className="w-full">Create an account to track it <ArrowRight className="size-4" /></ButtonLink>
                <p className="text-center text-xs text-slate">Sign up with the same email you entered and we&apos;ll link this enquiry to your account automatically.</p>
              </>
            )}
            <ButtonLink href="/services" variant="outline" className="w-full">Browse more providers</ButtonLink>
            <Link href={helpHref} className="flex items-center justify-center gap-1.5 pt-1 text-sm font-semibold text-teal hover:underline">
              <LifeBuoy className="size-4" />Need help with this enquiry?
            </Link>
          </section>
        </aside>
      </div>
    </>
  );
}

function Detail({ icon: Icon, label, value }: { icon: typeof Store; label: string; value: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-cream-200 text-gold-600"><Icon className="size-4" /></span>
      <div><dt className="text-xs font-semibold uppercase tracking-wider text-slate">{label}</dt><dd className="mt-0.5 text-sm">{value}</dd></div>
    </div>
  );
}
