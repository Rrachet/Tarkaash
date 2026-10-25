import type { Metadata } from "next";
import Link from "next/link";
import { Mail, Phone } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageTitle } from "@/components/portal/topbar";
import { StatusBadge, Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/misc";
import { TicketButtons } from "@/components/admin/small-actions";
import { TICKET_STATUS } from "@/lib/status";
import { timeAgo } from "@/lib/format";
import { cn } from "@/lib/cn";

export const metadata: Metadata = { title: "Support tickets" };
const QUEUES = ["all", "onboarding", "support", "product", "partnerships", "operations"];

export default async function SupportPage({ searchParams }: { searchParams: Promise<{ queue?: string; status?: string }> }) {
  await requireRole(["admin", "finance"], "/admin");
  const sp = await searchParams;
  const queue = sp.queue && QUEUES.includes(sp.queue) ? sp.queue : "all";
  const supabase = await createClient();
  let q = supabase.from("support_tickets").select("id, ref_code, topic, name, email, phone, message, status, queue, created_at, linked_type, linked_id").order("created_at", { ascending: false }).limit(100);
  if (queue !== "all") q = q.eq("queue", queue);
  if (sp.status !== "all") q = q.in("status", ["open", "in_progress"]);
  const { data } = await q;
  return (
    <>
      <PageTitle title="Support tickets">Messages from the contact form and vendor applications, routed by topic.</PageTitle>
      <div className="mb-5 flex flex-wrap gap-2">
        {QUEUES.map((k) => <Link key={k} href={`/admin/support?queue=${k}${sp.status === "all" ? "&status=all" : ""}`} className={cn("inline-flex min-h-10 items-center rounded-full border px-4 text-sm font-semibold capitalize", queue === k ? "border-teal bg-teal text-white" : "border-line bg-white")}>{k}</Link>)}
        <Link href={`/admin/support?queue=${queue}${sp.status === "all" ? "" : "&status=all"}`} className="ml-auto inline-flex min-h-10 items-center text-sm font-semibold text-teal">{sp.status === "all" ? "Show open only" : "Include resolved"}</Link>
      </div>
      {!data?.length ? <EmptyState title="No open tickets" /> : (
        <ul className="space-y-3">
          {data.map((t) => (
            <li key={t.id} className="card p-5">
              <div className="flex flex-wrap items-center gap-2"><span className="font-mono text-sm font-semibold text-teal">{t.ref_code}</span><Badge tone="teal">{t.queue}</Badge><StatusBadge map={TICKET_STATUS} status={t.status} /><span className="ml-auto text-xs text-slate">{timeAgo(t.created_at)}</span></div>
              <p className="mt-2 font-semibold">{t.name}</p>
              <p className="mt-1 text-sm text-ink/85">{t.message}</p>
              <div className="mt-3 flex flex-wrap items-center gap-4 text-sm">
                {t.email && <a href={`mailto:${t.email}`} className="inline-flex items-center gap-1 text-teal hover:underline"><Mail className="size-4" />{t.email}</a>}
                {t.phone && <a href={`tel:${t.phone}`} className="inline-flex items-center gap-1 text-teal hover:underline"><Phone className="size-4" />{t.phone}</a>}
                {t.linked_type === "vendor" && t.linked_id && <Link href={`/admin/vendors/${t.linked_id}`} className="font-semibold text-gold-600 hover:underline">Review application →</Link>}
                <div className="ml-auto"><TicketButtons id={t.id} status={t.status} /></div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
