"use client";

import { useEffect, useRef } from "react";

/** Sticky header wrapper that adds [data-scrolled] once the page has scrolled a little. */
export function HeaderShell({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => el.toggleAttribute("data-scrolled", window.scrollY > 12);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);
  return <header ref={ref} className={className}>{children}</header>;
}
