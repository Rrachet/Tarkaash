import type { Metadata } from "next";
import { Star } from "lucide-react";
import { requireVendor } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageTitle } from "@/components/portal/topbar";
import { RatingStars, EmptyState, StatCard } from "@/components/ui/misc";
import { Badge, SampleBadge } from "@/components/ui/badge";
import { timeAgo } from "@/lib/format";

export const metadata: Metadata = { title: "Customer reviews" };

export default async function VendorReviewsPage() {
  const { vendorId } = await requireVendor();
  const supabase = await createClient();
  const { data } = await supabase.from("reviews").select("id, author_name, rating, body, status, created_at, is_demo, orders(ref_code)").eq("vendor_id", vendorId).order("created_at", { ascending: false }).limit(100);
  const approved = (data ?? []).filter((r) => r.status === "approved");
  const avg = approved.length ? approved.reduce((s, r) => s + r.rating, 0) / approved.length : null;
  return (
    <>
      <PageTitle title="Customer reviews">Only customers with completed Tarkaash orders can review. Tarkaash moderates every review.</PageTitle>
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <StatCard label="Average rating" value={avg ? `${avg.toFixed(1)} ★` : "N/A"} icon={<Star className="size-4" />} tone="gold" />
        <StatCard label="Published reviews" value={approved.length} />
        <StatCard label="Awaiting moderation" value={(data ?? []).filter((r) => r.status === "pending").length} />
      </div>
      {!data?.length ? <EmptyState title="No reviews yet">Reviews appear after customers complete orders.</EmptyState> : (
        <ul className="grid gap-4 lg:grid-cols-2">
          {data.map((r) => (
            <li key={r.id} className="card p-5">
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold">{r.author_name} <span className="font-mono text-xs font-normal text-slate">· {r.orders?.ref_code}</span></p>
                <RatingStars value={r.rating} />
              </div>
              {r.body && <p className="mt-2 text-sm text-ink/85">{r.body}</p>}
              <div className="mt-3 flex items-center gap-2 text-xs text-slate">{timeAgo(r.created_at)}
                {r.status !== "approved" && <Badge tone={r.status === "pending" ? "gold" : "danger"}>{r.status === "pending" ? "In moderation" : "Not published"}</Badge>}
                {r.is_demo && <SampleBadge />}
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
