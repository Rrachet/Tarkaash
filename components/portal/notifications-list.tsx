"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck } from "lucide-react";
import { markNotificationsRead } from "@/lib/actions/vendor";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/misc";
import { timeAgo } from "@/lib/format";
import { cn } from "@/lib/cn";

export function NotificationsList({ items }: { items: { id: string; title: string; body: string | null; link: string | null; read_at: string | null; created_at: string }[] }) {
  const [pending, start] = useTransition();
  const router = useRouter();
  const unread = items.filter((i) => !i.read_at).length;
  if (!items.length) return <EmptyState icon={<Bell className="size-6" />} title="You're all caught up" />;
  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between border-b border-line px-5 py-3">
        <p className="text-sm text-slate">{unread} unread</p>
        {unread > 0 && <Button size="sm" variant="ghost" loading={pending} onClick={() => start(async () => { await markNotificationsRead(); router.refresh(); })}><CheckCheck className="size-4" />Mark all read</Button>}
      </div>
      <ul className="divide-y divide-line">
        {items.map((n) => (
          <li key={n.id}>
            <Link href={n.link ?? "#"} onClick={() => !n.read_at && markNotificationsRead([n.id])} className={cn("flex gap-3 px-5 py-4 hover:bg-cream/60", !n.read_at && "bg-gold-pale/25")}>
              <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", n.read_at ? "bg-transparent" : "bg-gold")} />
              <span className="flex-1"><span className="block text-sm font-semibold">{n.title}</span>{n.body && <span className="block text-sm text-slate">{n.body}</span>}</span>
              <span className="shrink-0 text-xs text-slate">{timeAgo(n.created_at)}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
