import type { Metadata } from "next";
import Link from "next/link";
import { Wallet, IndianRupee, Clock, Info } from "lucide-react";
import { requireVendor } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageTitle } from "@/components/portal/topbar";
import { StatCard, EmptyState } from "@/components/ui/misc";
import { Badge } from "@/components/ui/badge";
import { formatDateTime, formatINR } from "@/lib/format";

export const metadata: Metadata = { title: "Payouts & earnings" };

export default async function PayoutsPage() {
  const { vendorId } = await requireVendor();
  const supabase = await createClient();
  const { data } = await supabase.from("payments")
    .select("id, amount, method, status, transaction_ref, created_at, orders!inner(id, ref_code, title, vendor_id)")
    .eq("orders.vendor_id", vendorId).order("created_at", { ascending: false }).limit(200);
  const rows = data ?? [];
  const sum = (f: (r: (typeof rows)[number]) => boolean) => rows.filter(f).reduce((s, r) => s + Number(r.amount), 0);
  return (
    <>
      <PageTitle title="Payouts & earnings">Payments you&apos;ve recorded against Tarkaash orders.</PageTitle>
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <StatCard label="Total recorded" value={formatINR(sum(() => true))} icon={<IndianRupee className="size-4" />} tone="mint" />
        <StatCard label="Verified by Tarkaash" value={formatINR(sum((r) => r.status === "verified"))} icon={<Wallet className="size-4" />} />
        <StatCard label="Awaiting verification" value={formatINR(sum((r) => r.status === "recorded"))} icon={<Clock className="size-4" />} tone="gold" />
      </div>
      <p className="mb-4 flex items-start gap-2 rounded-xl bg-gold-pale/60 p-3 text-sm text-[#6b4710]"><Info className="mt-0.5 size-4 shrink-0" />Customers currently pay you directly. Platform fees and settlement terms are pending approval and will appear here once confirmed.</p>
      {!rows.length ? <EmptyState icon={<Wallet className="size-6" />} title="No payments recorded yet" /> : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-cream text-left text-xs uppercase tracking-wider text-slate"><tr><th className="px-5 py-3">Date</th><th className="px-5 py-3">Order</th><th className="px-5 py-3">Method</th><th className="px-5 py-3">Reference</th><th className="px-5 py-3">Amount</th><th className="px-5 py-3">Status</th></tr></thead>
            <tbody className="divide-y divide-line">
              {rows.map((p) => (
                <tr key={p.id}>
                  <td className="px-5 py-3 text-slate">{formatDateTime(p.created_at)}</td>
                  <td className="px-5 py-3"><Link href={`/vendor/orders/${p.orders.id}`} className="font-mono font-semibold text-teal hover:underline">{p.orders.ref_code}</Link><span className="block text-xs text-slate">{p.orders.title}</span></td>
                  <td className="px-5 py-3 uppercase">{p.method.replace("_", " ")}</td>
                  <td className="px-5 py-3 font-mono text-xs">{p.transaction_ref ?? "—"}</td>
                  <td className="px-5 py-3 font-semibold">{formatINR(p.amount)}</td>
                  <td className="px-5 py-3"><Badge tone={p.status === "verified" ? "mint" : p.status === "rejected" ? "danger" : "gold"}>{p.status}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
