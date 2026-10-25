import type { Metadata } from "next";
import { requireVendor } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageTitle } from "@/components/portal/topbar";
import { ServicesManager } from "@/components/vendor-portal/services-manager";

export const metadata: Metadata = { title: "Services" };

export default async function VendorServicesPage({ searchParams }: { searchParams: Promise<{ new?: string }> }) {
  const { vendorId } = await requireVendor();
  const sp = await searchParams;
  const supabase = await createClient();
  const { data } = await supabase.from("services")
    .select("id, title, description, price_type, price_amount, price_unit, lead_time, delivery_options, availability, image_url, active")
    .eq("vendor_id", vendorId).order("active", { ascending: false }).order("sort").order("created_at");
  return (
    <>
      <PageTitle title="Services">What customers can enquire about. Prices are indicative and confirmed per order.</PageTitle>
      <ServicesManager vendorId={vendorId} services={data ?? []} openNew={sp.new === "1"} />
    </>
  );
}
