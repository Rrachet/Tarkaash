import type { Metadata } from "next";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageTitle } from "@/components/portal/topbar";
import { RatingStars, EmptyState } from "@/components/ui/misc";
import { ModerateButtons } from "@/components/admin/small-actions";
import { timeAgo } from "@/lib/format";

export const metadata: Metadata = { title: "Review moderation" };

export default async function ReviewsModeration() {
  await requireRole(["admin", "finance"], "/admin");
  const supabase = await createClient();
  const { data } = await supabase.from("reviews").select("id, author_name, rating, body, status, created_at, vendors(name), orders(ref_code)").eq("status", "pending").order("created_at");
  return (
    <>
      <PageTitle title="Review moderation">Reviews come only from customers with completed orders. Approve genuine feedback; reject abuse or personal data.</PageTitle>
      {!data?.length ? <EmptyState title="Nothing to moderate">New reviews will appear here.</EmptyState> : (
        <ul className="grid gap-4 lg:grid-cols-2">
          {data.map((r) => (
            <li key={r.id} className="card p-5">
              <div className="flex items-center justify-between"><p className="font-semibold">{r.author_name} <span className="font-normal text-slate">on {r.vendors?.name}</span></p><RatingStars value={r.rating} /></div>
              <p className="mt-1 font-mono text-xs text-slate">{r.orders?.ref_code} · {timeAgo(r.created_at)}</p>
              {r.body && <p className="mt-3 text-sm">{r.body}</p>}
              <ModerateButtons id={r.id} />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
