import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getVendorMetrics } from "@/lib/analytics";
import { getPublicSettings } from "@/lib/data/public";
import { resolveRange } from "@/lib/dates";
import { VENDOR_STATUS } from "@/lib/status";
import { StatusBadge } from "@/components/ui/badge";
import { Avatar, StatCard } from "@/components/ui/misc";
import { VendorAdminControls } from "@/components/admin/vendor-controls";
import { formatDuration, formatINR, formatNumber, formatPercent, priceLabel } from "@/lib/format";

export const metadata: Metadata = { title: "Vendor" };

export default async function AdminVendorDetail({ params }: { params: Promise<{ id: string }> }) {
  const viewer = await requireRole(["admin", "finance"], "/admin");
  const { id } = await params;
  const supabase = await createClient();
  const { data: v } = await supabase.from("vendors").select("*, categories:primary_category_id(name)").eq("id", id).maybeSingle();
  if (!v) notFound();
  const range = resolveRange({ range: "30d" });
  const [{ data: services }, settings, m, { data: tickets }] = await Promise.all([
    supabase.from("services").select("id, title, price_type, price_amount, price_unit, active").eq("vendor_id", id).order("sort"),
    getPublicSettings(),
    getVendorMetrics(id, range.from, range.to),
    supabase.from("support_tickets").select("ref_code, message, created_at, details").eq("linked_id", id).limit(3),
  ]);
  return (
    <>
      <Link href="/admin/vendors" className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-teal hover:underline"><ArrowLeft className="size-4" />All vendors</Link>
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <Avatar src={v.avatar_url} name={v.name} size={72} className="ring-2 ring-gold" />
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-3"><h1 className="text-3xl font-semibold">{v.name}</h1><StatusBadge map={VENDOR_STATUS} status={v.status} /></div>
          <p className="text-sm text-slate">{v.categories?.name} · {v.locality}, {v.city} · {v.tagline}</p>
        </div>
        {v.status === "active" && <Link href={`/vendors/${v.slug}`} className="inline-flex h-10 items-center gap-1.5 rounded-full border border-line bg-white px-4 text-sm font-semibold"><ExternalLink className="size-4" />Public profile</Link>}
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Views (30d)" value={formatNumber(m.profile_views)} />
        <StatCard label="Acceptance" value={formatPercent(m.acceptance_rate)} sub={`${m.accepted} of ${m.assigned} assigned`} />
        <StatCard label="Median response" value={formatDuration(m.median_response_minutes)} sub={`n = ${m.response_sample}`} />
        <StatCard label="Completed value" value={formatINR(m.order_value)} sub={`${m.cancelled} cancelled`} />
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <section data-reveal className="card p-5">
            <h2 className="font-sans text-base font-semibold">About</h2>
            <p className="mt-2 text-sm leading-relaxed">{v.description ?? "No description yet."}</p>
            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              <div><dt className="text-xs font-semibold uppercase text-slate">Service area</dt><dd>{v.service_area.join(", ") || "—"}</dd></div>
              <div><dt className="text-xs font-semibold uppercase text-slate">Listing strength</dt><dd>{m.completeness}%</dd></div>
              <div><dt className="text-xs font-semibold uppercase text-slate">Key terms</dt><dd>{v.key_terms ?? "—"}</dd></div>
              <div><dt className="text-xs font-semibold uppercase text-slate">Followers / likes</dt><dd>{m.followers_total} / {m.likes_total}</dd></div>
            </dl>
            {tickets?.length ? <p className="mt-4 rounded-xl bg-cream p-3 text-sm">Application {tickets[0]!.ref_code}: {tickets[0]!.message}</p> : null}
          </section>
          <section data-reveal className="card p-5">
            <h2 className="font-sans text-base font-semibold">Services ({services?.length ?? 0})</h2>
            <ul className="mt-3 divide-y divide-line text-sm">
              {(services ?? []).map((s) => <li key={s.id} className="flex justify-between py-2.5"><span className={s.active ? "" : "text-slate line-through"}>{s.title}</span><span className="font-semibold">{priceLabel(s)}</span></li>)}
            </ul>
          </section>
        </div>
        <VendorAdminControls vendorId={v.id} status={v.status} checks={(v.verification_checks ?? {}) as Record<string, boolean>} checkList={settings.verification.checks} canEdit={viewer.role === "admin"} />
      </div>
    </>
  );
}
