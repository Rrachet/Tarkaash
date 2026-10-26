"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu, X, ArrowRight, Search, User, LayoutDashboard } from "lucide-react";
import { buttonClass } from "@/components/ui/button";
import { cn } from "@/lib/cn";

/**
 * Mobile and tablet navigation. The panel is portalled to <body>: the sticky header uses
 * backdrop-filter, which would otherwise trap a position:fixed child inside the header box.
 */
const noopSubscribe = () => () => {};

export function MobileMenu({ items, signedIn, portal }: { items: { href: string; label: string }[]; signedIn: boolean; portal: string | null }) {
  const [open, setOpen] = useState(false);
  // true only in the browser, so the portal never renders during SSR
  const mounted = useSyncExternalStore(noopSubscribe, () => true, () => false);
  const path = usePathname();
  const [lastPath, setLastPath] = useState(path);
  const closeRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  if (path !== lastPath) { setLastPath(path); setOpen(false); }

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    const trigger = triggerRef.current;
    return () => { document.body.style.overflow = prev; window.removeEventListener("keydown", onKey); trigger?.focus(); };
  }, [open]);

  const account = portal ?? (signedIn ? "/account" : "/login");
  const panel = (
    <div id="mobile-nav" role="dialog" aria-modal="true" aria-label="Menu"
      className={cn("fixed inset-0 z-[100] flex flex-col bg-teal-deep text-white lg:hidden",
        "transition-[opacity,visibility] duration-300", open ? "visible opacity-100" : "invisible opacity-0")}>
      <div className="pattern-jaali pointer-events-none absolute inset-0 opacity-25" aria-hidden />
      <div className="relative flex h-[76px] shrink-0 items-center justify-between border-b border-white/10 px-4 sm:px-6">
        <Link href="/" onClick={() => setOpen(false)} className="inline-flex h-[54px]" aria-label="Tarkaash home">
          <Image src="/brand/tarkaash-logo-gold.webp" alt="Tarkaash" width={900} height={440} className="h-full w-auto" />
        </Link>
        <button ref={closeRef} type="button" onClick={() => setOpen(false)} aria-label="Close menu"
          className="flex size-11 items-center justify-center rounded-full text-white hover:bg-white/10">
          <X className="size-6" />
        </button>
      </div>
      <nav aria-label="Mobile" className="relative flex-1 overflow-y-auto px-4 pb-6 pt-2 sm:px-6">
        <ul>
          {items.map((i, n) => {
            const active = i.href === "/" ? path === "/" : path.startsWith(i.href);
            return (
              <li key={i.href} style={{ animationDelay: open ? `${60 + n * 45}ms` : undefined }} className={cn(open && "animate-fade-up")}>
                <Link href={i.href} onClick={() => setOpen(false)} aria-current={active ? "page" : undefined}
                  className={cn("flex min-h-14 items-center justify-between border-b border-white/10 font-display text-2xl transition-colors",
                    active ? "text-gold" : "text-white hover:text-gold")}>
                  {i.label}<ArrowRight className="size-5 opacity-50" aria-hidden />
                </Link>
              </li>
            );
          })}
        </ul>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <Link href="/services" onClick={() => setOpen(false)} className={buttonClass("light", "lg", "w-full")}><Search className="size-4" />Search services</Link>
          <Link href={account} onClick={() => setOpen(false)} className={buttonClass("light", "lg", "w-full")}>
            {portal ? <><LayoutDashboard className="size-4" />My dashboard</> : signedIn ? <><User className="size-4" />My account</> : <><User className="size-4" />Sign in</>}
          </Link>
        </div>
      </nav>
      <div className="relative shrink-0 border-t border-white/10 px-4 py-4 sm:px-6" style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}>
        <Link href="/list-your-service" onClick={() => setOpen(false)} className={buttonClass("gold", "lg", "w-full")}>List Your Service</Link>
      </div>
    </div>
  );

  return (
    <div className="lg:hidden">
      <button ref={triggerRef} type="button" onClick={() => setOpen(true)} aria-expanded={open} aria-controls="mobile-nav" aria-label="Open menu"
        className="flex size-11 items-center justify-center rounded-full text-white hover:bg-white/10">
        <Menu className="size-6" />
      </button>
      {mounted && createPortal(panel, document.body)}
    </div>
  );
}
