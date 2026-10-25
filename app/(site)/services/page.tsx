import type { Metadata } from "next";
import { getCategories, searchVendors } from "@/lib/data/public";
import { ExploreView } from "@/components/marketing/explore-view";
import { pageMeta } from "@/lib/seo";

export const metadata: Metadata = pageMeta({
  title: "Explore Local Services in Hyderabad",
  description: "Browse trusted local providers in Hyderabad: home bakers, tiffin services, home tutors, beauticians, cleaning, repairs, travel planners and more. Filter by area and send one enquiry.",
  path: "/services",
  keywords: ["local services in Hyderabad", "services near me", "home services Hyderabad", "local providers Hyderabad"],
});

type SP = Promise<{ q?: string; category?: string; locality?: string; sort?: string }>;

export default async function ServicesPage({ searchParams }: { searchParams: SP }) {
  const { q, locality, sort } = await searchParams; // ?category= is redirected by proxy.ts
  const sp = { q, locality, sort };
  const [categories, vendors] = await Promise.all([getCategories(), searchVendors(sp)]);
  return (
    <ExploreView categories={categories} vendors={vendors} sp={sp} active={null}
      heading="Explore local services in Hyderabad"
      intro="Independent providers across Hyderabad, with every enquiry coordinated by Tarkaash."
      crumbs={[{ href: "/", label: "Home" }, { label: "Explore services" }]} />
  );
}
