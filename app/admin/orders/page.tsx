import type { Metadata } from "next";
import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { getAdminOrders } from "@/lib/data/admin";
import { ORDER_STATUS } from "@/lib/status";
import { formatINR, timeAgo } from "@/lib/format";
import { StatusBadge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/misc";
import { PageTitle } from "@/components/portal/topbar";
import { cn } from "@/lib/cn";

export const metadata: Metadata = { title: "Orders" };
const FILTERS = ["submitted", "new", "accepted", "in_progress", "completed", "payment_recorded", "closed", "cancelled", "declined", "all"];

export default async function AdminOrders({ searchParams }: { searchParams: Promise<{ status?: string; page?: string }> }) {
  await requireRole(["admin", "finance"], "/admin");
  const sp = await searchParams;
  const status = sp.status && FILTERS.includes(sp.status) ? sp.status : "submitted";
  const page = Math.max(1, Number(sp.page) || 1);
  const { rows, total } = await getAdminOrders(status, page);
  return (
    <>
      <PageTitle title="Orders">Submitted orders wait for Tarkkash verification before closing. Closing books commission and fees.</PageTitle>
      <div className="mb-5 flex gap-2 overflow-x-auto scrollbar-none">
        {FILTERS.map((f) => <Link key={f} href={`/admin/orders?status=${f}`} className={cn("inline-flex min-h-10 shrink-0 items-center rounded-full border px-4 text-sm font-semibold", status === f ? "border-teal bg-teal text-white" : "border-line bg-white")}>{f === "all" ? "All" : ORDER_STATUS[f]?.label}</Link>)}
      </div>
      {!rows.length ? <EmptyState title="No orders here" /> : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-cream text-left text-xs uppercase tracking-wider text-slate"><tr><th className="px-5 py-3">Order</th><th className="px-5 py-3">Vendor</th><th className="px-5 py-3">Service</th><th className="px-5 py-3">Customer</th><th className="px-5 py-3">Amount</th><th className="px-5 py-3">Status</th><th className="px-5 py-3">Created</th></tr></thead>
            <tbody className="divide-y divide-line">
              {rows.map((o) => (
                <tr key={o.id} className="hover:bg-cream/60">
                  <td className="px-5 py-3"><Link href={`/admin/orders/${o.id}`} className="font-mono font-semibold text-teal hover:underline">{o.ref_code}</Link></td>
                  <td className="px-5 py-3">{o.vendors?.name}</td><td className="px-5 py-3">{o.title}</td><td className="px-5 py-3">{o.customer_display_name}</td>
                  <td className="px-5 py-3 font-semibold">{formatINR(o.agreed_amount)}</td><td className="px-5 py-3"><StatusBadge map={ORDER_STATUS} status={o.status} /></td><td className="px-5 py-3 text-slate">{timeAgo(o.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex items-center justify-between border-t border-line px-5 py-3 text-sm text-slate">
            <span>{total} orders</span>
            <div className="flex gap-2">
              {page > 1 && <Link href={`/admin/orders?status=${status}&page=${page - 1}`} className="rounded-full border border-line px-3 py-1.5 font-semibold text-ink">Previous</Link>}
              {page * 25 < total && <Link href={`/admin/orders?status=${status}&page=${page + 1}`} className="rounded-full border border-line px-3 py-1.5 font-semibold text-ink">Next</Link>}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
