import type { Metadata } from "next";
import Link from "next/link";
import { Rocket, TrendingDown, Timer, ShieldAlert, ImagePlus } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { getBoostQueue } from "@/lib/analytics";
import { resolveRange } from "@/lib/dates";
import { PageTitle } from "@/components/portal/topbar";
import { RangeTabs } from "@/components/portal/range-tabs";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/misc";

export const metadata: Metadata = { title: "Boost queue" };

const RULES = {
  low_exposure: { icon: Rocket, title: "Low exposure", tone: "teal" as const },
  low_conversion: { icon: TrendingDown, title: "High views, few enquiries", tone: "gold" as const },
  slow_response: { icon: Timer, title: "Slow response", tone: "danger" as const },
  quality_risk: { icon: ShieldAlert, title: "Cancellations / feedback", tone: "danger" as const },
  incomplete_listing: { icon: ImagePlus, title: "Incomplete listing", tone: "gold" as const },
};

export default async function BoostPage({ searchParams }: { searchParams: Promise<{ range?: string }> }) {
  await requireRole(["admin", "finance"], "/admin");
  const sp = await searchParams;
  const range = resolveRange(sp);
  const items = await getBoostQueue(range.from, range.to);
  return (
    <>
      <PageTitle title="Boost queue" actions={<RangeTabs base="/admin/boost" current={sp.range ?? "30d"} />}>
        Explainable flags from exposure, conversion, response and listing quality. Every suggestion shows why, what to do and the measured numbers — never a guarantee of leads.
      </PageTitle>
      {!items.length ? <EmptyState icon={<Rocket className="size-6" />} title="No vendors flagged">Everyone is performing within thresholds for this period.</EmptyState> : (
        <div className="grid gap-4 lg:grid-cols-2">
          {items.map((b) => {
            const r = RULES[b.rule];
            return (
              <article key={b.vendor_id + b.rule} className="card p-5">
                <div className="flex items-start gap-4">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-teal-deep text-gold"><r.icon className="size-5" /></span>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2"><Link href={`/admin/vendors/${b.vendor_id}`} className="font-semibold hover:text-teal">{b.vendor_name}</Link><Badge tone={r.tone}>{r.title}</Badge></div>
                    <p className="mt-2 text-sm"><span className="font-semibold">Why: </span>{b.reason}</p>
                    <p className="mt-1 text-sm"><span className="font-semibold">Recommended action: </span>{b.action}</p>
                    <dl className="mt-3 grid grid-cols-3 gap-2 text-center text-xs sm:grid-cols-6">
                      {[["Views", b.metrics.views], ["Enquiries", b.metrics.enquiries], ["Accepted", b.metrics.accepted], ["Cancelled", b.metrics.cancelled], ["Resp. (h)", b.metrics.median_response_hours], ["Listing", `${b.metrics.completeness}%`]].map(([l, v]) => (
                        <div key={String(l)} className="rounded-lg bg-cream px-2 py-1.5"><dt className="text-slate">{l}</dt><dd className="font-semibold">{v}</dd></div>
                      ))}
                    </dl>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </>
  );
}
