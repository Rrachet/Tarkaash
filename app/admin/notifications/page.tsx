import type { Metadata } from "next";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageTitle } from "@/components/portal/topbar";
import { NotificationsList } from "@/components/portal/notifications-list";

export const metadata: Metadata = { title: "Notifications" };

export default async function AdminNotifications() {
  await requireRole(["admin", "finance"], "/admin");
  const supabase = await createClient();
  const { data } = await supabase.from("notifications").select("id, title, body, link, read_at, created_at").eq("audience", "admin").order("created_at", { ascending: false }).limit(100);
  return (<><PageTitle title="Notifications">New enquiries, declines, submissions and applications.</PageTitle><NotificationsList items={data ?? []} /></>);
}
