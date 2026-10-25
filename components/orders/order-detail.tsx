import Link from "next/link";
import { ArrowLeft, CalendarDays, MapPin, Hash, Gift, MessageSquareQuote, IndianRupee } from "lucide-react";
import { ORDER_STATUS } from "@/lib/status";
import { formatDate, formatDateTime, formatINR, formatSchedule, priceLabel } from "@/lib/format";
import { StatusBadge, SampleBadge } from "@/components/ui/badge";
import { OrderStepper } from "./order-stepper";
import { OrderActions, ContactReveal } from "./order-actions";

type Detail = NonNullable<Awaited<ReturnType<typeof import("@/lib/data/vendor").getVendorOrder>>>;

const DETAIL_LABELS: Record<string, string> = {
  destination: "Destination", travellers: "Travellers", nights: "Nights", quantity: "Quantity", meal_preference: "Meal preference",
  fulfilment: "Delivery / pickup", occasion: "Occasion", dietary: "Dietary",
};

export function OrderDetailView({ data, role, backHref }: { data: Detail; role: "vendor" | "admin"; backHref: string }) {
  const { order, history, payments } = data;
  const e = order.enquiries;
  const details = Object.entries((e?.details ?? {}) as Record<string, string | number>);
  return (
    <>
      <Link href={backHref} className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-teal hover:underline"><ArrowLeft className="size-4" />Back to orders</Link>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-mono text-3xl font-semibold">{order.ref_code}</h1>
            <StatusBadge map={ORDER_STATUS} status={order.status} />
            {order.is_demo && <SampleBadge />}
          </div>
          <p className="mt-1 text-sm text-slate">{order.title}{role === "admin" && order.vendors ? <> · <Link className="font-semibold text-teal hover:underline" href={`/vendors/${order.vendors.slug}`}>{order.vendors.name}</Link></> : null} · enquiry {e?.ref_code}</p>
        </div>
      </div>

      <OrderStepper status={order.status} history={history} />

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <section className="card p-5">
            <h2 className="font-sans text-base font-semibold">Customer request</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <Info icon={<MessageSquareQuote className="size-4" />} label="Customer" value={order.customer_display_name ?? "N/A"} />
              <Info icon={<CalendarDays className="size-4" />} label="Preferred date" value={e?.preferred_date ? `${formatDate(e.preferred_date)}${e.preferred_time ? ` · ${e.preferred_time}` : ""}` : "Flexible"} />
              <Info icon={<MapPin className="size-4" />} label="Locality" value={e?.locality ?? "N/A"} />
            </div>
            <blockquote className="mt-4 rounded-xl border-l-4 border-gold bg-cream px-4 py-3 text-sm leading-relaxed">{e?.request}</blockquote>
            {details.length > 0 && (
              <dl className="mt-4 flex flex-wrap gap-2">
                {details.map(([k, v]) => <div key={k} className="rounded-full bg-cream-200 px-3 py-1 text-xs"><dt className="inline font-semibold">{DETAIL_LABELS[k] ?? k}:</dt> <dd className="inline">{String(v)}</dd></div>)}
              </dl>
            )}
            {e?.assist_opt_in && <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-gold-pale px-3 py-1 text-xs font-semibold text-[#7a5210]"><Gift className="size-3.5" />Customer opted into Tarkaash Assist ({formatINR(e.assist_fee)})</p>}
          </section>

          <section className="card p-5">
            <h2 className="font-sans text-base font-semibold">Order details</h2>
            <dl className="mt-4 grid gap-4 sm:grid-cols-3">
              <Info icon={<IndianRupee className="size-4" />} label="Agreed price" value={formatINR(order.agreed_amount)} />
              <Info icon={<CalendarDays className="size-4" />} label="Scheduled" value={formatSchedule(order.scheduled_for)} />
              <Info icon={<Hash className="size-4" />} label="Listed price" value={order.services ? priceLabel(order.services) : "Custom"} />
            </dl>
            {order.scope && <p className="mt-4 text-sm"><span className="font-semibold">Scope: </span>{order.scope}</p>}
            {order.notes && <p className="mt-2 text-sm text-slate"><span className="font-semibold text-ink">Notes: </span>{order.notes}</p>}
          </section>

          {payments.length > 0 && (
            <section className="card p-5">
              <h2 className="font-sans text-base font-semibold">Payments</h2>
              <ul className="mt-3 divide-y divide-line text-sm">
                {payments.map((p) => (
                  <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                    <span className="font-semibold">{formatINR(p.amount)} <span className="font-normal uppercase text-slate">· {p.method.replace("_", " ")}</span></span>
                    <span className="font-mono text-xs text-slate">{p.transaction_ref ?? "N/A"}</span>
                    <span className="text-xs text-slate">{formatDateTime(p.created_at)} · <span className={p.status === "verified" ? "font-semibold text-success" : ""}>{p.status}</span></span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="card p-5">
            <h2 className="font-sans text-base font-semibold">Status history</h2>
            <ol className="relative mt-4 space-y-5 border-l-2 border-line pl-6">
              {history.map((h) => (
                <li key={h.id} className="relative">
                  <span className="absolute -left-[31px] top-1 size-3.5 rounded-full border-2 border-white bg-teal ring-2 ring-teal/20" />
                  <p className="text-sm"><span className="font-semibold">{ORDER_STATUS[h.to_status]?.label ?? h.to_status}</span> <span className="text-slate">by {h.actor_role === "admin" ? "Tarkaash" : "vendor"}</span></p>
                  {h.note && <p className="mt-0.5 text-sm text-ink/80">“{h.note}”</p>}
                  <p className="text-xs text-slate">{formatDateTime(h.created_at)}</p>
                </li>
              ))}
            </ol>
          </section>
        </div>

        <aside className="space-y-6">
          <OrderActions orderId={order.id} status={order.status} role={role} agreedAmount={order.agreed_amount} scheduledFor={order.scheduled_for} scope={order.scope} notes={order.notes} />
          <ContactReveal orderId={order.id} status={order.status} />
          <div className="rounded-2xl bg-teal-deep p-5 text-white">
            <p className="font-display text-lg font-semibold">Tarkaash order promise</p>
            <ul className="mt-3 space-y-2 text-sm text-white/80">
              <li>• One order record: enquiry, acceptance, delivery and payment in one place.</li>
              <li>• Clear completion trail, auditable with timestamps.</li>
              <li>• Support if something goes wrong.</li>
            </ul>
          </div>
        </aside>
      </div>
    </>
  );
}

function Info({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex gap-3">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-gold-pale text-teal">{icon}</span>
      <div><dt className="text-xs font-semibold uppercase tracking-wider text-slate">{label}</dt><dd className="text-sm font-medium">{value}</dd></div>
    </div>
  );
}
