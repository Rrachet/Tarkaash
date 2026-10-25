"use client";

import { useEffect } from "react";

const SELECTOR = "[data-reveal], [data-stagger] > *";
const EASE = "cubic-bezier(0.16, 1, 0.3, 1)";

const FRAMES: Record<string, Keyframe[]> = {
  up: [{ opacity: 0, transform: "translateY(28px)" }, { opacity: 1, transform: "none" }],
  fade: [{ opacity: 0 }, { opacity: 1 }],
  left: [{ opacity: 0, transform: "translateX(-36px)" }, { opacity: 1, transform: "none" }],
  right: [{ opacity: 0, transform: "translateX(36px)" }, { opacity: 1, transform: "none" }],
  zoom: [{ opacity: 0, transform: "scale(0.92)" }, { opacity: 1, transform: "none" }],
  line: [{ transform: "scaleX(0)", transformOrigin: "left" }, { transform: "scaleX(1)", transformOrigin: "left" }],
};

function variantOf(el: HTMLElement): string {
  const own = el.dataset.reveal;
  if (own !== undefined) return own || "up";
  return el.parentElement?.dataset.stagger || "up";
}

/**
 * Reveals [data-reveal] elements (and children of [data-stagger]) as they scroll into view.
 * Elements entering together are staggered in reading order. Uses the Web Animations API so the
 * DOM React hydrates is never modified (no hydration mismatches), and `fill: both` keeps the end state.
 */
export function RevealObserver() {
  useEffect(() => {
    (window as unknown as { __tkReveal?: boolean }).__tkReveal = true;
    const root = document.documentElement;
    if (!root.classList.contains("motion") || !("IntersectionObserver" in window) || !Element.prototype.animate) {
      root.classList.remove("motion");
      return;
    }

    const done = new WeakSet<Element>();
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .map((e) => ({ el: e.target as HTMLElement, r: e.boundingClientRect }))
          .sort((a, b) => a.r.top - b.r.top || a.r.left - b.r.left);
        visible.forEach(({ el }, i) => {
          io.unobserve(el);
          const v = variantOf(el);
          const frames = FRAMES[v] ?? FRAMES.up!;
          el.animate(frames, {
            duration: v === "line" ? 1400 : v === "fade" ? 1000 : 850,
            delay: Math.min(i, 10) * 80 + (v === "line" ? 200 : 0),
            easing: EASE,
            fill: "both",
          });
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0 },
    );

    const scan = () => {
      document.querySelectorAll(SELECTOR).forEach((el) => {
        if (done.has(el)) return;
        done.add(el);
        io.observe(el);
      });
    };
    scan();

    let raf = 0;
    const mo = new MutationObserver(() => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(scan);
    });
    mo.observe(document.body, { childList: true, subtree: true });
    return () => {
      io.disconnect();
      mo.disconnect();
      cancelAnimationFrame(raf);
    };
  }, []);
  return null;
}

/** Runs before first paint: opt into reveal animations, with a fail-safe if JS never hydrates. */
export const MOTION_BOOT_SCRIPT = `(function(){try{var d=document.documentElement;if(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;d.classList.add('motion');setTimeout(function(){if(!window.__tkReveal)d.classList.remove('motion')},3500)}catch(e){}})();`;
