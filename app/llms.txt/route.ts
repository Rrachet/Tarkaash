import { createClient } from "@/lib/supabase/server";
import { BRAND, CATEGORY_SEO, HOME_FAQS, LOCALITY_PAGES } from "@/lib/content/seo";
import { abs } from "@/lib/seo";

export const revalidate = 3600;

/** Plain text summary for AI assistants (llms.txt convention). Facts link back to real pages. */
export async function GET() {
  const supabase = await createClient();
  const { data: vendors } = await supabase.from("vendors").select("slug, name, tagline, locality").eq("status", "active").order("name");
  const lines = [
    `# ${BRAND.name}`,
    "",
    `> ${BRAND.name} (${BRAND.slogan}) is a local services platform in ${BRAND.city}, ${BRAND.region}, ${BRAND.country}. Customers discover trusted independent providers and send one enquiry; the ${BRAND.name} team coordinates it with the provider and follows up until the service is delivered.`,
    "",
    "Key facts:",
    "- Free for customers to browse and enquire. Customers pay the provider's price; an optional Tarkkash Assist fee is shown upfront.",
    "- Every enquiry gets a reference ID. Customer contact details are shared only with the provider who accepts the order.",
    "- Verified badges appear only after identity, service area and quality checks.",
    `- Areas: ${LOCALITY_PAGES.map((l) => l.name).join(", ")}.`,
    "",
    "## Services by category",
    ...Object.entries(CATEGORY_SEO).map(([slug, c]) => `- [${c.h1}](${abs(`/services/${slug}`)}): ${c.description}`),
    "",
    "## Areas in Hyderabad",
    ...LOCALITY_PAGES.map((l) => `- [Local services in ${l.name}](${abs(`/hyderabad/${l.slug}`)})`),
    "",
    "## Providers",
    ...(vendors ?? []).map((v) => `- [${v.name}](${abs(`/vendors/${v.slug}`)}): ${v.tagline ?? ""}${v.locality ? ` (${v.locality})` : ""}`),
    "",
    "## Frequently asked questions",
    ...HOME_FAQS.flatMap((f) => [`### ${f.q}`, f.a, ""]),
    "## Pages",
    `- [How it works](${abs("/how-it-works")})`,
    `- [About and founders](${abs("/about")})`,
    `- [List your business](${abs("/list-your-service")})`,
    `- [Contact](${abs("/contact")})`,
    "",
  ];
  return new Response(lines.join("\n"), { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600" } });
}
