import type { Metadata } from "next";
import Link from "next/link";
import { BadgeCheck } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { VENDOR_STATUS } from "@/lib/status";
import { StatusBadge, Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/misc";
import { PageTitle } from "@/components/portal/topbar";
import { timeAgo } from "@/lib/format";
import { cn } from "@/lib/cn";

export const metadata: Metadata = { title: "Vendors" };

export default async function AdminVendors({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  await requireRole(["admin", "finance"], "/admin");
  const sp = await searchParams;
  const supabase = await createClient();
  let q = supabase.from("vendors").select("id, name, slug, locality, status, verification, avatar_url, created_at, categories:primary_category_id(name)").order("status").order("name");
  if (sp.status) q = q.eq("status", sp.status as never);
  const { data } = await q;
  return (
    <>
      <PageTitle title="Vendors">Approve new providers, manage listing status and complete verification checks.</PageTitle>
      <div className="mb-5 flex gap-2 overflow-x-auto">
        {[["", "All"], ["pending", "Pending review"], ["active", "Live"], ["paused", "Paused"], ["rejected", "Rejected"]].map(([k, l]) => (
          <Link key={k} href={k ? `/admin/vendors?status=${k}` : "/admin/vendors"} className={cn("inline-flex min-h-10 shrink-0 items-center rounded-full border px-4 text-sm font-semibold", (sp.status ?? "") === k ? "border-teal bg-teal text-white" : "border-line bg-white")}>{l}</Link>
        ))}
      </div>
      <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
        {(data ?? []).map((v) => (
          <Link key={v.id} href={`/admin/vendors/${v.id}`} className="card flex items-center gap-4 p-4 transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)]">
            <Avatar src={v.avatar_url} name={v.name} size={52} />
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">{v.name}</p>
              <p className="truncate text-sm text-slate">{v.categories?.name} · {v.locality}</p>
              <div className="mt-1.5 flex flex-wrap gap-1.5"><StatusBadge map={VENDOR_STATUS} status={v.status} />
                {v.verification === "verified" ? <Badge tone="mint"><BadgeCheck className="size-3" />Verified</Badge> : v.verification === "pending" ? <Badge tone="gold">Checks in progress</Badge> : null}
              </div>
            </div>
            <span className="text-xs text-slate">{timeAgo(v.created_at)}</span>
          </Link>
        ))}
      </div>
    </>
  );
}
