import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";
import { CATEGORY_SEO, LOCALITY_PAGES } from "@/lib/content/seo";
import { abs } from "@/lib/seo";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient();
  const { data: vendors } = await supabase.from("vendors").select("slug, locality, service_area, updated_at").eq("status", "active");
  const now = new Date();
  const list = vendors ?? [];

  const pages: MetadataRoute.Sitemap = [
    { url: abs("/"), lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: abs("/services"), lastModified: now, changeFrequency: "daily", priority: 0.9 },
    ...["/how-it-works", "/about", "/list-your-service", "/contact"].map((p) => ({ url: abs(p), lastModified: now, changeFrequency: "monthly" as const, priority: 0.6 })),
    ...["/privacy", "/terms"].map((p) => ({ url: abs(p), lastModified: now, changeFrequency: "yearly" as const, priority: 0.2 })),
    ...Object.keys(CATEGORY_SEO).map((c) => ({ url: abs(`/services/${c}`), lastModified: now, changeFrequency: "weekly" as const, priority: 0.85 })),
  ];

  // Area pages only where at least one provider serves the area, so no empty pages are submitted.
  const served = (name: string) =>
    list.some((v) => [v.locality ?? "", ...(v.service_area ?? [])].join(" ").toLowerCase().includes(name.toLowerCase()));
  pages.push(...LOCALITY_PAGES.filter((l) => served(l.name)).map((l) => ({ url: abs(`/hyderabad/${l.slug}`), lastModified: now, changeFrequency: "weekly" as const, priority: 0.7 })));

  pages.push(...list.map((v) => ({ url: abs(`/vendors/${v.slug}`), lastModified: v.updated_at ? new Date(v.updated_at) : now, changeFrequency: "weekly" as const, priority: 0.75 })));
  return pages;
}
