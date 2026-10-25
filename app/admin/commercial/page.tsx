import type { Metadata } from "next";
import { IndianRupee, TrendingUp, Wallet, Scale, AlertTriangle, Download } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { getCommercialSummary } from "@/lib/analytics";
import { createClient } from "@/lib/supabase/server";
import { resolveRange } from "@/lib/dates";
import { formatDate, formatINR } from "@/lib/format";
import { PageTitle } from "@/components/portal/topbar";
import { RangeTabs } from "@/components/portal/range-tabs";
import { StatCard, DataFreshness } from "@/components/ui/misc";
import { Badge, SampleBadge } from "@/components/ui/badge";
import { BarCompare } from "@/components/charts/charts";
import { CostForm, ReconcileButton } from "@/components/admin/commercial-forms";

export const metadata: Metadata = { title: "Commercial & P&L" };

export default async function CommercialPage({ searchParams }: { searchParams: Promise<{ range?: string }> }) {
  const viewer = await requireRole(["admin", "finance"], "/admin");
  const sp = await searchParams;
  const range = resolveRange({ range: sp.range ?? "90d" });
  const supabase = await createClient();
  const [s, { data: ledger }, { data: costs }] = await Promise.all([
    getCommercialSummary(range.from, range.to),
    supabase.from("platform_ledger").select("id, txn_type, amount, direct_cost, basis, reconciliation, recognized_on, note, vendors(name), orders(ref_code)").gte("recognized_on", range.from).order("recognized_on", { ascending: false }).limit(25),
    supabase.from("cost_entries").select("id, cost_type, label, amount, incurred_on, basis").gte("incurred_on", range.from).order("incurred_on", { ascending: false }).limit(20),
  ]);
  const byType = Object.entries(s.revenue_by_type);
  return (
    <>
      <PageTitle title="Commercial & P&L" actions={<div className="flex gap-2"><RangeTabs base="/admin/commercial" current={sp.range ?? "90d"} /><a href={`/api/export/ledger?range=${sp.range ?? "90d"}`} className="inline-flex h-10 items-center gap-1.5 rounded-full border border-line bg-white px-4 text-sm font-semibold"><Download className="size-4" />Ledger CSV</a></div>}>
        Platform revenue is only fees and commission actually earned or recorded — vendor order value is shown separately. <SampleBadge className="ml-1 align-middle" />
      </PageTitle>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <StatCard label="Vendor order value" value={formatINR(s.gmv)} sub="Not Tarkaash revenue" icon={<Wallet className="size-4" />} tone="sky" />
        <StatCard label="Platform revenue" value={formatINR(s.revenue)} sub={`${formatINR(s.revenue_actual)} actual · ${formatINR(s.revenue_accrued)} accrued`} icon={<IndianRupee className="size-4" />} tone="gold" />
        <StatCard label="Contribution" value={formatINR(s.contribution)} sub={`After ${formatINR(s.direct_costs)} direct costs`} icon={<TrendingUp className="size-4" />} tone="mint" />
        <StatCard label="Operating result" value={formatINR(s.operating_result)} sub={`After ${formatINR(s.operating_costs)} operating costs`} icon={<Scale className="size-4" />} tone={s.operating_result < 0 ? "rose" : "teal"} />
        <StatCard label="Unreconciled entries" value={s.unreconciled} sub={`Forecast next: ${formatINR(s.revenue_forecast)}`} icon={<AlertTriangle className="size-4" />} tone="violet" />
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <section className="card p-5">
          <h2 className="font-sans text-base font-semibold">Monthly revenue vs costs</h2>
          <div className="mt-4"><BarCompare data={s.monthly} xKey="month" money keys={[{ key: "revenue", label: "Revenue", color: "#004B4B" }, { key: "direct", label: "Direct costs", color: "#D9A441" }, { key: "operating", label: "Operating costs", color: "#C76B4A" }]} height={280} /></div>
        </section>
        <section className="card p-5">
          <h2 className="font-sans text-base font-semibold">Estimated P&amp;L</h2>
          <dl className="mt-4 space-y-3 text-sm">
            {byType.map(([k, v]) => <div key={k} className="flex justify-between"><dt className="capitalize text-slate">{k.replace("_", " ")}</dt><dd>{formatINR(v)}</dd></div>)}
            <div className="flex justify-between border-t border-line pt-3 font-semibold"><dt>Platform revenue</dt><dd>{formatINR(s.revenue)}</dd></div>
            <div className="flex justify-between"><dt className="text-slate">Direct costs</dt><dd>– {formatINR(s.direct_costs)}</dd></div>
            <div className="flex justify-between border-t border-line pt-3 font-semibold"><dt>Contribution</dt><dd>{formatINR(s.contribution)}</dd></div>
            <div className="flex justify-between"><dt className="text-slate">Operating costs</dt><dd>– {formatINR(s.operating_costs)}</dd></div>
            <div className={`flex justify-between border-t-2 border-ink pt-3 text-base font-bold ${s.operating_result < 0 ? "text-danger" : "text-success"}`}><dt>Operating result</dt><dd>{formatINR(s.operating_result)}</dd></div>
          </dl>
          <p className="mt-4 text-xs text-slate">Fees, commission and tax treatment are configurable and pending product-owner approval.</p>
        </section>
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <section className="card overflow-x-auto">
          <h2 className="p-5 font-sans text-base font-semibold">Recent ledger entries</h2>
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-cream text-left text-xs uppercase tracking-wider text-slate"><tr><th className="px-5 py-2.5">Date</th><th className="px-3 py-2.5">Type</th><th className="px-3 py-2.5">Vendor / order</th><th className="px-3 py-2.5 text-right">Amount</th><th className="px-3 py-2.5">Basis</th><th className="px-5 py-2.5"></th></tr></thead>
            <tbody className="divide-y divide-line">
              {(ledger ?? []).map((l) => (
                <tr key={l.id}>
                  <td className="px-5 py-2.5 text-slate">{formatDate(l.recognized_on)}</td>
                  <td className="px-3 py-2.5 capitalize">{l.txn_type.replace("_", " ")}</td>
                  <td className="px-3 py-2.5">{l.vendors?.name ?? "—"} <span className="font-mono text-xs text-slate">{l.orders?.ref_code}</span></td>
                  <td className="px-3 py-2.5 text-right font-semibold">{formatINR(l.amount)}</td>
                  <td className="px-3 py-2.5"><Badge tone={l.basis === "actual" ? "mint" : l.basis === "forecast" ? "slate" : "gold"}>{l.basis}</Badge></td>
                  <td className="px-5 py-2.5 text-right">{l.basis !== "forecast" && <ReconcileButton id={l.id} reconciled={l.reconciliation === "reconciled"} />}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
        <section className="card p-5">
          <h2 className="font-sans text-base font-semibold">Costs</h2>
          <ul className="mt-3 max-h-72 divide-y divide-line overflow-y-auto text-sm">
            {(costs ?? []).map((c) => <li key={c.id} className="flex justify-between gap-2 py-2"><span>{c.label} <span className="text-xs text-slate">· {c.cost_type} · {formatDate(c.incurred_on)}{c.basis !== "actual" ? ` · ${c.basis}` : ""}</span></span><span className="font-semibold">{formatINR(c.amount)}</span></li>)}
          </ul>
          <CostForm />
        </section>
      </div>
      <div className="mt-4"><DataFreshness generatedAt={s.generated_at} label={`${range.from} to ${range.to} · viewed as ${viewer.role}`} sample /></div>
    </>
  );
}
