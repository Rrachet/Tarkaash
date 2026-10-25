import type { Metadata } from "next";
import { Users, Heart, BellRing } from "lucide-react";
import { requireVendor } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageTitle } from "@/components/portal/topbar";
import { StatCard } from "@/components/ui/misc";
import { PostUpdateForm } from "@/components/vendor-portal/post-update-form";
import { timeAgo } from "@/lib/format";

export const metadata: Metadata = { title: "Followers & updates" };

export default async function FollowersPage() {
  const { vendorId } = await requireVendor();
  const supabase = await createClient();
  const [followers, subscribers, likes, { data: updates }] = await Promise.all([
    supabase.from("follows").select("user_id", { count: "exact", head: true }).eq("vendor_id", vendorId),
    supabase.from("follows").select("user_id", { count: "exact", head: true }).eq("vendor_id", vendorId).eq("notify_updates", true),
    supabase.from("likes").select("user_id", { count: "exact", head: true }).eq("vendor_id", vendorId),
    supabase.from("vendor_updates").select("id, title, body, created_at").eq("vendor_id", vendorId).order("created_at", { ascending: false }),
  ]);
  return (
    <>
      <PageTitle title="Followers & updates">Share news, seasonal offers and availability with people who follow you.</PageTitle>
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <StatCard label="Followers" value={followers.count ?? 0} icon={<Users className="size-4" />} />
        <StatCard label="Update subscribers" value={subscribers.count ?? 0} icon={<BellRing className="size-4" />} tone="gold" />
        <StatCard label="Saved by customers" value={likes.count ?? 0} icon={<Heart className="size-4" />} tone="rose" />
      </div>
      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <PostUpdateForm vendorId={vendorId} />
        <section className="card p-5">
          <h2 className="font-sans text-base font-semibold">Your updates</h2>
          {updates?.length ? (
            <ul className="mt-3 divide-y divide-line">
              {updates.map((u) => <li key={u.id} className="py-3"><p className="font-semibold">{u.title}</p>{u.body && <p className="text-sm text-slate">{u.body}</p>}<p className="mt-1 text-xs text-slate">{timeAgo(u.created_at)}</p></li>)}
            </ul>
          ) : <p className="mt-2 text-sm text-slate">No updates yet.</p>}
        </section>
      </div>
    </>
  );
}
