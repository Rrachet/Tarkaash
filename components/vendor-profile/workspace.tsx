"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Clock, Truck, ChevronRight, CheckCircle2, MessageCircleHeart, Sparkles, ShieldCheck, Leaf, Users, Utensils, Plane, Megaphone } from "lucide-react";
import type { PublicService } from "@/lib/data/public";
import { DELIVERY_LABELS, priceLabel, sizedImage, timeAgo } from "@/lib/format";
import { Tabs } from "@/components/ui/tabs";
import { RatingStars, EmptyState } from "@/components/ui/misc";
import { SampleBadge } from "@/components/ui/badge";
import { EnquiryPanel } from "./enquiry-panel";
import { cn } from "@/lib/cn";

export type WorkspaceVendor = {
  id: string; slug: string; name: string; description: string | null; categorySlug: string | null; categoryId: string | null;
  locality: string | null; serviceArea: string[]; highlights: string[]; keyTerms: string | null; yearsExperience: number | null;
  languages: string[]; verified: boolean;
};

type Props = {
  vendor: WorkspaceVendor;
  services: PublicService[];
  media: { id: string; url: string; caption: string | null }[];
  updates: { id: string; title: string; body: string | null; created_at: string }[];
  reviews: { id: string; author_name: string; rating: number; body: string | null; created_at: string; is_demo: boolean }[];
  rating: { avg: number; count: number; distribution: number[] } | null;
  assist: { enabled: boolean; fee: number; label: string; approved: boolean };
  viewer: { name: string | null; email: string | null } | null;
  initialServiceId?: string;
};

export function VendorWorkspace({ vendor, services, media, updates, reviews, rating, assist, viewer, initialServiceId }: Props) {
  const [selected, setSelected] = useState<string | undefined>(services.some((s) => s.id === initialServiceId) ? initialServiceId : undefined);
  const panelRef = useRef<HTMLDivElement>(null);

  const choose = (id: string) => {
    setSelected(id);
    if (window.innerWidth < 1024) panelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const tabs = [
    services.length > 0 && {
      id: "services", label: `Services (${services.length})`,
      content: (
        <div className="space-y-4" data-stagger>
          {services.map((s) => <ServiceRow key={s.id} s={s} selected={selected === s.id} onSelect={() => choose(s.id)} />)}
        </div>
      ),
    },
    {
      id: "about", label: "About",
      content: <About vendor={vendor} updates={updates} />,
    },
    reviews.length > 0 && rating && {
      id: "reviews", label: `Reviews (${rating.count})`,
      content: <Reviews reviews={reviews} rating={rating} />,
    },
    media.length > 0 && {
      id: "gallery", label: "Gallery",
      content: (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3" data-stagger="zoom">
          {media.map((m, i) => (
            <figure key={m.id} className={cn("group relative overflow-hidden rounded-2xl bg-cream-200", i === 0 && "col-span-2 row-span-2")}>
              <div className={cn("relative", i === 0 ? "aspect-square" : "aspect-[4/3]")}>
                <Image src={sizedImage(m.url, i === 0 ? 900 : 500, i === 0 ? 900 : 375)!} alt={m.caption ?? ""} fill unoptimized className="object-cover transition duration-[1.2s] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-110" sizes="33vw" />
              </div>
              {m.caption && <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-3 text-sm text-white">{m.caption}</figcaption>}
            </figure>
          ))}
        </div>
      ),
    },
  ].filter(Boolean) as { id: string; label: string; content: React.ReactNode }[];

  return (
    <div className="container-page grid gap-8 py-10 lg:grid-cols-[1fr_400px] lg:gap-10">
      <div id="reviews-anchor" className="min-w-0">
        <Tabs items={tabs} sticky />
        <SupportLocal name={vendor.name} />
      </div>
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white/95 p-3 backdrop-blur lg:hidden">
        <button type="button" onClick={() => panelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
          className="flex h-12 w-full items-center justify-center rounded-full bg-teal font-semibold text-white shadow-[var(--shadow-lift)]">
          Enquire through Tarkaash
        </button>
      </div>
      <aside ref={panelRef} className="scroll-mt-24 pb-20 lg:sticky lg:top-24 lg:self-start lg:pb-0">
        <EnquiryPanel vendor={vendor} services={services} selectedId={selected} onSelect={setSelected} assist={assist} viewer={viewer} />
      </aside>
    </div>
  );
}

function attributeChips(a: Record<string, unknown>): string[] {
  const out: string[] = [];
  const arr = (k: string) => (Array.isArray(a[k]) ? (a[k] as string[]) : []);
  arr("flavours").slice(0, 4).forEach((f) => out.push(f));
  if (a.eggless) out.push("Eggless available");
  arr("inclusions").forEach((i) => out.push(i));
  arr("destinations").slice(0, 4).forEach((d) => out.push(d));
  arr("meal_types").forEach((m) => out.push(m));
  if (typeof a.min_quantity === "number") out.push(`Min. ${a.min_quantity}`);
  if (typeof a.min_group === "number") out.push(`Groups of ${a.min_group}+`);
  if (typeof a.dietary_note === "string" && a.dietary_note) out.push(a.dietary_note);
  return out;
}

function ServiceRow({ s, selected, onSelect }: { s: PublicService; selected: boolean; onSelect: () => void }) {
  const chips = attributeChips(s.attributes ?? {});
  return (
    <article className={cn("group card flex flex-col gap-4 overflow-hidden p-3 transition duration-300 hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)] sm:flex-row sm:items-stretch", selected && "ring-2 ring-gold")}>
      <div className="relative aspect-[16/10] w-full shrink-0 overflow-hidden rounded-xl bg-cream-200 sm:aspect-auto sm:h-auto sm:w-44">
        {s.image_url ? (
          <Image src={sizedImage(s.image_url, 400, 300)!} alt={s.title} fill unoptimized className="object-cover transition-transform duration-[1.2s] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-110" sizes="180px" />
        ) : <div className="pattern-jaali h-full min-h-28 bg-teal-deep" />}
      </div>
      <div className="flex flex-1 flex-col gap-2 py-1 pr-1">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h3 className="font-display text-xl font-semibold">{s.title}</h3>
          <p className="font-semibold text-teal">{priceLabel(s)}</p>
        </div>
        {s.description && <p className="text-sm text-slate">{s.description}</p>}
        {chips.length > 0 && (
          <div className="flex flex-wrap gap-1.5">{chips.map((c) => <span key={c} className="rounded-full bg-cream-200 px-2.5 py-0.5 text-xs font-medium text-ink">{c}</span>)}</div>
        )}
        <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate">
            {s.lead_time && <span className="inline-flex items-center gap-1"><Clock className="size-3.5 text-gold-600" />{s.lead_time}</span>}
            {s.delivery_options.map((d) => <span key={d} className="inline-flex items-center gap-1"><Truck className="size-3.5 text-gold-600" />{DELIVERY_LABELS[d] ?? d}</span>)}
          </div>
          <button type="button" onClick={onSelect} aria-pressed={selected}
            className={cn("inline-flex h-10 items-center gap-1 rounded-full px-4 text-sm font-semibold transition",
              selected ? "bg-gold text-teal-deep" : "bg-teal text-white hover:bg-teal-600")}>
            {selected ? <><CheckCircle2 className="size-4" />Selected</> : <>Enquire<ChevronRight className="size-4" /></>}
          </button>
        </div>
        <p className="text-[11px] text-slate/80">Prices are indicative and confirmed by the provider through Tarkaash.</p>
      </div>
    </article>
  );
}

function About({ vendor, updates }: { vendor: WorkspaceVendor; updates: Props["updates"] }) {
  const icons = [Sparkles, Leaf, ShieldCheck, Users, Utensils, Plane];
  return (
    <div className="space-y-6">
      {vendor.description && <p className="text-[17px] leading-relaxed text-ink/90">{vendor.description}</p>}
      {vendor.highlights.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-3" data-stagger>
          {vendor.highlights.map((h, i) => {
            const Icon = icons[i % icons.length]!;
            return (
              <div key={h} className="flex items-center gap-3 rounded-2xl border border-line bg-white p-4">
                <span className="flex size-10 items-center justify-center rounded-xl bg-gold-pale text-teal"><Icon className="size-5" /></span>
                <span className="text-sm font-semibold">{h}</span>
              </div>
            );
          })}
        </div>
      )}
      <dl className="grid gap-4 rounded-2xl border border-line bg-white p-5 sm:grid-cols-2">
        {vendor.serviceArea.length > 0 && <Info label="Service area" value={vendor.serviceArea.join(" · ")} />}
        {vendor.yearsExperience ? <Info label="Experience" value={`${vendor.yearsExperience}+ years`} /> : null}
        {vendor.languages.length > 0 && <Info label="Languages" value={vendor.languages.join(", ")} />}
        {vendor.keyTerms && <Info label="Key terms" value={vendor.keyTerms} />}
      </dl>
      {updates.length > 0 && (
        <div>
          <h3 className="flex items-center gap-2 text-xl font-semibold"><Megaphone className="size-5 text-gold-600" />Latest updates</h3>
          <ul className="mt-3 space-y-3">
            {updates.map((u) => (
              <li key={u.id} className="rounded-2xl border border-line bg-white p-4">
                <p className="font-semibold">{u.title}</p>
                {u.body && <p className="mt-1 text-sm text-slate">{u.body}</p>}
                <p className="mt-2 text-xs text-slate">{timeAgo(u.created_at)}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return <div><dt className="text-xs font-semibold uppercase tracking-wider text-slate">{label}</dt><dd className="mt-1 text-sm">{value}</dd></div>;
}

function Reviews({ reviews, rating }: { reviews: Props["reviews"]; rating: NonNullable<Props["rating"]> }) {
  const [shown, setShown] = useState(6);
  if (!reviews.length) return <EmptyState title="No reviews yet" />;
  return (
    <div id="reviews" className="scroll-mt-28 space-y-6">
      <div className="grid gap-6 rounded-2xl border border-line bg-white p-6 sm:grid-cols-[180px_1fr]">
        <div className="text-center sm:border-r sm:border-line sm:pr-6">
          <p className="font-display text-5xl font-semibold">{rating.avg.toFixed(1)}</p>
          <RatingStars value={rating.avg} size={18} className="mt-1" />
          <p className="mt-1 text-sm text-slate">{rating.count} reviews</p>
        </div>
        <div className="space-y-1.5">
          {rating.distribution.map((n, i) => (
            <div key={i} className="flex items-center gap-3 text-sm">
              <span className="w-8 text-slate">{5 - i} ★</span>
              <span className="h-2 flex-1 overflow-hidden rounded-full bg-cream-200"><span data-reveal="line" className="block h-full rounded-full bg-teal" style={{ width: `${(n / rating.count) * 100}%` }} /></span>
              <span className="w-10 text-right text-slate">{Math.round((n / rating.count) * 100)}%</span>
            </div>
          ))}
        </div>
      </div>
      <p className="text-xs text-slate">Only customers with a completed Tarkaash order can leave a review. Reviews are moderated.</p>
      <ul className="grid gap-4 sm:grid-cols-2" data-stagger>
        {reviews.slice(0, shown).map((r) => (
          <li key={r.id} className="rounded-2xl border border-line bg-white p-5 transition duration-300 hover:-translate-y-0.5 hover:shadow-[var(--shadow-card)]">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-full bg-gold-pale font-display font-semibold text-teal">{r.author_name[0]}</span>
                <div><p className="font-semibold">{r.author_name}</p><p className="text-xs text-slate">{timeAgo(r.created_at)}</p></div>
              </div>
              <RatingStars value={r.rating} />
            </div>
            {r.body && <p className="mt-3 text-sm leading-relaxed text-ink/90">{r.body}</p>}
            {r.is_demo && <SampleBadge className="mt-3" />}
          </li>
        ))}
      </ul>
      {shown < reviews.length && (
        <button type="button" onClick={() => setShown((s) => s + 6)} className="mx-auto block rounded-full border border-line bg-white px-5 py-2.5 text-sm font-semibold hover:border-teal/40">
          Show more reviews
        </button>
      )}
    </div>
  );
}

function SupportLocal({ name }: { name: string }) {
  return (
    <div data-reveal className="mt-10 flex flex-col items-start gap-4 rounded-3xl bg-gold-pale/70 p-6 sm:flex-row sm:items-center">
      <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-teal-deep text-gold"><MessageCircleHeart className="size-7" /></span>
      <div>
        <p className="font-display text-xl font-semibold">A small step for you, a big support for {name.split(" ")[0]?.replace(/'s$/, "")}.</p>
        <p className="mt-1 text-sm text-ink/80">By choosing Tarkaash, you&apos;re not just getting a great service. You&apos;re helping local talent grow.</p>
      </div>
    </div>
  );
}
