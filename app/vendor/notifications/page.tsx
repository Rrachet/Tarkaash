import type { Metadata } from "next";
import { requireVendor } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageTitle } from "@/components/portal/topbar";
import { NotificationsList } from "@/components/portal/notifications-list";

export const metadata: Metadata = { title: "Notifications" };

export default async function VendorNotificationsPage() {
  const { vendorId } = await requireVendor();
  const supabase = await createClient();
  const { data } = await supabase.from("notifications").select("id, title, body, link, read_at, created_at").eq("audience", "vendor").eq("vendor_id", vendorId).order("created_at", { ascending: false }).limit(100);
  return (<><PageTitle title="Notifications">New assignments, status changes and messages from Tarkaash.</PageTitle><NotificationsList items={data ?? []} /></>);
}
