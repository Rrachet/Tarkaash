import type { Metadata } from "next";
import { requireVendor } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageTitle } from "@/components/portal/topbar";
import { ProfileEditor } from "@/components/vendor-portal/profile-editor";
import { VENDOR_STATUS } from "@/lib/status";
import { StatusBadge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "My profile" };

export default async function VendorProfilePage() {
  const { vendorId } = await requireVendor();
  const supabase = await createClient();
  const [{ data: v }, { data: media }, { data: completeness }] = await Promise.all([
    supabase.from("vendors").select("id, name, tagline, description, locality, service_area, languages, highlights, key_terms, years_experience, avatar_url, cover_url, status, verification, verification_checks").eq("id", vendorId).single(),
    supabase.from("vendor_media").select("id, url, caption, moderation").eq("vendor_id", vendorId).order("sort"),
    supabase.rpc("listing_completeness", { p_vendor: vendorId }),
  ]);
  if (!v) return null;
  return (
    <>
      <PageTitle title="My profile" actions={<StatusBadge map={VENDOR_STATUS} status={v.status} />}>
        This is what customers see on your public page. Listing strength: <strong className="text-ink">{completeness ?? 0}%</strong>
      </PageTitle>
      <ProfileEditor vendor={v} media={media ?? []} />
    </>
  );
}
