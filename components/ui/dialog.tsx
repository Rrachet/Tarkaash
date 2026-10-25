"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";

/** Accessible modal built on the native <dialog> element (focus trap, Esc to close). */
export function Dialog({ open, onClose, title, description, children, className }: {
  open: boolean; onClose: () => void; title: string; description?: string; children: React.ReactNode; className?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog ref={ref} onClose={onClose} onClick={(e) => e.target === ref.current && onClose()}
      className={cn("m-auto w-[calc(100%-2rem)] max-w-lg rounded-2xl border border-line bg-white p-0 text-ink shadow-[var(--shadow-lift)] backdrop:bg-ink/50 backdrop:backdrop-blur-sm open:animate-fade-up", className)}>
      <div className="flex items-start justify-between gap-4 border-b border-line px-6 py-4">
        <div>
          <h2 className="text-xl font-semibold">{title}</h2>
          {description && <p className="mt-0.5 text-sm text-slate">{description}</p>}
        </div>
        <button type="button" onClick={onClose} aria-label="Close" className="-mr-2 flex size-10 items-center justify-center rounded-full text-slate hover:bg-cream">
          <X className="size-5" />
        </button>
      </div>
      <div className="px-6 py-5">{children}</div>
    </dialog>
  );
}
