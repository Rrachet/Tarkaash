import Image from "next/image";
import Link from "next/link";
import {
  Search, MapPin, ShieldCheck, Headset, HeartHandshake, Sparkles, MessageSquareText, ClipboardCheck, Store,
  ArrowRight, BadgeCheck, TrendingUp, Users, CheckCircle2,
} from "lucide-react";
import { getCategories, getFeaturedVendors, getPlatformStats } from "@/lib/data/public";
import { VendorCard } from "@/components/marketing/vendor-card";
import { CategoryIcon, CATEGORY_TINTS } from "@/components/ui/category-icon";
import { ButtonLink } from "@/components/ui/button";
import { SectionHeading, SampleBadgeInline } from "@/components/marketing/bits";
import { HOME_IMAGES, LOCALITIES } from "@/lib/content/site";
import { sizedImage } from "@/lib/format";
import { PointerGlow } from "@/components/motion/pointer-glow";
import { RotatingSearchInput } from "@/components/motion/rotating-input";
import { CountUp } from "@/components/motion/count-up";

const SEARCH_EXAMPLES = ["Cakes, tiffins, tuition, travel", "A birthday cake for Saturday", "Daily lunch tiffin in Kondapur", "Maths tutor for class 8", "A weekend trip to Coorg", "Bridal mehendi artist"];

export const revalidate = 300;

export default async function HomePage() {
  const [categories, vendors, stats] = await Promise.all([getCategories(), getFeaturedVendors(8), getPlatformStats()]);

  return (
    <>
      {/* ---------- Hero ---------- */}
      <PointerGlow as="section" className="relative overflow-hidden bg-teal-deep text-white">
        <div className="pattern-jaali absolute inset-0 opacity-30" aria-hidden />
        <div className="absolute -right-40 -top-40 size-[520px] animate-drift rounded-full bg-gold/12 blur-3xl" aria-hidden />
        <div className="absolute -bottom-48 -left-32 size-[460px] animate-drift rounded-full bg-teal-500/30 blur-3xl [animation-delay:-9s]" aria-hidden />
        <div className="container-page relative grid items-center gap-12 py-14 lg:grid-cols-[1.05fr_1fr] lg:py-20">
          <div className="hero-seq">
            <p className="eyebrow" style={{ "--d": "50ms" } as React.CSSProperties}>Your community · Hyderabad</p>
            <h1 className="mt-4 text-[2.6rem] font-semibold leading-[1.05] sm:text-6xl" style={{ "--d": "180ms" } as React.CSSProperties}>
              Good services.<br /><span className="text-shine">Closer to home.</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg text-white/80" style={{ "--d": "340ms" } as React.CSSProperties}>
              Discover trusted home bakers, tutors, home kitchens, travel planners and more — and let Tarkaash coordinate every enquiry for you.
            </p>

            <form action="/services" method="get" role="search" style={{ "--d": "480ms" } as React.CSSProperties}
              className="group/search mt-8 flex flex-col gap-2 rounded-2xl bg-white p-2 shadow-[var(--shadow-lift)] sm:flex-row sm:items-center sm:rounded-full ring-0 ring-gold/0 transition-[box-shadow] duration-500 focus-within:ring-4 focus-within:ring-gold/35">
              <label className="flex flex-1 items-center gap-3 px-4">
                <Search className="size-5 shrink-0 text-teal" aria-hidden />
                <RotatingSearchInput name="q" label="What service do you need?" examples={SEARCH_EXAMPLES}
                  className="h-12 w-full bg-transparent text-[15px] text-ink placeholder:text-slate/70 focus:outline-none" />
              </label>
              <label className="flex items-center gap-2 border-line px-4 sm:border-l">
                <MapPin className="size-5 shrink-0 text-gold-600" aria-hidden />
                <span className="sr-only">Locality</span>
                <select name="locality" defaultValue="" className="h-12 w-full bg-transparent text-[15px] text-ink focus:outline-none sm:w-40">
                  <option value="">All areas</option>
                  {LOCALITIES.map((l) => <option key={l}>{l}</option>)}
                </select>
              </label>
              <button className="btn-sheen h-12 rounded-full bg-gold px-7 font-semibold text-teal-deep transition hover:bg-gold-600 hover:text-white active:scale-95">Search</button>
            </form>

            <div className="mt-5 flex flex-wrap items-center gap-2 text-sm" style={{ "--d": "620ms" } as React.CSSProperties}>
              <span className="text-white/60">Popular:</span>
              {["Birthday cake", "Daily tiffin", "Maths tuition", "AC service", "Honeymoon package"].map((t) => (
                <Link key={t} href={`/services?q=${encodeURIComponent(t.split(" ").slice(-1)[0]!)}`}
                  className="rounded-full border border-white/20 px-3 py-1 text-white/85 transition duration-300 hover:-translate-y-0.5 hover:border-gold hover:bg-gold/10 hover:text-gold">{t}</Link>
              ))}
            </div>
          </div>

          <HeroMosaic />
        </div>
      </PointerGlow>

      {/* ---------- Locality marquee ---------- */}
      <div className="marquee overflow-hidden border-b border-line bg-white py-4" aria-label="Areas we serve">
        <div className="marquee-track gap-10 pr-10">
          {[0, 1].map((dup) => (
            <ul key={dup} className="flex shrink-0 items-center gap-10" aria-hidden={dup === 1 || undefined}>
              {LOCALITIES.map((l) => (
                <li key={l} className="flex items-center gap-10 whitespace-nowrap text-sm font-semibold uppercase tracking-[0.18em] text-slate">
                  <span className="inline-flex items-center gap-2"><MapPin className="size-4 text-gold" aria-hidden />{l}</span>
                  <span className="size-1.5 rounded-full bg-gold/60" aria-hidden />
                </li>
              ))}
            </ul>
          ))}
        </div>
      </div>

      {/* ---------- Categories ---------- */}
      <section className="container-page py-16 sm:py-20">
        <SectionHeading eyebrow="Explore services" title="Everything your home needs, from people nearby"
          action={<Link href="/services" className="text-sm font-semibold text-teal hover:underline">View all →</Link>} />
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-5 lg:grid-cols-9" data-stagger="zoom">
          {categories.map((c) => (
            <Link key={c.id} href={`/services?category=${c.slug}`}
              className="group card flex flex-col items-center gap-3 px-2 py-5 text-center transition duration-300 hover:-translate-y-1.5 hover:border-gold/50 hover:shadow-[var(--shadow-lift)]">
              <span className={`flex size-14 items-center justify-center rounded-2xl ${CATEGORY_TINTS[c.slug] ?? "bg-gold-pale text-teal"} transition duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:-rotate-6 group-hover:scale-115`}>
                <CategoryIcon icon={c.icon} className="size-6" />
              </span>
              <span className="text-sm font-semibold leading-tight text-ink">{c.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ---------- Recommended ---------- */}
      <section className="bg-cream-200/60 py-16 sm:py-20">
        <div className="container-page">
          <SectionHeading eyebrow="Recommended near you" title="Local providers people love"
            action={<ButtonLink href="/services" variant="outline" size="sm">See all providers</ButtonLink>}>
            Hand-picked independent businesses with profiles reviewed by Tarkaash.
          </SectionHeading>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4" data-stagger>
            {vendors.map((v, i) => <VendorCard key={v.id} v={v} priority={i < 4} />)}
          </div>
        </div>
      </section>

      {/* ---------- How it works ---------- */}
      <section className="container-page py-16 sm:py-24">
        <SectionHeading align="center" eyebrow="How Tarkaash works" title="One enquiry. One point of contact.">
          You tell us what you need — we coordinate with the right provider and stay with you until it&apos;s done.
        </SectionHeading>
        <div className="relative">
        <div data-reveal="line" className="absolute left-[16%] right-[16%] top-10 hidden h-px bg-gradient-to-r from-gold/0 via-gold to-gold/0 md:block" aria-hidden />
        <ol className="relative grid gap-6 md:grid-cols-3" data-stagger>
          {[
            { icon: Search, title: "Discover", body: "Browse local providers by need, category and area. See services, indicative prices and verified profile details." },
            { icon: MessageSquareText, title: "Enquire through Tarkaash", body: "Send one structured enquiry. Tarkaash receives it, checks availability and assigns the right provider." },
            { icon: ClipboardCheck, title: "Get it done", body: "Track progress with your reference ID. We follow up until the service is delivered and you're happy." },
          ].map((s, i) => (
            <li key={s.title} className="group card relative p-7 text-center transition duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-lift)]">
              <span className="relative mx-auto flex size-20 items-center justify-center rounded-full bg-teal-deep text-gold ring-8 ring-cream transition duration-500 group-hover:scale-105">
                <span className="absolute inset-0 rounded-full ring-2 ring-gold/50 opacity-0 transition duration-700 group-hover:scale-125 group-hover:opacity-100" aria-hidden />
                <s.icon className="size-8 transition-transform duration-500 group-hover:-rotate-6" aria-hidden />
                <span className="absolute -right-1 -top-1 flex size-7 items-center justify-center rounded-full bg-gold text-sm font-bold text-teal-deep">{i + 1}</span>
              </span>
              <h3 className="mt-5 text-xl font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate">{s.body}</p>
            </li>
          ))}
        </ol>
        </div>
      </section>

      {/* ---------- Why Tarkaash ---------- */}
      <section className="container-page grid items-center gap-10 pb-16 lg:grid-cols-2 lg:pb-24">
        <div className="relative" data-reveal="left">
          <div className="group relative aspect-[4/3.4] overflow-hidden rounded-[2rem] shadow-[var(--shadow-lift)]">
            <Image src={sizedImage(HOME_IMAGES.support, 1100, 900)!} alt="Freshly made treats from a local home baker" fill unoptimized className="object-cover transition-transform duration-[1.6s] ease-out group-hover:scale-105" sizes="(max-width:1024px) 100vw, 50vw" />
          </div>
          <div className="card absolute -bottom-6 right-4 max-w-[17rem] animate-float-slow p-5 sm:right-[-1.5rem]">
            <p className="font-display text-xl font-semibold leading-snug">A small step for you, <span className="text-gold-600">a big support for her.</span></p>
            <p className="mt-2 text-sm text-slate">Every enquiry through Tarkaash helps an independent business grow.</p>
          </div>
        </div>
        <div data-reveal="right">
          <p className="eyebrow">Why choose Tarkaash</p>
          <h2 className="mt-3 text-3xl font-semibold sm:text-4xl">Trust, support and value — built into every enquiry</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2" data-stagger>
            {[
              { icon: ShieldCheck, t: "Checked profiles", d: "Verification badges appear only after Tarkaash completes identity, area and quality checks." },
              { icon: Headset, t: "Better support", d: "A real team coordinates your request and helps if plans change." },
              { icon: HeartHandshake, t: "Supports local", d: "Your spend goes to independent entrepreneurs and home businesses." },
              { icon: Sparkles, t: "Clear enquiry trail", d: "Every request gets a reference ID and a traceable status — no lost messages." },
            ].map((f) => (
              <div key={f.t} className="group rounded-2xl border border-line bg-white p-5 transition duration-300 hover:-translate-y-1 hover:border-gold/40 hover:shadow-[var(--shadow-card)]">
                <span className="flex size-11 items-center justify-center rounded-xl bg-teal-deep text-gold transition duration-500 group-hover:rotate-[-8deg] group-hover:bg-gold group-hover:text-teal-deep"><f.icon className="size-5" aria-hidden /></span>
                <h3 className="mt-4 font-sans text-base font-semibold">{f.t}</h3>
                <p className="mt-1 text-sm leading-relaxed text-slate">{f.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Stats ---------- */}
      <section className="container-page">
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-3xl border border-line bg-line md:grid-cols-4" data-reveal="zoom">
          {[
            { v: <CountUp value={stats.vendors} />, l: "Local providers listed" },
            { v: <CountUp value={stats.categories} />, l: "Service categories" },
            { v: <CountUp value={stats.reviews} />, l: "Customer reviews" },
            { v: stats.avgRating ? <CountUp value={stats.avgRating} decimals={1} suffix=" ★" /> : "—", l: "Average rating" },
          ].map((s) => (
            <div key={s.l} className="bg-white px-6 py-7 text-center transition-colors duration-300 hover:bg-cream">
              <p className="font-display text-3xl font-semibold text-teal sm:text-4xl">{s.v}</p>
              <p className="mt-1 text-sm text-slate">{s.l}</p>
            </div>
          ))}
        </div>
        <p className="mt-3 text-center"><SampleBadgeInline /></p>
      </section>

      {/* ---------- Vendor CTA ---------- */}
      <section className="container-page mt-16 sm:mt-24">
        <PointerGlow className="overflow-hidden rounded-[2rem] bg-teal-deep px-6 py-12 text-white sm:px-12 lg:px-16">
          <div className="pattern-jaali absolute inset-0 opacity-30" aria-hidden />
          <div className="absolute -right-24 -bottom-24 size-80 animate-drift rounded-full bg-gold/15 blur-3xl" aria-hidden />
          <div className="relative grid items-center gap-10 lg:grid-cols-[1.2fr_1fr]">
            <div data-reveal>
              <p className="eyebrow">For providers</p>
              <h2 className="mt-3 text-3xl font-semibold sm:text-5xl">Grow your business <span className="text-gold">with Tarkaash</span></h2>
              <p className="mt-4 max-w-xl text-white/80">Be part of a trusted community that connects your skills with real people and real opportunities. We bring the enquiries — you focus on your craft.</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <ButtonLink href="/list-your-service" variant="gold" size="lg">List your service <ArrowRight className="size-4" /></ButtonLink>
                <ButtonLink href="/login?next=/vendor" variant="light" size="lg">Vendor login</ButtonLink>
              </div>
            </div>
            <ul className="grid gap-3" data-stagger="right">
              {[
                { icon: Users, t: "More customers", d: "Reach new and local customers through Tarkaash." },
                { icon: TrendingUp, t: "Higher visibility", d: "Get discovered on a platform built for local services." },
                { icon: BadgeCheck, t: "Secure & transparent", d: "Clear order records, payments and support." },
                { icon: Store, t: "Your own dashboard", d: "Track views, enquiries, orders and earnings." },
              ].map((b) => (
                <li key={b.t} className="group flex gap-4 rounded-2xl bg-white/5 p-4 ring-1 ring-white/10 transition duration-300 hover:translate-x-1 hover:bg-white/10 hover:ring-gold/40">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gold text-teal-deep transition duration-500 group-hover:scale-110"><b.icon className="size-5" aria-hidden /></span>
                  <div><p className="font-semibold">{b.t}</p><p className="text-sm text-white/70">{b.d}</p></div>
                </li>
              ))}
            </ul>
          </div>
        </PointerGlow>
      </section>
    </>
  );
}

function HeroMosaic() {
  const [a, b, c, dImg] = HOME_IMAGES.hero;
  const tile = "tile-in relative overflow-hidden rounded-3xl shadow-[var(--shadow-lift)] ring-1 ring-white/10";
  const img = "object-cover animate-kenburns";
  const d = (ms: number, depth: number) => ({ "--d": `${ms}ms`, "--depth": `${depth}px` }) as React.CSSProperties;
  return (
    <div className="relative hidden h-[480px] md:block" aria-hidden>
      <div className="grid h-full grid-cols-2 grid-rows-6 gap-4">
        <div className={`${tile} parallax row-span-4`} style={d(250, -8)}><Image src={sizedImage(a!, 700, 900)!} alt="" fill unoptimized className={img} sizes="25vw" priority /></div>
        <div className={`${tile} parallax row-span-3`} style={d(400, -14)}><Image src={sizedImage(b!, 700, 600)!} alt="" fill unoptimized className={`${img} [animation-delay:-6s]`} sizes="25vw" priority /></div>
        <div className={`${tile} parallax row-span-3`} style={d(550, -12)}><Image src={sizedImage(c!, 700, 600)!} alt="" fill unoptimized className={`${img} [animation-delay:-11s]`} sizes="25vw" /></div>
        <div className={`${tile} parallax row-span-2`} style={d(700, -6)}><Image src={sizedImage(dImg!, 700, 400)!} alt="" fill unoptimized className={`${img} [animation-delay:-3s]`} sizes="25vw" /></div>
      </div>
      <div className="parallax tile-in absolute -left-8 top-[58%]" style={d(950, 22)}>
      <div className="w-64 animate-float rounded-2xl bg-white p-4 text-ink shadow-[var(--shadow-lift)]">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate">Enquiry TK-2610-4F21</p>
        <p className="mt-1 font-semibold">Custom birthday cake</p>
        <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-mint px-2.5 py-1 text-xs font-semibold text-success">
          <CheckCircle2 className="size-3.5" /> Accepted by Meera&apos;s Home Baking
        </p>
      </div>
      </div>
      <div className="parallax tile-in absolute -right-3 top-6" style={d(1100, 28)}>
        <div className="flex animate-float-slow items-center gap-2 rounded-full bg-white px-3.5 py-2 text-sm font-semibold text-teal shadow-[var(--shadow-lift)] [animation-delay:-2s]">
          <span className="relative flex size-2.5"><span className="absolute inline-flex size-full animate-ping rounded-full bg-success/60" /><span className="relative inline-flex size-2.5 rounded-full bg-success" /></span>
          <BadgeCheck className="size-4" /> Profile details checked
        </div>
      </div>
    </div>
  );
}
