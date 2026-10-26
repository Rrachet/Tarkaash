import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { AppRole } from "@/lib/routes";

export type Viewer = {
  id: string;
  email: string | null;
  name: string | null;
  role: AppRole;
  vendorIds: string[];
  /** View-only staff (showcase demo admin/finance): can see everything, change nothing. */
  readOnly: boolean;
};

/** The signed-in user with role and vendor memberships, or null. Cached per request. */
export const getViewer = cache(async (): Promise<Viewer | null> => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const [{ data: profile }, { data: members }] = await Promise.all([
    supabase.from("profiles").select("role, full_name, email, read_only, blocked_at").eq("id", user.id).single(),
    supabase.from("vendor_members").select("vendor_id").eq("user_id", user.id),
  ]);
  // Suspended accounts are treated as signed out everywhere (proxy.ts also ends their session).
  if (profile?.blocked_at) return null;
  return {
    id: user.id,
    email: profile?.email ?? user.email ?? null,
    name: profile?.full_name ?? null,
    role: (profile?.role ?? "customer") as AppRole,
    vendorIds: (members ?? []).map((m) => m.vendor_id),
    readOnly: !!profile?.read_only,
  };
});

export async function requireViewer(next = "/"): Promise<Viewer> {
  const viewer = await getViewer();
  if (!viewer) redirect(`/login?next=${encodeURIComponent(next)}`);
  return viewer;
}

export async function requireRole(roles: AppRole[], next = "/"): Promise<Viewer> {
  const viewer = await requireViewer(next);
  if (!roles.includes(viewer.role)) redirect("/?denied=1");
  return viewer;
}

/** The vendor a vendor-portal user is working on (first membership). */
export async function requireVendor(): Promise<Viewer & { vendorId: string }> {
  const viewer = await requireRole(["vendor", "admin"], "/vendor");
  const vendorId = viewer.vendorIds[0];
  if (!vendorId) redirect("/list-your-service");
  return { ...viewer, vendorId };
}
