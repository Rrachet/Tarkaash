"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { buttonClass } from "@/components/ui/button";

export function MobileMenu({ items, signedIn, portal }: { items: { href: string; label: string }[]; signedIn: boolean; portal: string | null }) {
  const [open, setOpen] = useState(false);
  const path = usePathname();
  useEffect(() => setOpen(false), [path]);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);
  return (
    <div className="lg:hidden">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-controls="mobile-nav" aria-label={open ? "Close menu" : "Open menu"}
        className="flex size-11 items-center justify-center rounded-full text-white hover:bg-white/10">
        {open ? <X className="size-6" /> : <Menu className="size-6" />}
      </button>
      {open && (
        <div id="mobile-nav" className="fixed inset-x-0 top-[76px] bottom-0 z-50 overflow-y-auto bg-teal-deep px-4 pb-10 pt-4 animate-fade-in">
          <nav aria-label="Mobile" className="flex flex-col">
            {items.map((i) => (
              <Link key={i.href} href={i.href} className="border-b border-white/10 py-4 font-display text-xl text-white">{i.label}</Link>
            ))}
            <Link href={portal ?? (signedIn ? "/account" : "/login")} className="border-b border-white/10 py-4 font-display text-xl text-white">
              {portal ? "My dashboard" : signedIn ? "My account" : "Sign in"}
            </Link>
          </nav>
          <Link href="/list-your-service" className={buttonClass("gold", "lg", "mt-8 w-full")}>List Your Service</Link>
        </div>
      )}
    </div>
  );
}
