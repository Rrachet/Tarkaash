import type { Metadata } from "next";
import Link from "next/link";
import { Eye, Users, Inbox, CheckCircle2, Heart, BellRing, IndianRupee, Timer, ArrowRight, AlertCircle, Sparkles } from "lucide-react";
import { requireVendor } from "@/lib/auth";
import { getVendorMetrics } from "@/lib/analytics";
import { getVendorOrders } from "@/lib/data/vendor";
import { resolveRange } from "@/lib/dates";
import { formatDuration, formatINR, formatNumber, formatPercent, timeAgo } from "@/lib/format";
import { ORDER_STATUS } from "@/lib/status";
import { StatCard, DataFreshness } from "@/components/ui/misc";
import { StatusBadge, SampleBadge } from "@/components/ui/badge";
import { AreaTrend, BarCompare, Donut } from "@/components/charts/charts";
import { RangeTabs } from "@/components/portal/range-tabs";
import { PageTitle } from "@/components/portal/topbar";
import { ButtonLink } from "@/components/ui/button";

export const metadata: Metadata = { title: "Dashboard" };

export default async function VendorDashboard({ searchParams }: { searchParams: Promise<{ range?: string }> }) {
  const { vendorId, name } = await requireVendor();
  const sp = await searchParams;
  const range = resolveRange(sp);
  const preset = sp.range && ["7d", "30d", "90d"].includes(sp.range) ? sp.range : "30d";
  const [m, recent] = await Promise.all([getVendorMetrics(vendorId, range.from, range.to), getVendorOrders(vendorId, "all", 1, 6)]);

  const sourceData = m.sources.map((s) => ({ name: s.source, value: s.count }));
  const topServices = m.top_services.slice(0, 5);
  const maxEnq = Math.max(1, ...topServices.map((s) => s.enquiries));

  return (
    <>
      <PageTitle title={`Welcome back${name ? `, ${name.split(" ")[0]}` : ""}`} actions={
        <div className="flex flex-wrap items-center gap-2">
          <RangeTabs base="/vendor" current={preset} />
          <a href={`/api/export/orders?range=${preset}`} className="h-10 rounded-full border border-line bg-white px-4 text-sm font-semibold leading-10 hover:border-teal/40">Download report</a>
        </div>
      }>
        See how your business is performing on Tarkaash — {range.label.toLowerCase()}. <SampleBadge className="ml-1 align-middle" />
      </PageTitle>

      {m.pending_response > 0 && (
        <Link href="/vendor/orders?filter=new" className="mb-6 flex items-center gap-4 rounded-2xl border border-gold/50 bg-gold-pale/60 p-4 transition hover:bg-gold-pale">
          <span className="flex size-11 items-center justify-center rounded-xl bg-gold text-teal-deep"><AlertCircle className="size-5" /></span>
          <div className="flex-1"><p className="font-semibold">{m.pending_response} new {m.pending_response === 1 ? "enquiry needs" : "enquiries need"} your response</p><p className="text-sm text-ink/70">Quick responses improve your visibility on Tarkaash.</p></div>
          <ArrowRight className="size-5 text-teal" />
        </Link>
      )}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-8">
        <StatCard className="xl:col-span-2" label="Profile views" value={formatNumber(m.profile_views)} sub={`${formatNumber(m.unique_viewers)} unique viewers`} icon={<Eye className="size-4" />} />
        <StatCard className="xl:col-span-2" label="Enquiries received" value={formatNumber(m.enquiries)} sub={`${formatPercent(m.conversion_rate)} became orders`} icon={<Inbox className="size-4" />} tone="gold" />
        <StatCard className="xl:col-span-2" label="Confirmed bookings" value={formatNumber(m.accepted)} sub={`${formatPercent(m.acceptance_rate)} of ${m.assigned} assigned accepted`} icon={<CheckCircle2 className="size-4" />} tone="mint" />
        <StatCard className="xl:col-span-2" label="Completed order value" value={formatINR(m.order_value)} sub={`${m.completed} completed · ${m.cancelled} cancelled`} icon={<IndianRupee className="size-4" />} tone="violet" />
        <StatCard className="xl:col-span-2" label="Median response" value={formatDuration(m.median_response_minutes)} sub={`Based on ${m.response_sample} responses`} icon={<Timer className="size-4" />} tone="sky" />
        <StatCard className="xl:col-span-2" label="Likes" value={formatNumber(m.likes_total)} sub={`+${m.likes_new} this period`} icon={<Heart className="size-4" />} tone="rose" />
        <StatCard className="xl:col-span-2" label="Followers" value={formatNumber(m.followers_total)} sub={`${m.update_subscribers} get your updates`} icon={<Users className="size-4" />} />
        <StatCard className="xl:col-span-2" label="Rating" value={m.rating_avg ? `${Number(m.rating_avg).toFixed(1)} ★` : "—"} sub={`${m.rating_count} approved reviews`} icon={<BellRing className="size-4" />} tone="gold" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <section data-reveal className="card p-5">
          <div className="flex items-center justify-between"><h2 className="font-sans text-base font-semibold">Profile views</h2><span className="text-sm text-slate">{formatNumber(m.profile_views)} total</span></div>
          <div className="mt-4"><AreaTrend data={m.series} keys={[{ key: "views", label: "Profile views" }]} /></div>
        </section>
        <section data-reveal className="card p-5">
          <h2 className="font-sans text-base font-semibold">Enquiries & bookings</h2>
          <div className="mt-4"><BarCompare data={m.series} keys={[{ key: "enquiries", label: "Enquiries" }, { key: "orders", label: "Bookings" }]} /></div>
        </section>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <section data-reveal className="card p-5">
          <h2 className="font-sans text-base font-semibold">How customers found you</h2>
          <div className="mt-4">{sourceData.length ? <Donut data={sourceData} height={170} centerValue={formatNumber(m.profile_views)} centerLabel="views" /> : <p className="text-sm text-slate">No views in this period.</p>}</div>
        </section>
        <section data-reveal className="card p-5">
          <h2 className="font-sans text-base font-semibold">Top performing services</h2>
          <ul className="mt-4 space-y-4">
            {topServices.map((s) => (
              <li key={s.id}>
                <div className="flex justify-between text-sm"><span className="font-medium">{s.title}</span><span className="text-slate">{s.enquiries} enq · {s.orders} booked</span></div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-cream-200"><div className="h-full rounded-full bg-teal" style={{ width: `${(s.enquiries / maxEnq) * 100}%` }} /></div>
              </li>
            ))}
          </ul>
        </section>
        <section data-reveal className="card flex flex-col p-5">
          <h2 className="font-sans text-base font-semibold">Listing strength</h2>
          <div className="mt-4 flex items-center gap-5">
            <div className="relative size-28 shrink-0 rounded-full" style={{ background: `conic-gradient(#D9A441 ${m.completeness * 3.6}deg, #F4EFE2 0)` }}>
              <div className="absolute inset-3 flex items-center justify-center rounded-full bg-white font-display text-2xl font-semibold">{m.completeness}%</div>
            </div>
            <p className="text-sm text-slate">Complete profiles with photos, prices and service areas get more enquiries.</p>
          </div>
          <div className="mt-auto rounded-2xl bg-teal-deep p-4 text-white">
            <p className="flex items-center gap-2 font-semibold"><Sparkles className="size-4 text-gold" />Your business is growing</p>
            <p className="mt-1 text-sm text-white/75">{m.completed} orders completed and {formatINR(m.payments_recorded)} recorded through Tarkaash this period.</p>
          </div>
        </section>
      </div>

      <section data-reveal className="card mt-6 overflow-hidden">
        <div className="flex items-center justify-between p-5">
          <h2 className="font-sans text-base font-semibold">Recent orders</h2>
          <ButtonLink href="/vendor/orders" variant="ghost" size="sm">View all <ArrowRight className="size-4" /></ButtonLink>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-cream text-left text-xs uppercase tracking-wider text-slate">
              <tr><th className="px-5 py-3 font-semibold">Order</th><th className="px-5 py-3 font-semibold">Service</th><th className="px-5 py-3 font-semibold">Customer</th><th className="px-5 py-3 font-semibold">Amount</th><th className="px-5 py-3 font-semibold">Status</th><th className="px-5 py-3 font-semibold">Received</th></tr>
            </thead>
            <tbody className="divide-y divide-line">
              {recent.orders.map((o) => (
                <tr key={o.id} className="hover:bg-cream/60">
                  <td className="px-5 py-3"><Link href={`/vendor/orders/${o.id}`} className="font-mono font-semibold text-teal hover:underline">{o.ref_code}</Link></td>
                  <td className="px-5 py-3">{o.title}</td>
                  <td className="px-5 py-3">{o.customer_display_name}</td>
                  <td className="px-5 py-3">{formatINR(o.agreed_amount)}</td>
                  <td className="px-5 py-3"><StatusBadge map={ORDER_STATUS} status={o.status} /></td>
                  <td className="px-5 py-3 text-slate">{timeAgo(o.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <div className="mt-4"><DataFreshness generatedAt={m.generated_at} label={`${range.from} to ${range.to}`} sample /></div>
    </>
  );
}
