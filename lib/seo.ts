import type { Metadata } from "next";
import { BRAND, CATEGORY_SEO, type Faq } from "@/lib/content/seo";
import { FOUNDERS } from "@/lib/content/site";

/** Public origin, without a trailing slash. */
export function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
}
export const abs = (path: string) => `${siteUrl()}${path.startsWith("/") ? path : `/${path}`}`;

/** Search engines may index the site only when this is switched on (after demo data is replaced). */
export function indexingAllowed(): boolean {
  return process.env.NEXT_PUBLIC_ALLOW_INDEXING === "1";
}

/** Robots metadata for private pages: never indexed, whatever the global switch says. */
export const PRIVATE_ROBOTS: Metadata["robots"] = { index: false, follow: false };

/** Canonical + Open Graph for a public page. */
export function pageMeta(opts: { title: string; description: string; path: string; keywords?: string[]; image?: string; absoluteTitle?: boolean }): Metadata {
  return {
    // Titles that already name the brand skip the "| Tarkaash" suffix.
    title: opts.absoluteTitle || opts.title.includes("Tarkaash") ? { absolute: opts.title } : opts.title,
    description: opts.description,
    keywords: opts.keywords,
    alternates: { canonical: opts.path },
    openGraph: {
      title: opts.title,
      description: opts.description,
      url: opts.path,
      siteName: BRAND.name,
      locale: "en_IN",
      type: "website",
      ...(opts.image ? { images: [opts.image] } : {}),
    },
    twitter: { card: "summary_large_image", title: opts.title, description: opts.description },
  };
}

// ---------- JSON-LD builders ----------
type Json = Record<string, unknown>;

export function organizationLd(): Json {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": abs("/#organization"),
    name: BRAND.name,
    url: abs("/"),
    logo: abs("/brand/tarkaash-logo-color.png"),
    slogan: BRAND.slogan,
    description: "Local services platform in Hyderabad that connects customers with trusted independent providers and coordinates every enquiry.",
    areaServed: [{ "@type": "City", name: "Hyderabad" }, { "@type": "Country", name: "India" }],
    founder: FOUNDERS.map((f) => ({ "@type": "Person", name: f.name, jobTitle: f.role })),
    address: { "@type": "PostalAddress", addressLocality: BRAND.city, addressRegion: BRAND.region, addressCountry: "IN" },
  };
}

export function websiteLd(): Json {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": abs("/#website"),
    name: BRAND.name,
    url: abs("/"),
    inLanguage: "en-IN",
    publisher: { "@id": abs("/#organization") },
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: `${abs("/services")}?q={search_term_string}` },
      "query-input": "required name=search_term_string",
    },
  };
}

export function faqLd(faqs: Faq[]): Json {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };
}

export function breadcrumbLd(items: { name: string; path: string }[]): Json {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, item: abs(it.path) })),
  };
}

export function itemListLd(name: string, vendors: { name: string; slug: string }[]): Json {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    numberOfItems: vendors.length,
    itemListElement: vendors.map((v, i) => ({ "@type": "ListItem", position: i + 1, name: v.name, url: abs(`/vendors/${v.slug}`) })),
  };
}

export function vendorLd(v: {
  slug: string; name: string; tagline: string | null; description: string | null; locality: string | null; city: string;
  service_area: string[]; avatar_url: string | null; cover_url: string | null; is_demo: boolean; languages: string[];
  category: { slug: string; name: string } | null;
  services: { title: string; description: string | null; price_amount: number | null; price_type: string; price_unit: string | null }[];
  rating: { avg: number; count: number } | null;
}): Json {
  const type = (v.category && CATEGORY_SEO[v.category.slug]?.schemaType) || "ProfessionalService";
  const ld: Json = {
    "@context": "https://schema.org",
    "@type": type,
    "@id": abs(`/vendors/${v.slug}#business`),
    name: v.name,
    url: abs(`/vendors/${v.slug}`),
    description: v.description ?? v.tagline ?? undefined,
    image: [v.cover_url, v.avatar_url].filter(Boolean),
    address: { "@type": "PostalAddress", addressLocality: v.locality ?? v.city, addressRegion: BRAND.region, addressCountry: "IN" },
    areaServed: (v.service_area.length ? v.service_area : [v.locality ?? v.city]).map((a) => ({ "@type": "Place", name: `${a}, Hyderabad` })),
    knowsLanguage: v.languages.length ? v.languages : undefined,
    priceRange: "₹₹",
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: `${v.name} services`,
      itemListElement: v.services.map((s) => ({
        "@type": "Offer",
        itemOffered: { "@type": "Service", name: s.title, description: s.description ?? undefined },
        ...(s.price_amount !== null && s.price_type !== "quote"
          ? { priceSpecification: { "@type": "PriceSpecification", price: s.price_amount, priceCurrency: "INR", ...(s.price_type === "from" ? { minPrice: s.price_amount } : {}) } }
          : {}),
      })),
    },
    isPartOf: { "@id": abs("/#website") },
  };
  // Never mark up sample reviews: rating rich results only for real (non-demo) providers.
  if (!v.is_demo && v.rating && v.rating.count > 0) {
    ld.aggregateRating = { "@type": "AggregateRating", ratingValue: Number(v.rating.avg.toFixed(1)), reviewCount: v.rating.count, bestRating: 5 };
  }
  return ld;
}
