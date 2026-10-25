import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";
import { CATEGORY_SEO } from "@/lib/content/seo";

export async function proxy(request: NextRequest) {
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
