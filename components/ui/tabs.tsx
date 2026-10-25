"use client";

import { useId, useState } from "react";
import { cn } from "@/lib/cn";

export type TabItem = { id: string; label: React.ReactNode; content: React.ReactNode };

export function Tabs({ items, initial, className, sticky }: { items: TabItem[]; initial?: string; className?: string; sticky?: boolean }) {
  const [active, setActive] = useState(initial ?? items[0]?.id);
  const base = useId();
  return (
    <div className={className}>
      <div role="tablist" className={cn("flex gap-1 overflow-x-auto border-b border-line scrollbar-none", sticky && "sticky top-[76px] z-10 bg-cream/95 backdrop-blur")}>
        {items.map((t) => (
          <button key={t.id} role="tab" type="button" id={`${base}-${t.id}`} aria-selected={active === t.id} aria-controls={`${base}-${t.id}-panel`}
            onClick={() => setActive(t.id)}
            className={cn("relative min-h-11 whitespace-nowrap px-4 text-sm font-semibold transition-colors duration-300",
              "after:absolute after:inset-x-3 after:-bottom-px after:h-0.5 after:rounded-full after:bg-gold after:transition-transform after:duration-500 after:ease-[cubic-bezier(0.16,1,0.3,1)]",
              active === t.id ? "text-teal after:scale-x-100" : "text-slate after:scale-x-0 hover:text-ink hover:after:scale-x-50")}>
            {t.label}
          </button>
        ))}
      </div>
      {items.map((t) => (
        <div key={t.id} role="tabpanel" id={`${base}-${t.id}-panel`} aria-labelledby={`${base}-${t.id}`} hidden={active !== t.id} className="pt-6 animate-fade-up">
          {t.content}
        </div>
      ))}
    </div>
  );
}
