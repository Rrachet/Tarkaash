"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

export function NavLinks({ items }: { items: { href: string; label: string }[] }) {
  const path = usePathname();
  return (
    <nav aria-label="Main" className="hidden items-center gap-1 lg:flex">
      {items.map((i) => {
        const active = i.href === "/" ? path === "/" : path.startsWith(i.href);
        return (
          <Link key={i.href} href={i.href} aria-current={active ? "page" : undefined}
            className={cn("relative rounded-full px-3.5 py-2 text-sm font-medium transition-colors duration-300",
              "after:absolute after:inset-x-4 after:-bottom-0.5 after:h-0.5 after:origin-center after:rounded-full after:bg-gold after:transition-transform after:duration-500 after:ease-[cubic-bezier(0.16,1,0.3,1)]",
              active ? "text-white after:scale-x-100" : "text-white/75 after:scale-x-0 hover:text-white hover:after:scale-x-100")}>
            {i.label}
          </Link>
        );
      })}
    </nav>
  );
}
