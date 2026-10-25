"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

type State = "idle" | "loading" | "done";

function Bar() {
  const path = usePathname();
  const search = useSearchParams();
  const [state, setState] = useState<State>("idle");
  const timer = useRef<number | undefined>(undefined);
  const key = `${path}?${search.toString()}`;
  const [lastKey, setLastKey] = useState(key);

  // Route committed: finish the bar.
  if (key !== lastKey) {
    setLastKey(key);
    if (state === "loading") setState("done");
  }

  useEffect(() => {
    if (state !== "done") return;
    timer.current = window.setTimeout(() => setState("idle"), 700);
    return () => window.clearTimeout(timer.current);
  }, [state]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a");
      if (!a || a.target === "_blank" || a.hasAttribute("download")) return;
      const href = a.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin) return;
      if (url.pathname === location.pathname && url.search === location.search) return;
      setState("loading");
    };
    const onSubmit = (e: SubmitEvent) => {
      const f = e.target as HTMLFormElement;
      if ((f.method || "get").toLowerCase() === "get" && f.action && new URL(f.action).origin === location.origin) setState("loading");
    };
    document.addEventListener("click", onClick, true);
    document.addEventListener("submit", onSubmit, true);
    return () => {
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("submit", onSubmit, true);
    };
  }, []);

  return <div className="nav-progress" data-state={state} aria-hidden />;
}

/** Thin gold bar at the top of the window while a client-side navigation is in flight. */
export function NavProgress() {
  return (
    <Suspense fallback={null}>
      <Bar />
    </Suspense>
  );
}
