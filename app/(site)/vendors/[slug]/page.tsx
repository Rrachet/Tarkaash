import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPin, Star, BadgeCheck, Clock, Languages } from "lucide-react";
import { getVendorBySlug, getPublicSettings, getViewerReactions } from "@/lib/data/public";
import { getViewer } from "@/lib/auth";
import { sizedImage } from "@/lib/format";
import { Avatar } from "@/components/ui/misc";
import { CategoryIcon } from "@/components/ui/category-icon";
import { TrackEvent } from "@/components/marketing/track-event";
import { VendorWorkspace } from "@/components/vendor-profile/workspace";
import { ReactionButtons } from "@/components/vendor-profile/reactions";
import { JsonLd } from "@/components/seo/json-ld";
import { CATEGORY_SEO } from "@/lib/content/seo";
import { breadcrumbLd, pageMeta, vendorLd } from "@/lib/seo";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const v = await getVendorBySlug(slug);
  if (!v) return { title: "Provider not found" };
  const seo = v.category ? CATEGORY_SEO[v.category.slug] : undefined;
  const role = seo?.noun ? seo.noun.replace(/s$/, "") : v.category?.name ?? "local provider";
  const area = v.locality ? `${v.locality}, ${v.city}` : v.city;
  const services = v.services.slice(0, 3).map((s) => s.title).join(", ");
  const roleTitle = role.charAt(0).toUpperCase() + role.slice(1);
  return pageMeta({
    title: `${v.name}: ${roleTitle} in ${area}`,
    description: `${v.name}${v.tagline ? `, ${v.tagline}` : ""}. ${services ? `${services} and more. ` : ""}Trusted ${role} in ${area}. Send an enquiry through Tarkkash.`.slice(0, 300),
    path: `/vendors/${v.slug}`,
    keywords: [`${v.name}`, `${role} in ${v.locality ?? v.city}`, ...(seo?.keywords.slice(0, 3) ?? [])],
    image: v.cover_url ? sizedImage(v.cover_url, 1200, 630)! : undefined,
  });
}

export default async function VendorPage({ params, searchParams }: { params: Params; searchParams: Promise<{ service?: string }> }) {
  const { slug } = await params;
  const { service } = await searchParams;
  const v = await getVendorBySlug(slug);
  if (!v || v.status !== "active") notFound();
  const [settings, reactions, viewer] = await Promise.all([getPublicSettings(), getViewerReactions(v.id), getViewer()]);
  const cover = sizedImage(v.cover_url, 1800, 700);

  return (
    <>
      <TrackEvent type="profile_view" vendorId={v.id} />
      <JsonLd data={[
        vendorLd(v),
        breadcrumbLd([
          { name: "Home", path: "/" },
          ...(v.category ? [{ name: v.category.name, path: `/services/${v.category.slug}` }] : [{ name: "Explore", path: "/services" }]),
          { name: v.name, path: `/vendors/${v.slug}` },
        ]),
      ]} />
      {/* ---------- Hero ---------- */}
      <section className="relative overflow-hidden bg-teal-deep text-white">
        {cover && <Image src={cover} alt="" fill priority unoptimized className="animate-kenburns object-cover opacity-45" sizes="100vw" />}
        <div className="absolute inset-0 bg-gradient-to-r from-teal-deep via-teal-deep/85 to-teal-deep/30" aria-hidden />
        <div className="hero-seq container-page relative py-8 sm:py-12">
          <nav aria-label="Breadcrumb" className="text-sm text-white/65">
            <Link href="/services" className="hover:text-white">Explore</Link>
            {v.category && <> / <Link href={`/services/${v.category.slug}`} className="hover:text-white">{v.category.name}</Link></>}
            {" / "}<span className="text-white/90">{v.name}</span>
          </nav>
          <div style={{ "--d": "120ms" } as React.CSSProperties} className="mt-6 flex flex-col gap-6 sm:flex-row sm:items-end">
            <Avatar src={v.avatar_url} name={v.name} size={128} className="animate-pop ring-4 ring-gold shadow-[var(--shadow-lift)] [animation-delay:250ms]" />
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                {v.category && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold ring-1 ring-white/20">
                    <CategoryIcon icon={v.category.icon} className="size-3.5 text-gold" />{v.category.name}
                  </span>
                )}
              </div>
              <h1 className="mt-3 text-4xl font-semibold leading-tight sm:text-5xl">{v.name}</h1>
              {v.tagline && <p className="mt-1 text-lg text-white/85">{v.tagline}</p>}
              <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-white/85">
                {v.locality && <span className="inline-flex items-center gap-1.5"><MapPin className="size-4 text-gold" />{v.locality}, {v.city}</span>}
                {v.rating && (
                  <a href="#reviews" className="inline-flex items-center gap-1.5 hover:text-white">
                    <Star className="size-4 fill-gold text-gold" /><strong className="text-white">{v.rating.avg.toFixed(1)}</strong> ({v.rating.count} reviews)
                  </a>
                )}
                {v.years_experience ? <span className="inline-flex items-center gap-1.5"><Clock className="size-4 text-gold" />{v.years_experience}+ years</span> : null}
                {v.languages.length > 0 && <span className="inline-flex items-center gap-1.5"><Languages className="size-4 text-gold" />{v.languages.join(", ")}</span>}
                {v.verification === "verified" && (
                  <details className="group relative">
                    <summary className="inline-flex cursor-pointer list-none items-center gap-1.5 rounded-full bg-mint px-3 py-1 font-semibold text-teal-deep">
                      <BadgeCheck className="size-4" />{settings.verification.badge_label}
                    </summary>
                    <div className="absolute left-0 top-9 z-30 w-80 rounded-2xl bg-white p-4 text-sm text-ink shadow-[var(--shadow-lift)]">
                      <p className="font-semibold">What this badge means</p>
                      <p className="mt-1 text-slate">{settings.verification.explanation}</p>
                      <ul className="mt-3 space-y-1.5">
                        {settings.verification.checks.map((c) => (
                          <li key={c.key} className="flex gap-2"><BadgeCheck className="mt-0.5 size-4 shrink-0 text-success" />{c.label}</li>
                        ))}
                      </ul>
                    </div>
                  </details>
                )}
              </div>
            </div>
            <ReactionButtons vendorId={v.id} name={v.name} initial={reactions} />
          </div>
        </div>
      </section>

      <VendorWorkspace
        vendor={{
          id: v.id, slug: v.slug, name: v.name, description: v.description, categorySlug: v.category?.slug ?? null, categoryId: v.category?.id ?? null,
          locality: v.locality, serviceArea: v.service_area, highlights: v.highlights, keyTerms: v.key_terms, yearsExperience: v.years_experience,
          languages: v.languages, verified: v.verification === "verified",
        }}
        services={v.services}
        media={v.media}
        updates={v.updates}
        reviews={v.reviews}
        rating={v.rating}
        assist={settings.assist}
        viewer={viewer ? { name: viewer.name, email: viewer.email } : null}
        initialServiceId={service}
      />
    </>
  );
}
