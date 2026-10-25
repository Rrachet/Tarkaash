import type { Metadata } from "next";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageTitle } from "@/components/portal/topbar";
import { SettingsForms } from "@/components/admin/settings-forms";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const viewer = await requireRole(["admin", "finance"], "/admin");
  const supabase = await createClient();
  const { data } = await supabase.from("settings").select("key, value, description, updated_at");
  const map = Object.fromEntries((data ?? []).map((r) => [r.key, r]));
  return (
    <>
      <PageTitle title="Settings">Fees, routing rules and thresholds are configurable. Nothing in the mock-ups is assumed approved.</PageTitle>
      <SettingsForms settings={map as never} canEdit={viewer.role === "admin"} />
    </>
  );
}
