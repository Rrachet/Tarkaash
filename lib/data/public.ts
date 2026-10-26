import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export type Category = { id: string; slug: string; name: string; icon: string; description: string | null };

export type VendorCardData = {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  locality: string | null;
  city: string;
  avatar_url: string | null;
  cover_url: string | null;
  verification: string;
  is_demo: boolean;
  category: { slug: string; name: string; icon: string } | null;
  rating: { avg: number; count: number } | null;
  fromPrice: number | null;
  serviceTitles: string[];
};

export type PublicService = {
  id: string; title: string; description: string | null; price_type: string; price_amount: number | null; price_unit: string | null;
  lead_time: string | null; delivery_options: string[]; availability: string | null; attributes: Record<string, unknown>; image_url: string | null;
};

export const getCategories = cache(async (): Promise<Category[]> => {
  const supabase = await createClient();
  const { data } = await supabase.from("categories").select("id, slug, name, icon, description").eq("active", true).order("sort");
  return data ?? [];
});

type VendorRow = {
  id: string; slug: string; name: string; tagline: string | null; locality: string | null; city: string; avatar_url: string | null;
  cover_url: string | null; verification: string; is_demo: boolean; description: string | null; service_area: string[];
  categories: { slug: string; name: string; icon: string } | null;
  services: { title: string; description: string | null; price_amount: number | null; price_type: string; active: boolean; moderation: string }[];
};

async function ratingsFor(vendorIds: string[]): Promise<Map<string, { avg: number; count: number }>> {
  const map = new Map<string, { avg: number; count: number }>();
  if (!vendorIds.length) return map;
  const supabase = await createClient();
  const { data } = await supabase.from("reviews").select("vendor_id, rating").eq("status", "approved").in("vendor_id", vendorIds);
  const acc = new Map<string, { sum: number; count: number }>();
  for (const r of data ?? []) {
    const a = acc.get(r.vendor_id) ?? { sum: 0, count: 0 };
    a.sum += r.rating; a.count += 1; acc.set(r.vendor_id, a);
  }
  for (const [k, v] of acc) map.set(k, { avg: v.sum / v.count, count: v.count });
  return map;
}

function toCard(v: VendorRow, ratings: Map<string, { avg: number; count: number }>): VendorCardData {
  const active = v.services.filter((s) => s.active && s.moderation === "approved");
  const prices = active.map((s) => s.price_amount).filter((p): p is number => p !== null);
  return {
    id: v.id, slug: v.slug, name: v.name, tagline: v.tagline, locality: v.locality, city: v.city, avatar_url: v.avatar_url,
    cover_url: v.cover_url, verification: v.verification, is_demo: v.is_demo, category: v.categories,
    rating: ratings.get(v.id) ?? null, fromPrice: prices.length ? Math.min(...prices) : null, serviceTitles: active.map((s) => s.title),
  };
}

const VENDOR_SELECT =
  "id, slug, name, tagline, locality, city, avatar_url, cover_url, verification, is_demo, description, service_area, categories:primary_category_id(slug, name, icon), services(title, description, price_amount, price_type, active, moderation)";

/** Search active providers by keyword (name, tagline, description, services), category and locality. */
export async function searchVendors(params: { q?: string; category?: string; locality?: string; sort?: string }): Promise<VendorCardData[]> {
  const supabase = await createClient();
  let query = supabase.from("vendors").select(VENDOR_SELECT).eq("status", "active");
  if (params.category) {
    const { data: cat } = await supabase.from("categories").select("id").eq("slug", params.category).maybeSingle();
    if (!cat) return [];
    query = query.eq("primary_category_id", cat.id);
  }
  const { data } = await query.order("created_at");
  let rows = (data ?? []) as unknown as VendorRow[];

  const q = params.q?.trim().toLowerCase();
  if (q) {
    const terms = q.split(/\s+/).filter(Boolean);
    rows = rows.filter((v) => {
      const hay = [v.name, v.tagline, v.description, v.categories?.name, v.locality, ...v.services.map((s) => `${s.title} ${s.description ?? ""}`)]
        .join(" ").toLowerCase();
      return terms.every((t) => hay.includes(t));
    });
  }
  const loc = params.locality?.trim().toLowerCase();
  if (loc) {
    rows = rows.filter((v) => [v.locality, v.city, ...v.service_area].join(" ").toLowerCase().includes(loc));
  }
  const ratings = await ratingsFor(rows.map((r) => r.id));
  const cards = rows.map((r) => toCard(r, ratings));
  if (params.sort === "rating") cards.sort((a, b) => (b.rating?.avg ?? 0) - (a.rating?.avg ?? 0));
  else if (params.sort === "price") cards.sort((a, b) => (a.fromPrice ?? Infinity) - (b.fromPrice ?? Infinity));
  else cards.sort((a, b) => Number(b.verification === "verified") - Number(a.verification === "verified") || (b.rating?.count ?? 0) - (a.rating?.count ?? 0));
  return cards;
}

export const getFeaturedVendors = cache(async (limit = 8): Promise<VendorCardData[]> => {
  const all = await searchVendors({});
  return all.filter((v) => v.avatar_url).slice(0, limit);
});

export type VendorProfile = {
  id: string; slug: string; name: string; tagline: string | null; description: string | null; locality: string | null; city: string;
  service_area: string[]; avatar_url: string | null; cover_url: string | null; years_experience: number | null; languages: string[];
  highlights: string[]; key_terms: string | null; verification: string; verified_at: string | null; is_demo: boolean; status: string;
  category: { id: string; slug: string; name: string; icon: string } | null;
  services: PublicService[];
  media: { id: string; url: string; caption: string | null }[];
  updates: { id: string; title: string; body: string | null; created_at: string }[];
  reviews: { id: string; author_name: string; rating: number; body: string | null; created_at: string; is_demo: boolean }[];
  rating: { avg: number; count: number; distribution: number[] } | null;
};

export const getVendorBySlug = cache(async (slug: string): Promise<VendorProfile | null> => {
  const supabase = await createClient();
  const { data: v } = await supabase.from("vendors")
    .select("id, slug, name, tagline, description, locality, city, service_area, avatar_url, cover_url, years_experience, languages, highlights, key_terms, verification, verified_at, is_demo, status, category:primary_category_id(id, slug, name, icon)")
    .eq("slug", slug).maybeSingle();
  if (!v) return null;
  const [services, media, updates, reviews] = await Promise.all([
    supabase.from("services").select("id, title, description, price_type, price_amount, price_unit, lead_time, delivery_options, availability, attributes, image_url")
      .eq("vendor_id", v.id).eq("active", true).eq("moderation", "approved").order("sort").order("created_at"),
    supabase.from("vendor_media").select("id, url, caption").eq("vendor_id", v.id).eq("moderation", "approved").order("sort"),
    supabase.from("vendor_updates").select("id, title, body, created_at").eq("vendor_id", v.id).eq("moderation", "approved").order("created_at", { ascending: false }).limit(5),
    supabase.from("reviews").select("id, author_name, rating, body, created_at, is_demo").eq("vendor_id", v.id).eq("status", "approved")
      .order("created_at", { ascending: false }).limit(200),
  ]);
  const revs = reviews.data ?? [];
  const distribution = [5, 4, 3, 2, 1].map((star) => revs.filter((r) => r.rating === star).length);
  return {
    ...(v as unknown as Omit<VendorProfile, "services" | "media" | "updates" | "reviews" | "rating">),
    services: (services.data ?? []) as PublicService[],
    media: media.data ?? [],
    updates: updates.data ?? [],
    reviews: revs,
    rating: revs.length ? { avg: revs.reduce((s, r) => s + r.rating, 0) / revs.length, count: revs.length, distribution } : null,
  };
});

export type PublicSettings = {
  assist: { enabled: boolean; fee: number; currency: string; approved: boolean; label: string };
  verification: { badge_label: string; explanation: string; checks: { key: string; label: string }[] };
  contact: { email: string | null; phone: string | null; address: string | null; confirmed: boolean };
};

export const getPublicSettings = cache(async (): Promise<PublicSettings> => {
  const supabase = await createClient();
  const { data } = await supabase.from("settings").select("key, value").in("key", ["assist", "verification", "contact"]);
  const map = Object.fromEntries((data ?? []).map((r) => [r.key, r.value]));
  return {
    assist: (map.assist as PublicSettings["assist"]) ?? { enabled: false, fee: 0, currency: "INR", approved: false, label: "Tarkaash Assist" },
    verification: (map.verification as PublicSettings["verification"]) ?? { badge_label: "Tarkaash Verified", explanation: "", checks: [] },
    contact: (map.contact as PublicSettings["contact"]) ?? { email: null, phone: null, address: null, confirmed: false },
  };
});

/** Platform numbers for the home page strip (live counts). */
export const getPlatformStats = cache(async () => {
  const supabase = await createClient();
  const [vendors, categories, reviews] = await Promise.all([
    supabase.from("vendors").select("id", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("categories").select("id", { count: "exact", head: true }).eq("active", true),
    supabase.from("reviews").select("rating").eq("status", "approved"),
  ]);
  const r = reviews.data ?? [];
  return {
    vendors: vendors.count ?? 0,
    categories: categories.count ?? 0,
    reviews: r.length,
    avgRating: r.length ? r.reduce((s, x) => s + x.rating, 0) / r.length : null,
  };
});

export async function getViewerReactions(vendorId: string): Promise<{ liked: boolean; following: boolean; signedIn: boolean }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { liked: false, following: false, signedIn: false };
  const [l, f] = await Promise.all([
    supabase.from("likes").select("vendor_id").eq("user_id", user.id).eq("vendor_id", vendorId).maybeSingle(),
    supabase.from("follows").select("vendor_id").eq("user_id", user.id).eq("vendor_id", vendorId).maybeSingle(),
  ]);
  return { liked: !!l.data, following: !!f.data, signedIn: true };
}
