"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Inbox, ClipboardList, Package, UserRound, Star, Users, Wallet, LifeBuoy, Bell, Store, ShieldCheck,
  TrendingUp, Receipt, MessageSquare, Settings, History, Rocket, BarChart3, Menu, X,
} from "lucide-react";
import { cn } from "@/lib/cn";

const ICONS = {
  dashboard: LayoutDashboard, inbox: Inbox, orders: ClipboardList, services: Package, profile: UserRound, reviews: Star,
  followers: Users, payouts: Wallet, support: LifeBuoy, bell: Bell, vendors: Store, shield: ShieldCheck, boost: Rocket,
  commercial: Receipt, tickets: MessageSquare, settings: Settings, audit: History, analytics: BarChart3, growth: TrendingUp,
} as const;
export type NavIcon = keyof typeof ICONS;
export type NavItem = { href: string; label: string; icon: NavIcon; badge?: number; exact?: boolean };

export function PortalSidebar({ items, header, footer }: { items: NavItem[]; header: React.ReactNode; footer?: React.ReactNode }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const [lastPath, setLastPath] = useState(path);
  if (path !== lastPath) { setLastPath(path); setOpen(false); }
  const nav = (
    <nav aria-label="Portal" className="flex flex-col gap-0.5 px-3">
      {items.map((i) => {
        const Icon = ICONS[i.icon];
        const active = i.exact ? path === i.href : path === i.href || path.startsWith(`${i.href}/`);
        return (
          <Link key={i.href} href={i.href} aria-current={active ? "page" : undefined}
            className={cn("flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition",
              active ? "bg-gold text-teal-deep shadow-sm" : "text-white/75 hover:bg-white/8 hover:text-white")}>
            <Icon className="size-[18px] shrink-0" />
            <span className="flex-1">{i.label}</span>
            {!!i.badge && <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-bold", active ? "bg-teal-deep text-gold" : "bg-gold text-teal-deep")}>{i.badge}</span>}
          </Link>
        );
      })}
    </nav>
  );
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} aria-label="Open navigation"
        className="fixed left-3 top-3 z-50 flex size-11 items-center justify-center rounded-full bg-teal-deep text-white shadow-lg lg:hidden">
        <Menu className="size-5" />
      </button>
      {open && <div className="fixed inset-0 z-40 bg-ink/50 lg:hidden" onClick={() => setOpen(false)} aria-hidden />}
      <aside className={cn("fixed inset-y-0 left-0 z-50 flex w-72 flex-col overflow-y-auto bg-teal-deep pb-6 text-white transition-transform lg:translate-x-0",
        open ? "translate-x-0" : "-translate-x-full")}>
        <button type="button" onClick={() => setOpen(false)} aria-label="Close navigation" className="absolute right-3 top-3 flex size-10 items-center justify-center rounded-full text-white/70 hover:bg-white/10 lg:hidden">
          <X className="size-5" />
        </button>
        {header}
        {nav}
        {footer && <div className="mt-auto px-3 pt-6">{footer}</div>}
      </aside>
    </>
  );
}
