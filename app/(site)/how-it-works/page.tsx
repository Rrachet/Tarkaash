import type { Metadata } from "next";
import { Search, MessageSquareText, UserCheck, ClipboardCheck, Star, ShieldCheck, Store, Inbox, Wallet, BarChart3 } from "lucide-react";
import { PageHero } from "@/components/marketing/page-hero";
import { ButtonLink } from "@/components/ui/button";
import { HOME_IMAGES } from "@/lib/content/site";

export const metadata: Metadata = { title: "How it works" };

const CUSTOMER = [
  { i: Search, t: "Discover providers", d: "Search by need, category and locality. Profiles show services, indicative prices, lead times and checked details." },
  { i: MessageSquareText, t: "Enquire through Tarkaash", d: "Pick a service and tell us your date and requirements. You get a reference ID instantly." },
  { i: UserCheck, t: "We coordinate", d: "Tarkaash confirms details and assigns the enquiry to the provider (or a suitable alternative if they're unavailable)." },
  { i: ClipboardCheck, t: "Service delivered", d: "Your provider confirms price and schedule, delivers, and records the order with Tarkaash." },
  { i: Star, t: "Review & rebook", d: "Leave a verified review after completion and save providers you love." },
];
const VENDOR = [
  { i: Store, t: "List your business", d: "Create a profile with services, prices, photos and your service area. Tarkaash reviews it before going live." },
  { i: Inbox, t: "Receive coordinated enquiries", d: "Accept or decline assigned enquiries. Declined requests go back to Tarkaash for reassignment." },
  { i: Wallet, t: "Complete and record", d: "Track every order from acceptance to payment recorded and submission to Tarkaash." },
  { i: BarChart3, t: "Grow with insight", d: "See profile views, enquiries, conversion, followers and your most popular services." },
];

export default function HowItWorksPage() {
  return (
    <>
      <PageHero eyebrow="How Tarkaash works" title="One enquiry. One point of contact. Real local providers." image={HOME_IMAGES.hero[1]}>
        Tarkaash sits between customers and independent providers to keep every request clear, coordinated and traceable.
      </PageHero>
      <Flow title="For customers" steps={CUSTOMER} />
      <Flow title="For providers" steps={VENDOR} tone="gold" />
      <section className="container-page">
        <div className="card flex flex-col items-start gap-6 p-8 sm:flex-row sm:items-center">
          <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-teal-deep text-gold"><ShieldCheck className="size-7" /></span>
          <div className="flex-1">
            <h2 className="text-2xl font-semibold">Your contact details stay protected</h2>
            <p className="mt-1 text-slate">Customer phone numbers and emails are shared only with the provider who accepts the order — never published, never sold.</p>
          </div>
          <ButtonLink href="/services" size="lg">Explore services</ButtonLink>
        </div>
      </section>
    </>
  );
}

function Flow({ title, steps, tone = "teal" }: { title: string; steps: { i: React.ComponentType<{ className?: string }>; t: string; d: string }[]; tone?: "teal" | "gold" }) {
  return (
    <section className="container-page py-14">
      <h2 className="text-3xl font-semibold sm:text-4xl">{title}</h2>
      <ol className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {steps.map((s, i) => (
          <li key={s.t} className="card relative p-6">
            <span className="absolute right-5 top-4 font-display text-5xl font-semibold text-cream-200">{i + 1}</span>
            <span className={`relative flex size-12 items-center justify-center rounded-xl ${tone === "gold" ? "bg-gold text-teal-deep" : "bg-teal-deep text-gold"}`}><s.i className="size-6" /></span>
            <h3 className="relative mt-4 font-sans text-base font-semibold">{s.t}</h3>
            <p className="relative mt-1 text-sm leading-relaxed text-slate">{s.d}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
