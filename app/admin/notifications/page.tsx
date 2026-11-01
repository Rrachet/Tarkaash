import type { Metadata } from "next";
import Link from "next/link";
import { Mail, MessageCircle } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageTitle } from "@/components/portal/topbar";
import { NotificationsList } from "@/components/portal/notifications-list";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/cn";

export const metadata: Metadata = { title: "Notifications" };

const AUDIENCE: Record<string, string> = { admin: "Tarkkash team", vendor: "Vendor", customer: "Customer", user: "Account" };

export default async function AdminNotifications({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  await requireRole(["admin", "finance"], "/admin");
  const { tab } = await searchParams;
  const supabase = await createClient();
  const showLog = tab === "deliveries";

  const tabs = (
    <div role="tablist" className="mb-6 inline-flex rounded-full bg-cream-200 p-1 text-sm font-semibold">
      {[["inbox", "Team inbox"], ["deliveries", "Delivery log"]].map(([k, l]) => {
        const active = (k === "deliveries") === showLog;
        return <Link key={k} role="tab" aria-selected={active} href={k === "inbox" ? "/admin/notifications" : "/admin/notifications?tab=deliveries"}
          className={cn("rounded-full px-4 py-2 transition", active ? "bg-white text-teal shadow-sm" : "text-slate hover:text-teal")}>{l}</Link>;
      })}
    </div>
  );

  if (!showLog) {
    const { data } = await supabase.from("notifications").select("id, title, body, link, read_at, created_at").eq("audience", "admin").order("created_at", { ascending: false }).limit(100);
    return (<><PageTitle title="Notifications">New enquiries, declines, submissions and applications.</PageTitle>{tabs}<NotificationsList items={data ?? []} /></>);
  }

  const { data: rows } = await supabase.from("notification_deliveries")
    .select("id, channel, recipient, redirected_from, status, detail, created_at, notifications(title, audience)")
    .order("created_at", { ascending: false }).limit(200);

  return (
    <>
      <PageTitle title="Notifications">Every email and WhatsApp message Tarkkash tried to send, newest first.</PageTitle>
      {tabs}
      {!rows?.length ? (
        <p className="card p-8 text-center text-slate">No deliveries yet. Use Settings → “Send me a test notification” to try it.</p>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="bg-cream text-left text-xs uppercase tracking-wider text-slate">
              <tr><th className="px-4 py-3">When</th><th className="px-4 py-3">Event</th><th className="px-4 py-3">Channel</th><th className="px-4 py-3">Sent to</th><th className="px-4 py-3">Status</th></tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((r) => {
                const n = r.notifications as { title: string; audience: string } | null;
                return (
                  <tr key={r.id} className="align-top">
                    <td className="whitespace-nowrap px-4 py-3 text-slate">{formatDateTime(r.created_at)}</td>
                    <td className="px-4 py-3"><p className="font-medium text-ink">{n?.title ?? "Notification"}</p><p className="text-xs text-slate">{AUDIENCE[n?.audience ?? ""] ?? ""}</p></td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5">{r.channel === "email" ? <Mail className="size-4 text-teal" /> : <MessageCircle className="size-4 text-success" />}{r.channel === "email" ? "Email" : "WhatsApp"}</span>
                    </td>
                    <td className="px-4 py-3"><p className="font-mono text-xs">{r.recipient}</p>{r.redirected_from && <p className="text-xs text-slate">demo account {r.redirected_from}</p>}</td>
                    <td className="px-4 py-3">
                      <Badge tone={r.status === "sent" ? "mint" : r.status === "failed" ? "danger" : "neutral"}>{r.status === "sent" ? "Sent" : r.status === "failed" ? "Failed" : "Skipped"}</Badge>
                      {r.detail && <p className="mt-1 max-w-xs text-xs text-slate">{r.detail}</p>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
