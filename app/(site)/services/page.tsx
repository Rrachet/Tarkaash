import type { Metadata } from "next";
import Link from "next/link";
import { Search, MapPin, SlidersHorizontal, SearchX } from "lucide-react";
import { getCategories, searchVendors } from "@/lib/data/public";
import { VendorCard } from "@/components/marketing/vendor-card";
import { CategoryIcon } from "@/components/ui/category-icon";
import { EmptyState } from "@/components/ui/misc";
import { ButtonLink } from "@/components/ui/button";
import { TrackEvent } from "@/components/marketing/track-event";
import { LOCALITIES } from "@/lib/content/site";
import { cn } from "@/lib/cn";

export const metadata: Metadata = { title: "Explore services", description: "Find trusted local providers in Hyderabad." };

type SP = Promise<{ q?: string; category?: string; locality?: string; sort?: string }>;

export default async function ServicesPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const [categories, vendors] = await Promise.all([getCategories(), searchVendors(sp)]);
  const active = categories.find((c) => c.slug === sp.category);
  const hasFilters = !!(sp.q || sp.category || sp.locality);
  const qs = (patch: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    const merged = { q: sp.q, category: sp.category, locality: sp.locality, sort: sp.sort, ...patch };
    Object.entries(merged).forEach(([k, v]) => v && p.set(k, v));
    const s = p.toString();
    return s ? `/services?${s}` : "/services";
  };

  return (
    <>
      {hasFilters && <TrackEvent type="search" source="explore" meta={{ q: sp.q ?? "", category: sp.category ?? "", locality: sp.locality ?? "", results: vendors.length }} />}
      <section className="bg-teal-deep text-white">
        <div className="hero-seq container-page py-10 sm:py-14">
          <nav aria-label="Breadcrumb" className="text-sm text-white/60"><Link href="/" className="hover:text-white">Home</Link> / <span className="text-white/90">Explore services</span></nav>
          <h1 style={{ "--d": "80ms" } as React.CSSProperties} className="mt-3 text-4xl font-semibold sm:text-5xl">{active ? active.name : "Explore services"}</h1>
          <p style={{ "--d": "160ms" } as React.CSSProperties} className="mt-2 max-w-2xl text-white/75">{active?.description ?? "Independent providers across Hyderabad — every enquiry coordinated by Tarkaash."}</p>
          <form action="/services" method="get" role="search" style={{ "--d": "240ms" } as React.CSSProperties} className="mt-7 grid gap-2 rounded-2xl bg-white p-2 text-ink shadow-[var(--shadow-lift)] md:grid-cols-[1fr_200px_200px_auto]">
            {sp.category && <input type="hidden" name="category" value={sp.category} />}
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
        <div className="container-page flex gap-2 overflow-x-auto py-3 scrollbar-none">
          <Link href={qs({ category: undefined })} className={chip(!sp.category)}>All</Link>
          {categories.map((c) => (
            <Link key={c.id} href={qs({ category: c.slug })} className={chip(sp.category === c.slug)}>
              <CategoryIcon icon={c.icon} className="size-4" />{c.name}
            </Link>
          ))}
        </div>
      </div>

      <section className="container-page py-10">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-slate" aria-live="polite">
            <strong className="text-ink">{vendors.length}</strong> {vendors.length === 1 ? "provider" : "providers"}
            {sp.q && <> matching “<strong className="text-ink">{sp.q}</strong>”</>}
            {sp.locality && <> in <strong className="text-ink">{sp.locality}</strong></>}
          </p>
          {hasFilters && <Link href="/services" className="text-sm font-semibold text-teal hover:underline">Clear filters</Link>}
        </div>

        {vendors.length ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" data-stagger>
            {vendors.map((v, i) => <VendorCard key={v.id} v={v} priority={i < 4} />)}
          </div>
        ) : (
          <EmptyState icon={<SearchX className="size-6" />} title="No providers match yet"
            action={<div className="flex flex-wrap justify-center gap-2">
              <ButtonLink href="/services" variant="outline" size="sm">See all providers</ButtonLink>
              <ButtonLink href={`/contact?topic=general&message=${encodeURIComponent(`I'm looking for: ${sp.q ?? active?.name ?? "a service"}${sp.locality ? ` in ${sp.locality}` : ""}`)}`} size="sm">Ask Tarkaash to find one</ButtonLink>
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
