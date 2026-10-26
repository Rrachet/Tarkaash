import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ExternalLink, Megaphone, Package, ImageIcon } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { getModerationQueue } from "@/lib/data/admin";
import { createClient } from "@/lib/supabase/server";
import { PageTitle } from "@/components/portal/topbar";
import { EmptyState } from "@/components/ui/misc";
import { StatusBadge } from "@/components/ui/badge";
import { ContentActions } from "@/components/admin/control-actions";
import { MODERATION_STATUS } from "@/lib/status";
import { sizedImage, timeAgo } from "@/lib/format";
import { cn } from "@/lib/cn";

export const metadata: Metadata = { title: "Content approval" };

const KINDS = [
  { key: "update", label: "Posts", icon: Megaphone },
  { key: "service", label: "Services", icon: Package },
  { key: "media", label: "Photos", icon: ImageIcon },
] as const;
const STATUSES = [
  { key: "pending", label: "Waiting" },
  { key: "rejected", label: "Not approved" },
  { key: "approved", label: "Approved" },
  { key: "all", label: "All" },
] as const;

export default async function ModerationPage({ searchParams }: { searchParams: Promise<{ kind?: string; status?: string }> }) {
  const viewer = await requireRole(["admin", "finance"], "/admin");
  const sp = await searchParams;
  const kind = (KINDS.find((k) => k.key === sp.kind)?.key ?? "update") as "service" | "update" | "media";
  const status = STATUSES.find((s) => s.key === sp.status)?.key ?? "pending";
  const supabase = await createClient();
  const [items, ...counts] = await Promise.all([
    getModerationQueue(kind, status),
    supabase.from("vendor_updates").select("id", { count: "exact", head: true }).eq("moderation", "pending"),
    supabase.from("services").select("id", { count: "exact", head: true }).eq("moderation", "pending"),
    supabase.from("vendor_media").select("id", { count: "exact", head: true }).eq("moderation", "pending"),
  ]);
  const pending: Record<string, number> = { update: counts[0]!.count ?? 0, service: counts[1]!.count ?? 0, media: counts[2]!.count ?? 0 };
  const readOnly = viewer.readOnly || viewer.role !== "admin";

  return (
    <>
      <PageTitle title="Content approval">
        New or edited vendor posts, services and photos wait here and appear publicly only after approval. Reject with a reason or delete anything inappropriate.
      </PageTitle>

      <div className="mb-4 flex flex-wrap gap-2" role="tablist" aria-label="Content type">
        {KINDS.map((k) => (
          <Link key={k.key} href={`/admin/moderation?kind=${k.key}&status=${status}`} role="tab" aria-selected={kind === k.key}
            className={cn("inline-flex h-10 items-center gap-2 rounded-full border px-4 text-sm font-semibold transition",
              kind === k.key ? "border-teal bg-teal text-white" : "border-line bg-white hover:border-teal/40")}>
            <k.icon className="size-4" />{k.label}
            {pending[k.key]! > 0 && <span className={cn("rounded-full px-2 text-[11px] font-bold", kind === k.key ? "bg-gold text-teal-deep" : "bg-gold-pale text-[#7a5210]")}>{pending[k.key]}</span>}
          </Link>
        ))}
      </div>
      <div className="mb-6 flex flex-wrap gap-1.5">
        {STATUSES.map((s) => (
          <Link key={s.key} href={`/admin/moderation?kind=${kind}&status=${s.key}`}
            className={cn("rounded-full px-3 py-1 text-xs font-semibold", status === s.key ? "bg-ink text-white" : "bg-cream-200 text-ink hover:bg-line")}>{s.label}</Link>
        ))}
      </div>

      {!items.length ? (
        <EmptyState title={status === "pending" ? "Nothing waiting for approval" : "Nothing here"}>
          {status === "pending" ? "When vendors add or edit content it will appear here." : "Try another filter."}
        </EmptyState>
      ) : (
        <ul className="grid gap-4 lg:grid-cols-2" data-stagger>
          {items.map((it) => (
            <li key={it.id} className="card flex flex-col gap-4 p-5 sm:flex-row">
              {it.image && (
                <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden rounded-xl bg-cream-200 sm:w-40">
                  <Image src={sizedImage(it.image, 400, 300)!} alt={it.title} fill unoptimized className="object-cover" sizes="160px" />
                </div>
              )}
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge map={MODERATION_STATUS} status={it.moderation} />
                  <span className="text-xs text-slate">{timeAgo(it.createdAt)}</span>
                </div>
                <p className="font-display text-lg font-semibold leading-snug">{it.title}</p>
                {it.extra && <p className="text-sm font-semibold text-teal">{it.extra}</p>}
                {it.body && <p className="line-clamp-4 whitespace-pre-line text-sm text-ink/85">{it.body}</p>}
                {it.note && <p className="rounded-lg bg-danger-soft px-3 py-2 text-xs text-danger">Reason given: {it.note}</p>}
                <p className="text-xs text-slate">
                  By <Link href={`/admin/vendors/${it.vendorId}`} className="font-semibold text-teal hover:underline">{it.vendorName}</Link>
                  {it.vendorSlug && <> · <Link href={`/vendors/${it.vendorSlug}`} className="inline-flex items-center gap-0.5 hover:underline">public page <ExternalLink className="size-3" /></Link></>}
                </p>
                <div className="mt-auto pt-2"><ContentActions kind={it.kind} id={it.id} status={it.moderation} readOnly={readOnly} /></div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
