import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPin } from "lucide-react";
import { getCategories, searchVendors } from "@/lib/data/public";
import { ExploreView } from "@/components/marketing/explore-view";
import { FaqSection } from "@/components/marketing/faq";
import { JsonLd } from "@/components/seo/json-ld";
import { CATEGORY_SEO, LOCALITY_PAGES } from "@/lib/content/seo";
import { abs, breadcrumbLd, itemListLd, pageMeta } from "@/lib/seo";

type Params = Promise<{ category: string }>;
type SP = Promise<{ q?: string; locality?: string; sort?: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { category } = await params;
  const seo = CATEGORY_SEO[category];
  if (!seo) return { title: "Category not found" };
  return pageMeta({ title: seo.title, description: seo.description, path: `/services/${category}`, keywords: seo.keywords });
}

export default async function CategoryPage({ params, searchParams }: { params: Params; searchParams: SP }) {
  const { category } = await params;
  const sp = await searchParams;
  const seo = CATEGORY_SEO[category];
  const categories = await getCategories();
  const active = categories.find((c) => c.slug === category);
  if (!seo || !active) notFound();
  const vendors = await searchVendors({ ...sp, category });

  return (
    <>
      <JsonLd data={[
        { "@context": "https://schema.org", "@type": "CollectionPage", name: seo.h1, description: seo.description, url: abs(`/services/${category}`), about: active.name, isPartOf: { "@id": abs("/#website") } },
        breadcrumbLd([{ name: "Home", path: "/" }, { name: "Explore services", path: "/services" }, { name: active.name, path: `/services/${category}` }]),
        itemListLd(seo.h1, vendors),
      ]} />
      <ExploreView categories={categories} vendors={vendors} sp={sp} active={active} heading={seo.h1} intro={seo.description}
        crumbs={[{ href: "/", label: "Home" }, { href: "/services", label: "Explore" }, { label: active.name }]} />

      <section className="container-page grid gap-10 pb-4 lg:grid-cols-[1.4fr_1fr]">
        <div data-reveal>
          <h2 className="text-2xl font-semibold sm:text-3xl">Why book {seo.noun} through Tarkkash</h2>
          {seo.intro.map((p) => <p key={p.slice(0, 24)} className="mt-4 leading-relaxed text-ink/85">{p}</p>)}
        </div>
        <div data-reveal="right" className="card p-6">
          <h2 className="flex items-center gap-2 font-sans text-base font-semibold"><MapPin className="size-5 text-gold-600" />{active.name} by area in Hyderabad</h2>
          <ul className="mt-4 flex flex-wrap gap-2">
            {LOCALITY_PAGES.map((l) => (
              <li key={l.slug}>
                <Link href={`/services/${category}?locality=${encodeURIComponent(l.name)}`}
                  className="inline-flex rounded-full border border-line bg-cream px-3 py-1.5 text-sm text-ink transition hover:-translate-y-0.5 hover:border-gold/60 hover:text-teal">
                  {seo.noun.charAt(0).toUpperCase() + seo.noun.slice(1)} in {l.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <FaqSection faqs={seo.faqs} title={`${active.name} in Hyderabad: common questions`} />
    </>
  );
}
