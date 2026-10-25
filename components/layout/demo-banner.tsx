"use client";

import { useEffect, useState } from "react";
import { Info, X } from "lucide-react";

/** Thin notice that the environment contains illustrative data. Dismissal is remembered per browser. */
export function DemoBanner() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    try { setShow(localStorage.getItem("tk-demo-banner") !== "hidden"); } catch { setShow(true); }
  }, []);
  if (!show) return null;
  return (
    <div className="bg-gold-pale text-[#6b4710]">
      <div className="container-page flex items-center gap-3 py-2 text-xs sm:text-sm">
        <Info className="size-4 shrink-0" aria-hidden />
        <p className="flex-1"><strong>Client demo.</strong> Providers, prices, reviews and metrics are sample data for illustration.</p>
        <button type="button" aria-label="Dismiss notice" className="flex size-8 items-center justify-center rounded-full hover:bg-black/5"
          onClick={() => { setShow(false); try { localStorage.setItem("tk-demo-banner", "hidden"); } catch {} }}>
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}
