"use client";

import { useEffect, useState } from "react";
import { KMark } from "./k-mark";

export const SPLASH_KEY = "tk_splash";
const MIN_MS = 1200;
const MAX_MS = 2200;
const FADE_MS = 650;

/**
 * Opening screen shown once per browser session: the "क" mark draws in, the name appears, then it
 * lifts away. MOTION_BOOT_SCRIPT adds html.splash-seen before paint on later loads so it never
 * flashes, and a CSS fail-safe hides it after a few seconds even if JavaScript never runs.
 */
export function Splash() {
  const [phase, setPhase] = useState<"show" | "out" | "gone">("show");

  useEffect(() => {
    const root = document.documentElement;
    if (root.classList.contains("splash-seen")) {
      const t = window.setTimeout(() => setPhase("gone"), 0);
      return () => window.clearTimeout(t);
    }
    try { sessionStorage.setItem(SPLASH_KEY, "1"); } catch { /* private mode: show every load */ }

    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const start = performance.now();
    const minMs = reduced ? 500 : MIN_MS;
    let fadeTimer = 0;
    let goneTimer = 0;
    let done = false;

    const finish = () => {
      if (done) return;
      done = true;
      const wait = Math.max(0, minMs - (performance.now() - start));
      fadeTimer = window.setTimeout(() => {
        setPhase("out");
        goneTimer = window.setTimeout(() => {
          setPhase("gone");
          root.classList.add("splash-seen");
        }, FADE_MS);
      }, wait);
    };

    const cap = window.setTimeout(finish, MAX_MS);
    if (document.readyState === "complete") finish();
    else window.addEventListener("load", finish, { once: true });

    return () => {
      window.clearTimeout(cap);
      window.clearTimeout(fadeTimer);
      window.clearTimeout(goneTimer);
      window.removeEventListener("load", finish);
    };
  }, []);

  if (phase === "gone") return null;

  return (
    <div className="splash" data-state={phase} aria-hidden="true">
      <div className="splash-inner">
        <div className="splash-mark">
          <span className="splash-ring" />
          <KMark size={116} animated />
        </div>
        <p className="splash-name font-display">Tarkaash</p>
        <p className="splash-tag">Har Hunar Ko Ek Pehchaan</p>
      </div>
    </div>
  );
}
