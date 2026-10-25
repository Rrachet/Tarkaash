import type { Metadata } from "next";
import Link from "next/link";
import { Store, Inbox, CheckCircle2, ClipboardCheck, XCircle, Timer, IndianRupee, LayoutGrid, Download, Rocket, ArrowRight } from "lucide-react";
import { getAdminMetrics, getBoostQueue, getCommercialSummary } from "@/lib/analytics";
import { getCategories } from "@/lib/data/public";
import { requireRole } from "@/lib/auth";
import { resolveRange } from "@/lib/dates";
import { formatDuration, formatINR, formatNumber, formatPercent } from "@/lib/format";
import { StatCard, DataFreshness } from "@/components/ui/misc";
import { SampleBadge, Badge } from "@/components/ui/badge";
import { LineTrend, Donut } from "@/components/charts/charts";
import { PageTitle } from "@/components/portal/topbar";
import { LOCALITIES } from "@/lib/content/site";
import { ENQUIRY_STATUS } from "@/lib/status";

export const metadata: Metadata = { title: "Analytics" };

type SP = Promise<{ range?: string; category?: string; locality?: string }>;

export default async function AdminAnalytics({ searchParams }: { searchParams: SP }) {
  await requireRole(["admin", "finance"], "/admin");
  const sp = await searchParams;
  const range = resolveRange(sp);
  const preset = sp.range && ["7d", "30d", "90d"].includes(sp.range) ? sp.range : "30d";
  const categories = await getCategories();
  const cat = categories.find((c) => c.slug === sp.category);
  const [m, boost, money] = await Promise.all([
    getAdminMetrics(range.from, range.to, { categoryId: cat?.id, locality: sp.locality || undefined }),
    getBoostQueue(range.from, range.to),
    getCommercialSummary(range.from, range.to),
  ]);
  const statusData = Object.entries(m.enquiry_status).map(([k, v]) => ({ name: ENQUIRY_STATUS[k]?.label ?? k, value: v }));

  return (
    <>
      <PageTitle title="Tarkaash admin analytics" actions={
        <form className="flex flex-wrap items-center gap-2" action="/admin">
          <select name="range" defaultValue={preset} aria-label="Date range" className="h-10 rounded-full border border-line bg-white px-3 text-sm">
            <option value="7d">Last 7 days</option><option value="30d">Last 30 days</option><option value="90d">Last 90 days</option>
          </select>
          <select name="category" defaultValue={sp.category ?? ""} aria-label="Category" className="h-10 rounded-full border border-line bg-white px-3 text-sm">
            <option value="">All categories</option>{categories.map((c) => <option key={c.id} value={c.slug}>{c.name}</option>)}
          </select>
          <select name="locality" defaultValue={sp.locality ?? ""} aria-label="Locality" className="h-10 rounded-full border border-line bg-white px-3 text-sm">
            <option value="">All localities</option>{LOCALITIES.map((l) => <option key={l}>{l}</option>)}
          </select>
          <button className="h-10 rounded-full bg-teal px-4 text-sm font-semibold text-white">Apply</button>
        </form>
      }>
        Platform performance, vendor growth, service demand and revenue — {range.label.toLowerCase()}. <SampleBadge className="ml-1 align-middle" />
      </PageTitle>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Active vendors" value={formatNumber(m.active_vendors)} sub={`${m.verified_vendors} verified · ${m.pending_vendors} pending`} icon={<Store className="size-4" />} />
        <StatCard label="Leads (enquiries)" value={formatNumber(m.leads)} sub={`${m.unassigned} waiting in queue`} icon={<Inbox className="size-4" />} tone="gold" />
        <StatCard label="Accepted leads" value={formatNumber(m.accepted)} sub={`${formatPercent(m.acceptance_rate)} of ${m.assigned} assigned`} icon={<CheckCircle2 className="size-4" />} tone="mint" />
        <StatCard label="Completed orders" value={formatNumber(m.completed)} sub={`${formatPercent(m.completion_rate)} of accepted`} icon={<ClipboardCheck className="size-4" />} tone="violet" />
        <StatCard label="Cancellations" value={formatNumber(m.cancelled)} sub={`${m.declined} declined by vendors`} icon={<XCircle className="size-4" />} tone="rose" />
        <StatCard label="Median response" value={formatDuration(m.median_response_minutes)} sub={`Sample of ${m.response_sample}`} icon={<Timer className="size-4" />} tone="sky" />
        <StatCard label="Category coverage" value={`${m.categories_covered}/${m.categories_total}`} sub={`${formatNumber(m.searches)} searches`} icon={<LayoutGrid className="size-4" />} />
        <StatCard label="Platform revenue" value={formatINR(money.revenue)} sub={`On ${formatINR(m.gmv)} order value`} icon={<IndianRupee className="size-4" />} tone="gold" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <section data-reveal className="card p-5">
          <h2 className="font-sans text-base font-semibold">Enquiry funnel trend</h2>
          <div className="mt-4"><LineTrend data={m.series} keys={[{ key: "leads", label: "Enquiries", color: "#D9A441" }, { key: "accepted", label: "Accepted", color: "#004B4B" }, { key: "completed", label: "Completed", color: "#2E8B7A" }]} /></div>
        </section>
        <section data-reveal className="card p-5">
          <h2 className="font-sans text-base font-semibold">Enquiry outcomes</h2>
          <div className="mt-4"><Donut data={statusData} height={180} centerValue={formatNumber(m.leads)} centerLabel="enquiries" /></div>
          <div className="mt-5 rounded-2xl bg-cream p-4 text-sm">
            <p className="flex items-center justify-between"><span>Rating across providers</span><strong>{m.rating_avg ? `${Number(m.rating_avg).toFixed(2)} ★` : "—"}</strong></p>
            <p className="mt-1 flex items-center justify-between"><span>Enquiry → order conversion</span><strong>{formatPercent(m.conversion_rate)}</strong></p>
          </div>
        </section>
      </div>

      <div className="mt-6 grid gap-6 2xl:grid-cols-2">
        <section data-reveal className="card overflow-hidden">
          <div className="flex items-center justify-between p-5"><h2 className="font-sans text-base font-semibold">Top performing vendors</h2><a href={`/api/export/vendors?range=${preset}`} className="inline-flex items-center gap-1 text-sm font-semibold text-teal"><Download className="size-4" />CSV</a></div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead className="bg-cream text-left text-xs uppercase tracking-wider text-slate"><tr><th className="px-5 py-2.5">Vendor</th><th className="px-3 py-2.5 text-right">Views</th><th className="px-3 py-2.5 text-right">Leads</th><th className="px-3 py-2.5 text-right">Booked</th><th className="px-5 py-2.5 text-right">Value</th></tr></thead>
              <tbody className="divide-y divide-line">
                {m.top_vendors.slice(0, 8).map((v, i) => (
                  <tr key={v.id}><td className="px-5 py-2.5"><span className="mr-2 inline-flex size-6 items-center justify-center rounded-full bg-gold-pale text-xs font-bold text-teal">{i + 1}</span><Link href={`/admin/vendors/${v.id}`} className="font-semibold hover:text-teal">{v.name}</Link></td>
                    <td className="px-3 py-2.5 text-right">{formatNumber(v.views)}</td><td className="px-3 py-2.5 text-right">{v.leads}</td><td className="px-3 py-2.5 text-right">{v.accepted}</td><td className="px-5 py-2.5 text-right font-semibold">{formatINR(v.value)}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        <section data-reveal className="card overflow-hidden">
          <div className="flex items-center justify-between p-5"><h2 className="font-sans text-base font-semibold">Service category performance</h2><a href={`/api/export/categories?range=${preset}`} className="inline-flex items-center gap-1 text-sm font-semibold text-teal"><Download className="size-4" />CSV</a></div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-sm">
              <thead className="bg-cream text-left text-xs uppercase tracking-wider text-slate"><tr><th className="px-5 py-2.5">Category</th><th className="px-3 py-2.5 text-right">Vendors</th><th className="px-3 py-2.5 text-right">Leads</th><th className="px-3 py-2.5 text-right">Accepted</th><th className="px-5 py-2.5 text-right">Completed</th></tr></thead>
              <tbody className="divide-y divide-line">
                {m.by_category.map((c) => (
                  <tr key={c.id}><td className="px-5 py-2.5 font-semibold">{c.name}</td><td className="px-3 py-2.5 text-right">{c.vendors}</td><td className="px-3 py-2.5 text-right">{c.leads}</td><td className="px-3 py-2.5 text-right">{c.accepted}</td><td className="px-5 py-2.5 text-right">{c.completed}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_1fr]">
        <section data-reveal className="card p-5">
          <div className="flex items-center justify-between"><h2 className="flex items-center gap-2 font-sans text-base font-semibold"><Rocket className="size-5 text-gold-600" />Vendors needing a boost</h2><Link href="/admin/boost" className="text-sm font-semibold text-teal">View all →</Link></div>
          <ul className="mt-3 divide-y divide-line">
            {boost.slice(0, 5).map((b) => (
              <li key={b.vendor_id + b.rule} className="flex items-start gap-3 py-3">
                <Badge tone={b.severity === "risk" ? "danger" : b.severity === "improve" ? "gold" : "teal"}>{b.rule.replace(/_/g, " ")}</Badge>
                <div className="min-w-0 flex-1"><p className="text-sm font-semibold">{b.vendor_name}</p><p className="text-xs text-slate">{b.reason}</p></div>
              </li>
            ))}
          </ul>
        </section>
        <section data-reveal className="card p-5">
          <div className="flex items-center justify-between"><h2 className="font-sans text-base font-semibold">Financial summary</h2><Link href="/admin/commercial" className="text-sm font-semibold text-teal">P&amp;L →</Link></div>
          <dl className="mt-4 space-y-2.5 text-sm">
            <Row label="Total order value (vendor GMV)" value={formatINR(money.gmv)} muted />
            <Row label="Platform revenue (fees & commission)" value={formatINR(money.revenue)} />
            <Row label="Direct costs" value={`– ${formatINR(money.direct_costs)}`} />
            <Row label="Contribution" value={formatINR(money.contribution)} strong />
            <Row label="Operating costs" value={`– ${formatINR(money.operating_costs)}`} />
            <Row label="Net profit (estimated)" value={formatINR(money.operating_result)} strong tone={money.operating_result < 0 ? "danger" : "success"} />
          </dl>
          <p className="mt-3 text-xs text-slate">Revenue counts only fees actually earned/recorded — never total vendor order value.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <a href={`/api/export/orders?range=${preset}`} className="inline-flex h-9 items-center gap-1.5 rounded-full border border-line px-3 text-sm font-semibold hover:border-teal/40"><Download className="size-4" />Orders</a>
            <a href={`/api/export/enquiries?range=${preset}`} className="inline-flex h-9 items-center gap-1.5 rounded-full border border-line px-3 text-sm font-semibold hover:border-teal/40"><Download className="size-4" />Enquiries</a>
            <a href={`/api/export/ledger?range=${preset}`} className="inline-flex h-9 items-center gap-1.5 rounded-full border border-line px-3 text-sm font-semibold hover:border-teal/40"><Download className="size-4" />Ledger</a>
            <Link href="/admin/enquiries" className="inline-flex h-9 items-center gap-1 rounded-full bg-teal px-3 text-sm font-semibold text-white">Open queue <ArrowRight className="size-4" /></Link>
          </div>
        </section>
      </div>
      <div className="mt-4"><DataFreshness generatedAt={m.generated_at} label={`${range.from} to ${range.to}${cat ? ` · ${cat.name}` : ""}${sp.locality ? ` · ${sp.locality}` : ""}`} sample /></div>
    </>
  );
}

function Row({ label, value, strong, muted, tone }: { label: string; value: string; strong?: boolean; muted?: boolean; tone?: "danger" | "success" }) {
  return (
    <div className={`flex items-center justify-between ${strong ? "border-t border-line pt-2.5 font-semibold" : ""} ${muted ? "text-slate" : ""}`}>
      <dt>{label}</dt><dd className={tone === "danger" ? "text-danger" : tone === "success" ? "text-success" : ""}>{value}</dd>
    </div>
  );
}
