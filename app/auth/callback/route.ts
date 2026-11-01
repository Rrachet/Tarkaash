import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { homeFor, safeNext, type AppRole } from "@/lib/routes";

/** Handles Google sign-in, email confirmation, magic-link and password-reset redirects (PKCE code or token hash). */
export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as "signup" | "magiclink" | "recovery" | "email" | "invite" | null;
  const intent = url.searchParams.get("intent");
  const supabase = await createClient();

  let ok = false;
  if (code) {
    ok = !(await supabase.auth.exchangeCodeForSession(code)).error;
  } else if (tokenHash && type) {
    ok = !(await supabase.auth.verifyOtp({ token_hash: tokenHash, type })).error;
  }
  if (!ok) return NextResponse.redirect(new URL("/login?error=link", url.origin));
  if (type === "recovery") return NextResponse.redirect(new URL("/reset-password/update", url.origin));

  let target = safeNext(url.searchParams.get("next"), "");
  if (!target) {
    // Google sign-in from the vendor login: vendors and staff go home, everyone else completes a vendor profile.
    const { data: { user } } = await supabase.auth.getUser();
    const { data: profile } = user ? await supabase.from("profiles").select("role").eq("id", user.id).single() : { data: null };
    const role = (profile?.role ?? "customer") as AppRole;
    const { count } = user ? await supabase.from("vendor_members").select("vendor_id", { count: "exact", head: true }).eq("user_id", user.id) : { count: 0 };
    if (role === "customer" && count) target = "/list-your-service"; // application waiting for approval
    else if (intent === "vendor" && role === "customer") target = "/list-your-service?welcome=google#apply";
    else target = homeFor(role);
  }
  return NextResponse.redirect(new URL(target, url.origin));
}
