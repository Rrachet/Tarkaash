import type { Metadata } from "next";
import Link from "next/link";
import { ClipboardList, ChevronRight } from "lucide-react";
import { requireVendor } from "@/lib/auth";
import { getVendorOrders, ORDER_FILTERS } from "@/lib/data/vendor";
import { ORDER_STATUS } from "@/lib/status";
import { formatDate, formatINR, timeAgo } from "@/lib/format";
import { StatusBadge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/misc";
import { PageTitle } from "@/components/portal/topbar";
import { cn } from "@/lib/cn";

export const metadata: Metadata = { title: "Orders & bookings" };

export default async function VendorOrdersPage({ searchParams }: { searchParams: Promise<{ filter?: string; page?: string }> }) {
  const { vendorId } = await requireVendor();
  const sp = await searchParams;
  const filter = sp.filter && sp.filter in ORDER_FILTERS ? sp.filter : "all";
  const page = Math.max(1, Number(sp.page) || 1);
  const { orders, total, counts } = await getVendorOrders(vendorId, filter, page);
  const pages = Math.max(1, Math.ceil(total / 20));

  return (
    <>
      <PageTitle title="Orders & bookings">Every order from acceptance to completion, managed through Tarkaash.</PageTitle>
      <div className="mb-5 flex gap-2 overflow-x-auto scrollbar-none">
        {Object.entries(ORDER_FILTERS).map(([k, f]) => (
          <Link key={k} href={`/vendor/orders?filter=${k}`} aria-current={filter === k ? "page" : undefined}
            className={cn("inline-flex min-h-10 shrink-0 items-center gap-2 rounded-full border px-4 text-sm font-semibold",
              filter === k ? "border-teal bg-teal text-white" : "border-line bg-white hover:border-teal/40")}>
            {f.label}<span className={cn("rounded-full px-1.5 text-xs", filter === k ? "bg-white/20" : "bg-cream-200")}>{counts[k] ?? 0}</span>
          </Link>
        ))}
      </div>
      {orders.length === 0 ? (
        <EmptyState icon={<ClipboardList className="size-6" />} title="No orders here">Orders assigned to you by Tarkaash will appear in this list.</EmptyState>
      ) : (
        <div className="card overflow-hidden">
          <ul className="divide-y divide-line">
            {orders.map((o) => (
              <li key={o.id}>
                <Link href={`/vendor/orders/${o.id}`} className="grid grid-cols-[1fr_auto] items-center gap-3 px-5 py-4 transition hover:bg-cream/60 md:grid-cols-[140px_1fr_140px_120px_170px_24px]">
                  <span className="font-mono text-sm font-semibold text-teal">{o.ref_code}</span>
                  <span className="min-w-0 md:order-none"><span className="block truncate font-medium">{o.title}</span><span className="block text-xs text-slate">{o.customer_display_name} · {timeAgo(o.created_at)}</span></span>
                  <span className="hidden text-sm text-slate md:block">{o.scheduled_for ? formatDate(o.scheduled_for) : "Date TBC"}</span>
                  <span className="hidden text-sm font-semibold md:block">{formatINR(o.agreed_amount)}</span>
                  <span className="col-span-2 md:col-span-1"><StatusBadge map={ORDER_STATUS} status={o.status} /></span>
                  <ChevronRight className="hidden size-5 text-slate md:block" />
                </Link>
              </li>
            ))}
          </ul>
          {pages > 1 && (
            <div className="flex items-center justify-between border-t border-line px-5 py-3 text-sm">
              <span className="text-slate">Page {page} of {pages} · {total} orders</span>
              <div className="flex gap-2">
                {page > 1 && <Link href={`/vendor/orders?filter=${filter}&page=${page - 1}`} className="rounded-full border border-line px-3 py-1.5 font-semibold hover:border-teal/40">Previous</Link>}
                {page < pages && <Link href={`/vendor/orders?filter=${filter}&page=${page + 1}`} className="rounded-full border border-line px-3 py-1.5 font-semibold hover:border-teal/40">Next</Link>}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
