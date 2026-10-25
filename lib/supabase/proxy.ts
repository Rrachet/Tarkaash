import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/lib/types/database";
import { requiredRoleFor, homeFor, type AppRole } from "@/lib/routes";

/** Refreshes the auth session cookie and enforces route-level role guards. */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    },
  );

  // Do not add logic between createServerClient and getUser: it refreshes the session.
  const { data: { user } } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const required = requiredRoleFor(path);
  if (!required) return response;

  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = `?next=${encodeURIComponent(path + request.nextUrl.search)}`;
    return NextResponse.redirect(url);
  }

  if (required === "any") return response;

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  const role = (profile?.role ?? "customer") as AppRole;
  if (!required.includes(role)) {
    const url = request.nextUrl.clone();
    url.pathname = homeFor(role);
    url.search = "?denied=1";
    return NextResponse.redirect(url);
  }
  return response;
}
