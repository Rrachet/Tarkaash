import Link from "next/link";
import { Search, MapPin, SlidersHorizontal, SearchX } from "lucide-react";
import type { Category, VendorCardData } from "@/lib/data/public";
import { VendorCard } from "@/components/marketing/vendor-card";
import { CategoryIcon } from "@/components/ui/category-icon";
import { EmptyState } from "@/components/ui/misc";
import { ButtonLink } from "@/components/ui/button";
import { TrackEvent } from "@/components/marketing/track-event";
import { LOCALITIES } from "@/lib/content/site";
import { cn } from "@/lib/cn";

export type ExploreParams = { q?: string; locality?: string; sort?: string };

/** Shared explore UI for /services and the /services/[category] landing pages. */
export function ExploreView({ categories, vendors, sp, active, heading, intro, crumbs }: {
  categories: Category[];
  vendors: VendorCardData[];
  sp: ExploreParams;
  active: Category | null;
  heading: string;
  intro: string;
  crumbs: { href?: string; label: string }[];
}) {
  const base = active ? `/services/${active.slug}` : "/services";
  const hasFilters = !!(sp.q || sp.locality);
  const withQs = (path: string, patch: Partial<ExploreParams> = {}) => {
    const p = new URLSearchParams();
    Object.entries({ q: sp.q, locality: sp.locality, sort: sp.sort, ...patch }).forEach(([k, v]) => v && p.set(k, v));
    const s = p.toString();
    return s ? `${path}?${s}` : path;
  };

  return (
    <>
      {(hasFilters || active) && (
        <TrackEvent type="search" source="explore" meta={{ q: sp.q ?? "", category: active?.slug ?? "", locality: sp.locality ?? "", results: vendors.length }} />
      )}
      <section className="bg-teal-deep text-white">
        <div className="hero-seq container-page py-10 sm:py-14">
          <nav aria-label="Breadcrumb" className="text-sm text-white/60">
            {crumbs.map((c, i) => (
              <span key={c.label}>
                {i > 0 && " / "}
                {c.href ? <Link href={c.href} className="hover:text-white">{c.label}</Link> : <span className="text-white/90">{c.label}</span>}
              </span>
            ))}
          </nav>
          <h1 style={{ "--d": "80ms" } as React.CSSProperties} className="mt-3 text-4xl font-semibold sm:text-5xl">{heading}</h1>
          <p style={{ "--d": "160ms" } as React.CSSProperties} className="mt-2 max-w-2xl text-white/75">{intro}</p>
          <form action={base} method="get" role="search" style={{ "--d": "240ms" } as React.CSSProperties} className="mt-7 grid gap-2 rounded-2xl bg-white p-2 text-ink shadow-[var(--shadow-lift)] md:grid-cols-[1fr_200px_200px_auto]">
            <label className="flex items-center gap-3 px-3">
              <Search className="size-5 text-teal" aria-hidden /><span className="sr-only">Keyword</span>
              <input name="q" defaultValue={sp.q} placeholder="Search cakes, tiffin, tuition…" className="h-11 w-full bg-transparent focus:outline-none" />
            </label>
            <label className="flex items-center gap-2 border-line px-3 md:border-l">
              <MapPin className="size-5 text-gold-600" aria-hidden /><span className="sr-only">Locality</span>
              <select name="locality" defaultValue={sp.locality ?? ""} className="h-11 w-full bg-transparent focus:outline-none">
                <option value="">All areas</option>
                {LOCALITIES.map((l) => <option key={l}>{l}</option>)}
              </select>
            </label>
            <label className="flex items-center gap-2 border-line px-3 md:border-l">
              <SlidersHorizontal className="size-5 text-slate" aria-hidden /><span className="sr-only">Sort</span>
              <select name="sort" defaultValue={sp.sort ?? ""} className="h-11 w-full bg-transparent focus:outline-none">
                <option value="">Recommended</option>
                <option value="rating">Top rated</option>
                <option value="price">Lowest price</option>
              </select>
            </label>
            <button className="btn-sheen h-11 rounded-xl bg-gold px-6 font-semibold text-teal-deep hover:bg-gold-600 hover:text-white md:rounded-full">Search</button>
          </form>
        </div>
      </section>

      <div className="sticky top-[76px] z-20 border-b border-line bg-cream/95 backdrop-blur">
        <nav aria-label="Categories" className="container-page flex gap-2 overflow-x-auto py-3 scrollbar-none">
          <Link href={withQs("/services")} className={chip(!active)}>All</Link>
          {categories.map((c) => (
            <Link key={c.id} href={withQs(`/services/${c.slug}`)} className={chip(active?.slug === c.slug)}>
              <CategoryIcon icon={c.icon} className="size-4" />{c.name}
            </Link>
          ))}
        </nav>
      </div>

      <section className="container-page py-10">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-slate" aria-live="polite">
            <strong className="text-ink">{vendors.length}</strong> {vendors.length === 1 ? "provider" : "providers"}
            {sp.q && <> matching “<strong className="text-ink">{sp.q}</strong>”</>}
            {sp.locality && <> in <strong className="text-ink">{sp.locality}</strong></>}
          </p>
          {hasFilters && <Link href={base} className="text-sm font-semibold text-teal hover:underline">Clear filters</Link>}
        </div>

        {vendors.length ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" data-stagger>
            {vendors.map((v, i) => <VendorCard key={v.id} v={v} priority={i < 4} />)}
          </div>
        ) : (
          <EmptyState icon={<SearchX className="size-6" />} title="No providers match yet"
            action={<div className="flex flex-wrap justify-center gap-2">
              <ButtonLink href="/services" variant="outline" size="sm">See all providers</ButtonLink>
              <ButtonLink href={`/contact?topic=general&message=${encodeURIComponent(`I'm looking for: ${sp.q ?? active?.name ?? "a service"}${sp.locality ? ` in ${sp.locality}` : ""}`)}`} size="sm">Ask Tarkkash to find one</ButtonLink>
            </div>}>
            Try a broader keyword, another area, or one of these:{" "}
            {["cake", "tiffin", "tuition", "cleaning", "makeup"].map((s, i) => (
              <span key={s}>{i > 0 && ", "}<Link href={`/services?q=${s}`} className="font-semibold text-teal hover:underline">{s}</Link></span>
            ))}. Tell us what you need and we&apos;ll find a provider for you.
          </EmptyState>
        )}
      </section>
    </>
  );
}

function chip(active: boolean) {
  return cn("inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-full border px-4 text-sm font-semibold transition",
    active ? "border-teal bg-teal text-white shadow-[0_8px_20px_-10px_rgb(0_75_75/0.8)]" : "border-line bg-white text-ink hover:-translate-y-0.5 hover:border-teal/40");
}
