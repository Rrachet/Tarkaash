import type { Metadata } from "next";
import Link from "next/link";
import { Inbox, Heart, BellRing, LogOut, Hash, CalendarDays } from "lucide-react";
import { requireViewer } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/lib/actions/auth";
import { StatusBadge } from "@/components/ui/badge";
import { Avatar, EmptyState } from "@/components/ui/misc";
import { ButtonLink } from "@/components/ui/button";
import { ENQUIRY_STATUS, ORDER_STATUS, ORDER_STEPS, ORDER_STEP_LABELS } from "@/lib/status";
import { formatDate, formatINR, timeAgo } from "@/lib/format";
import { ReviewButton } from "@/components/account/review-button";
import { cn } from "@/lib/cn";

export const metadata: Metadata = { title: "My account" };

export default async function AccountPage() {
  const viewer = await requireViewer("/account");
  const supabase = await createClient();
  const [{ data: enquiries }, { data: likes }, { data: follows }, { data: myReviews }] = await Promise.all([
    supabase.from("enquiries")
      .select("id, ref_code, status, request, preferred_date, created_at, details, services(title), requested:vendors!enquiries_requested_vendor_id_fkey(name, slug, avatar_url), orders(id, ref_code, status, agreed_amount, scheduled_for, vendors(name, slug))")
      .order("created_at", { ascending: false }).limit(50),
    supabase.from("likes").select("vendors(id, name, slug, tagline, avatar_url)").eq("user_id", viewer.id),
    supabase.from("follows").select("vendors(id, name, slug, tagline, avatar_url)").eq("user_id", viewer.id),
    supabase.from("reviews").select("order_id").eq("user_id", viewer.id),
  ]);
  const reviewed = new Set((myReviews ?? []).map((r) => r.order_id));

  return (
    <div className="container-page py-10 sm:py-14">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar name={viewer.name ?? viewer.email} size={64} />
          <div>
            <p className="eyebrow">My account</p>
            <h1 className="text-3xl font-semibold sm:text-4xl">Namaste, {viewer.name?.split(" ")[0] ?? "there"}</h1>
            <p className="text-sm text-slate">{viewer.email}</p>
          </div>
        </div>
        <form action={signOut}><button className="inline-flex h-11 items-center gap-2 rounded-full border border-line bg-white px-4 text-sm font-semibold hover:border-teal/40"><LogOut className="size-4" />Sign out</button></form>
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_340px]">
        <section>
          <h2 className="flex items-center gap-2 text-2xl font-semibold"><Inbox className="size-6 text-gold-600" />My enquiries</h2>
          {!enquiries?.length ? (
            <EmptyState className="mt-4" icon={<Inbox className="size-6" />} title="No enquiries yet" action={<ButtonLink href="/services">Explore services</ButtonLink>}>
              When you enquire through Tarkaash, you can track every step here.
            </EmptyState>
          ) : (
            <ul className="mt-4 space-y-4">
              {enquiries.map((e) => {
                const order = e.orders?.find((o) => o.status !== "declined") ?? null;
                const stepIndex = order ? ORDER_STEPS.indexOf(order.status as (typeof ORDER_STEPS)[number]) : -1;
                const vendor = order?.vendors ?? e.requested;
                return (
                  <li key={e.id} className="card p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <Avatar src={e.requested?.avatar_url} name={vendor?.name} size={44} />
                        <div>
                          <p className="font-semibold">{e.services?.title ?? "Custom request"}{vendor && <span className="font-normal text-slate"> · {vendor.name}</span>}</p>
                          <p className="flex flex-wrap items-center gap-x-3 text-xs text-slate">
                            <span className="inline-flex items-center gap-1 font-mono"><Hash className="size-3" />{e.ref_code}</span>
                            <span>{timeAgo(e.created_at)}</span>
                            {e.preferred_date && <span className="inline-flex items-center gap-1"><CalendarDays className="size-3" />{formatDate(e.preferred_date)}</span>}
                          </p>
                        </div>
                      </div>
                      {order ? <StatusBadge map={ORDER_STATUS} status={order.status} /> : <StatusBadge map={ENQUIRY_STATUS} status={e.status} />}
                    </div>
                    <p className="mt-3 line-clamp-2 text-sm text-ink/80">{e.request}</p>
                    {stepIndex >= 0 && (
                      <ol className="mt-4 grid grid-cols-7 gap-1" aria-label="Order progress">
                        {ORDER_STEPS.map((s, i) => (
                          <li key={s} className="text-center">
                            <span className={cn("block h-1.5 rounded-full", i <= stepIndex ? "bg-teal" : "bg-cream-200")} />
                            <span className={cn("mt-1 hidden text-[10px] sm:block", i <= stepIndex ? "font-semibold text-teal" : "text-slate")}>{ORDER_STEP_LABELS[s]}</span>
                          </li>
                        ))}
                      </ol>
                    )}
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3 text-sm">
                      <span className="text-slate">{order?.agreed_amount ? <>Agreed price <strong className="text-ink">{formatINR(order.agreed_amount)}</strong></> : e.status === "new" ? "Tarkaash is reviewing your request" : "Awaiting price confirmation"}</span>
                      <div className="flex items-center gap-3">
                        {vendor?.slug && <Link href={`/vendors/${vendor.slug}`} className="font-semibold text-teal hover:underline">View provider</Link>}
                        {order && ["completed", "payment_recorded", "submitted", "closed"].includes(order.status) && !reviewed.has(order.id) && (
                          <ReviewButton orderId={order.id} vendorName={vendor?.name ?? "the provider"} />
                        )}
                        {order && reviewed.has(order.id) && <span className="text-xs font-semibold text-success">Reviewed ✓</span>}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <aside className="space-y-6">
          <SavedList title="Saved providers" icon={<Heart className="size-5 text-gold-600" />} items={(likes ?? []).map((l) => l.vendors).filter(Boolean) as VendorMini[]} empty="Tap the heart on a profile to save it." />
          <SavedList title="Following for updates" icon={<BellRing className="size-5 text-gold-600" />} items={(follows ?? []).map((l) => l.vendors).filter(Boolean) as VendorMini[]} empty="Follow providers to hear about new offers." />
        </aside>
      </div>
    </div>
  );
}

type VendorMini = { id: string; name: string; slug: string; tagline: string | null; avatar_url: string | null };

function SavedList({ title, icon, items, empty }: { title: string; icon: React.ReactNode; items: VendorMini[]; empty: string }) {
  return (
    <div className="card p-5">
      <h2 className="flex items-center gap-2 font-sans text-base font-semibold">{icon}{title}</h2>
      {items.length ? (
        <ul className="mt-3 divide-y divide-line">
          {items.map((v) => (
            <li key={v.id}><Link href={`/vendors/${v.slug}`} className="flex items-center gap-3 py-3 hover:text-teal">
              <Avatar src={v.avatar_url} name={v.name} size={40} />
              <span className="min-w-0"><span className="block truncate text-sm font-semibold">{v.name}</span><span className="block truncate text-xs text-slate">{v.tagline}</span></span>
            </Link></li>
          ))}
        </ul>
      ) : <p className="mt-2 text-sm text-slate">{empty}</p>}
    </div>
  );
}
