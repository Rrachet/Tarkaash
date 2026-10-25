"use client";

import { useSyncExternalStore } from "react";
import { Info, X } from "lucide-react";

const KEY = "tk-demo-banner";
const listeners = new Set<() => void>();
const subscribe = (cb: () => void) => { listeners.add(cb); return () => listeners.delete(cb); };
const read = () => { try { return localStorage.getItem(KEY) !== "hidden"; } catch { return true; } };

/** Thin notice that the environment contains illustrative data. Dismissal is remembered per browser. */
export function DemoBanner() {
  const show = useSyncExternalStore(subscribe, read, () => false);
  if (!show) return null;
  return (
    <div className="bg-gold-pale text-[#6b4710]">
      <div className="container-page flex items-center gap-3 py-2 text-xs sm:text-sm">
        <Info className="size-4 shrink-0" aria-hidden />
        <p className="flex-1"><strong>Client demo.</strong> Providers, prices, reviews and metrics are sample data for illustration.</p>
        <button type="button" aria-label="Dismiss notice" className="flex size-8 items-center justify-center rounded-full hover:bg-black/5"
          onClick={() => { try { localStorage.setItem(KEY, "hidden"); } catch {} listeners.forEach((l) => l()); }}>
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}
