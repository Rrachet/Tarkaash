import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";
import { CATEGORY_SEO } from "@/lib/content/seo";

/** Old public address that now forwards to the custom domain. Preview deployment URLs are left alone. */
const LEGACY_HOST = "tarkaash.vercel.app";

export async function proxy(request: NextRequest) {
  // The old vercel.app address moves permanently to the main domain, keeping the path and query.
  const site = process.env.NEXT_PUBLIC_SITE_URL;
  if (site && request.headers.get("host") === LEGACY_HOST && new URL(site).host !== LEGACY_HOST) {
    const target = new URL(request.nextUrl.pathname + request.nextUrl.search, site);
    return NextResponse.redirect(target, 308);
  }

  // Old category links (/services?category=x) move permanently to the indexable /services/x page.
  const { pathname, searchParams } = request.nextUrl;
  const category = searchParams.get("category");
  if (pathname === "/services" && category && CATEGORY_SEO[category]) {
    const url = request.nextUrl.clone();
    url.pathname = `/services/${category}`;
    url.searchParams.delete("category");
    return NextResponse.redirect(url, 308);
  }
  return updateSession(request);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.png|brand/|images/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif)$).*)"],
};
