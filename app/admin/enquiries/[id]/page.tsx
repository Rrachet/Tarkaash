import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Phone, Mail, CalendarDays, MapPin, Gift, Clock } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { getEnquiryDetail } from "@/lib/data/admin";
import { ENQUIRY_STATUS, ORDER_STATUS } from "@/lib/status";
import { formatDate, formatDateTime, formatINR, priceLabel } from "@/lib/format";
import { StatusBadge, SampleBadge } from "@/components/ui/badge";
import { EnquiryAdminActions } from "@/components/admin/enquiry-actions";

export const metadata: Metadata = { title: "Enquiry" };

const ACTION_LABEL: Record<string, string> = { created: "Enquiry submitted", assigned: "Assigned", accepted: "Accepted by vendor", returned: "Declined and returned to queue", cancelled: "Cancelled", closed: "Closed", note: "Note", status_changed: "Status changed" };

export default async function EnquiryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const viewer = await requireRole(["admin", "finance"], "/admin");
  const { id } = await params;
  const data = await getEnquiryDetail(id);
  if (!data) notFound();
  const { enquiry: e, events, orders, vendors } = data;
  const details = Object.entries((e.details ?? {}) as Record<string, string | number>);
  const activeOrder = orders.find((o) => !["declined", "cancelled"].includes(o.status));

  return (
    <>
      <Link href="/admin/enquiries" className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-teal hover:underline"><ArrowLeft className="size-4" />Back to queue</Link>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <h1 className="font-mono text-3xl font-semibold">{e.ref_code}</h1>
        <StatusBadge map={ENQUIRY_STATUS} status={e.status} />
        {e.is_demo && <SampleBadge />}
        <span className="text-sm text-slate">Received {formatDateTime(e.created_at)} via {e.source.replace("_", " ")}</span>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <section data-reveal className="card p-5">
            <h2 className="font-sans text-base font-semibold">Request</h2>
            <p className="mt-1 text-sm text-slate">{e.services ? <>{e.services.title} · {priceLabel(e.services)}</> : e.categories?.name ?? "General"} {e.requested && <>· requested <Link href={`/vendors/${e.requested.slug}`} className="font-semibold text-teal hover:underline">{e.requested.name}</Link></>}</p>
            <blockquote className="mt-4 rounded-xl border-l-4 border-gold bg-cream px-4 py-3 text-sm leading-relaxed">{e.request}</blockquote>
            <div className="mt-4 flex flex-wrap gap-2 text-xs">
              {e.preferred_date && <span className="inline-flex items-center gap-1 rounded-full bg-cream-200 px-3 py-1"><CalendarDays className="size-3.5" />{formatDate(e.preferred_date)}{e.preferred_time ? ` · ${e.preferred_time}` : ""}</span>}
              {e.locality && <span className="inline-flex items-center gap-1 rounded-full bg-cream-200 px-3 py-1"><MapPin className="size-3.5" />{e.locality}</span>}
              {details.map(([k, v]) => <span key={k} className="rounded-full bg-cream-200 px-3 py-1"><strong className="capitalize">{k.replace(/_/g, " ")}:</strong> {String(v)}</span>)}
              {e.assist_opt_in && <span className="inline-flex items-center gap-1 rounded-full bg-gold-pale px-3 py-1 font-semibold text-[#7a5210]"><Gift className="size-3.5" />Tarkaash Assist · {formatINR(e.assist_fee)}</span>}
            </div>
          </section>

          {orders.length > 0 && (
            <section data-reveal className="card p-5">
              <h2 className="font-sans text-base font-semibold">Orders</h2>
              <ul className="mt-3 divide-y divide-line">
                {orders.map((o) => (
                  <li key={o.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                    <Link href={`/admin/orders/${o.id}`} className="font-mono font-semibold text-teal hover:underline">{o.ref_code}</Link>
                    <span>{o.vendors?.name}</span>
                    <StatusBadge map={ORDER_STATUS} status={o.status} />
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section data-reveal className="card p-5">
            <h2 className="font-sans text-base font-semibold">Timeline</h2>
            <ol className="relative mt-4 space-y-5 border-l-2 border-line pl-6">
              {events.map((ev) => (
                <li key={ev.id} className="relative">
                  <span className={`absolute -left-[31px] top-1 size-3.5 rounded-full border-2 border-white ${ev.action === "returned" ? "bg-danger" : ev.action === "note" ? "bg-gold" : "bg-teal"}`} />
                  <p className="text-sm font-semibold">{ACTION_LABEL[ev.action] ?? ev.action}{ev.vendors?.name && ev.action !== "created" ? <span className="font-normal text-slate"> · {ev.vendors.name}</span> : null}</p>
                  {ev.note && <p className="text-sm text-ink/80">{ev.note}</p>}
                  <p className="flex items-center gap-1 text-xs text-slate"><Clock className="size-3" />{formatDateTime(ev.created_at)}</p>
                </li>
              ))}
            </ol>
          </section>
        </div>

        <aside className="space-y-6">
          <section data-reveal className="card p-5">
            <h2 className="font-sans text-base font-semibold">Customer</h2>
            <p className="mt-2 font-semibold">{e.customers?.name}</p>
            {e.customers?.phone && <a href={`tel:${e.customers.phone}`} className="mt-1 flex items-center gap-2 text-sm text-teal hover:underline"><Phone className="size-4" />{e.customers.phone}</a>}
            {e.customers?.email && <a href={`mailto:${e.customers.email}`} className="mt-1 flex items-center gap-2 text-sm text-teal hover:underline"><Mail className="size-4" />{e.customers.email}</a>}
            <p className="mt-2 text-xs text-slate">Consent recorded {formatDateTime(e.customers?.consent_at)}</p>
          </section>
          <EnquiryAdminActions
            enquiryId={e.id} status={e.status} canEdit={viewer.role === "admin"} hasActiveOrder={!!activeOrder}
            suggestedVendorId={e.requested?.id} categoryId={e.categories?.id}
            vendors={vendors.map((v) => ({ id: v.id, name: v.name, locality: v.locality, categoryId: v.primary_category_id, verified: v.verification === "verified" }))}
          />
        </aside>
      </div>
    </>
  );
}
