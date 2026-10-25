import type { Metadata } from "next";
import Link from "next/link";
import { Search, Gift, ChevronRight } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { getEnquiries, ENQUIRY_TABS } from "@/lib/data/admin";
import { ENQUIRY_STATUS } from "@/lib/status";
import { formatDate, timeAgo } from "@/lib/format";
import { StatusBadge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/misc";
import { PageTitle } from "@/components/portal/topbar";
import { cn } from "@/lib/cn";

export const metadata: Metadata = { title: "Enquiry queue" };

export default async function EnquiryQueue({ searchParams }: { searchParams: Promise<{ tab?: string; page?: string; q?: string }> }) {
  await requireRole(["admin", "finance"], "/admin");
  const sp = await searchParams;
  const tab = sp.tab && sp.tab in ENQUIRY_TABS ? sp.tab : "new";
  const page = Math.max(1, Number(sp.page) || 1);
  const { rows, total } = await getEnquiries(tab, page, sp.q);
  const pages = Math.max(1, Math.ceil(total / 25));
  return (
    <>
      <PageTitle title="Enquiry queue" actions={
        <form action="/admin/enquiries" className="relative">
          <input type="hidden" name="tab" value="all" />
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate" />
          <input name="q" defaultValue={sp.q} placeholder="Find by reference (TK-…)" aria-label="Search by reference" className="h-10 w-64 rounded-full border border-line bg-white pl-9 pr-4 text-sm" />
        </form>
      }>Every customer enquiry lands here first. Assign it to the right provider and track it to closure.</PageTitle>
      <div className="mb-5 flex gap-2 overflow-x-auto scrollbar-none">
        {Object.entries(ENQUIRY_TABS).map(([k, t]) => (
          <Link key={k} href={`/admin/enquiries?tab=${k}`} className={cn("inline-flex min-h-10 shrink-0 items-center rounded-full border px-4 text-sm font-semibold", tab === k ? "border-teal bg-teal text-white" : "border-line bg-white")}>{t.label}</Link>
        ))}
      </div>
      {rows.length === 0 ? <EmptyState title={tab === "new" ? "Queue is clear" : "Nothing here"}>{tab === "new" ? "New enquiries will appear here the moment customers submit them." : "No enquiries match this view."}</EmptyState> : (
        <div className="card overflow-hidden">
          <ul className="divide-y divide-line">
            {rows.map((e) => (
              <li key={e.id}>
                <Link href={`/admin/enquiries/${e.id}`} className="grid gap-2 px-5 py-4 transition hover:bg-cream/60 md:grid-cols-[150px_1fr_200px_150px_24px] md:items-center">
                  <span><span className="block font-mono text-sm font-semibold text-teal">{e.ref_code}</span><span className="text-xs text-slate">{timeAgo(e.created_at)}</span></span>
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{e.services?.title ?? e.categories?.name ?? "General request"} <span className="font-normal text-slate">· {e.customers?.name}</span></span>
                    <span className="block truncate text-sm text-slate">{e.request}</span>
                  </span>
                  <span className="text-sm"><span className="block text-slate">{e.assigned?.name ? "Assigned to" : "Requested"}</span><span className="font-semibold">{e.assigned?.name ?? e.requested?.name ?? "Any provider"}</span></span>
                  <span className="flex flex-wrap items-center gap-1.5"><StatusBadge map={ENQUIRY_STATUS} status={e.status} />{e.assist_opt_in && <Gift className="size-4 text-gold-600" aria-label="Tarkaash Assist" />}<span className="w-full text-xs text-slate">{e.preferred_date ? `For ${formatDate(e.preferred_date)}` : ""}</span></span>
                  <ChevronRight className="hidden size-5 text-slate md:block" />
                </Link>
              </li>
            ))}
          </ul>
          {pages > 1 && (
            <div className="flex items-center justify-between border-t border-line px-5 py-3 text-sm">
              <span className="text-slate">Page {page} of {pages} · {total} enquiries</span>
              <div className="flex gap-2">
                {page > 1 && <Link href={`/admin/enquiries?tab=${tab}&page=${page - 1}`} className="rounded-full border border-line px-3 py-1.5 font-semibold">Previous</Link>}
                {page < pages && <Link href={`/admin/enquiries?tab=${tab}&page=${page + 1}`} className="rounded-full border border-line px-3 py-1.5 font-semibold">Next</Link>}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
