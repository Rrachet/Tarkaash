import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPin } from "lucide-react";
import { getCategories, searchVendors } from "@/lib/data/public";
import { VendorCard } from "@/components/marketing/vendor-card";
import { FaqSection } from "@/components/marketing/faq";
import { PageHero } from "@/components/marketing/page-hero";
import { CategoryIcon } from "@/components/ui/category-icon";
import { EmptyState, SectionHeading } from "@/components/ui/misc";
import { ButtonLink } from "@/components/ui/button";
import { JsonLd } from "@/components/seo/json-ld";
import { NEARBY, localityBySlug, localitySlug } from "@/lib/content/seo";
import { HOME_IMAGES } from "@/lib/content/site";
import { breadcrumbLd, itemListLd, pageMeta } from "@/lib/seo";

type Params = Promise<{ locality: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const loc = localityBySlug((await params).locality);
  if (!loc) return { title: "Area not found" };
  return pageMeta({
    title: `Local Services in ${loc.name}, Hyderabad | Home Bakers, Tiffins, Tutors`,
    description: `Find trusted local services in ${loc.name}, Hyderabad: home bakers, tiffin services, home tutors, beauticians, cleaning and repairs near you. Send one enquiry through Tarkaash.`,
    path: `/hyderabad/${loc.slug}`,
    keywords: [`services in ${loc.name}`, `home bakers ${loc.name}`, `tiffin service ${loc.name}`, `tutors in ${loc.name}`, `${loc.name} Hyderabad services near me`],
  });
}

export default async function LocalityPage({ params }: { params: Params }) {
  const loc = localityBySlug((await params).locality);
  if (!loc) notFound();
  const [vendors, categories] = await Promise.all([searchVendors({ locality: loc.name }), getCategories()]);
  const present = categories.filter((c) => vendors.some((v) => v.category?.slug === c.slug));
  const nearby = (NEARBY[loc.name] ?? []).map((n) => ({ name: n, slug: localitySlug(n) }));
  const faqs = [
    { q: `What local services are available in ${loc.name}?`, a: present.length
      ? `Tarkaash lists ${vendors.length} local ${vendors.length === 1 ? "provider" : "providers"} serving ${loc.name}, covering ${present.map((c) => c.name.toLowerCase()).join(", ")}.`
      : `Tarkaash is adding providers in ${loc.name}. Send an enquiry and the team will find a provider from a nearby area.` },
    { q: `How do I book a service in ${loc.name}?`, a: "Open a provider's profile, choose a service and send one enquiry with your date and requirements. Tarkaash confirms the details and coordinates with the provider." },
    { q: `Is there a fee to use Tarkaash in ${loc.name}?`, a: "Browsing and enquiring is free. You pay the provider's price. An optional Tarkaash Assist add on is shown before you send an enquiry." },
  ];

  return (
    <>
      <JsonLd data={[
        breadcrumbLd([{ name: "Home", path: "/" }, { name: "Hyderabad", path: "/services" }, { name: loc.name, path: `/hyderabad/${loc.slug}` }]),
        itemListLd(`Local services in ${loc.name}, Hyderabad`, vendors),
      ]} />
      <PageHero eyebrow={`Hyderabad · ${loc.name}`} title={<>Local services in {loc.name}, Hyderabad</>} image={HOME_IMAGES.hero[0]}>
        Trusted home bakers, home kitchens, tutors, beauty professionals and repair experts who serve {loc.name}. One enquiry, coordinated by Tarkaash.
      </PageHero>

      {present.length > 0 && (
        <section className="container-page pt-12">
          <ul className="flex flex-wrap gap-2" data-stagger="zoom">
            {present.map((c) => (
              <li key={c.slug}>
                <Link href={`/services/${c.slug}?locality=${encodeURIComponent(loc.name)}`}
                  className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-4 py-2 text-sm font-semibold transition hover:-translate-y-0.5 hover:border-gold/60">
                  <CategoryIcon icon={c.icon} className="size-4 text-gold-600" />{c.name} in {loc.name}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="container-page py-12">
        <SectionHeading eyebrow={`Serving ${loc.name}`} title={`Providers near ${loc.name}`} />
        {vendors.length ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" data-stagger>
            {vendors.map((v) => <VendorCard key={v.id} v={v} />)}
          </div>
        ) : (
          <EmptyState icon={<MapPin className="size-6" />} title={`We're adding providers in ${loc.name}`}
            action={<ButtonLink href={`/contact?topic=general&message=${encodeURIComponent(`I'm looking for a service in ${loc.name}`)}`} size="sm">Ask Tarkaash to find one</ButtonLink>}>
            Tell us what you need and we&apos;ll coordinate a provider from a nearby area.
          </EmptyState>
        )}
      </section>

      {nearby.length > 0 && (
        <section className="container-page" data-reveal>
          <h2 className="font-sans text-base font-semibold">Nearby areas</h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {nearby.map((n) => (
              <li key={n.slug}><Link href={`/hyderabad/${n.slug}`} className="link-underline text-sm font-semibold text-teal">Services in {n.name}</Link></li>
            ))}
          </ul>
        </section>
      )}

      <FaqSection faqs={faqs} title={`Services in ${loc.name}: common questions`} />
    </>
  );
}
