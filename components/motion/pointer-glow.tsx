"use client";

import { useRef } from "react";
import { cn } from "@/lib/cn";

/**
 * Tracks the pointer over its area and exposes it as CSS variables:
 * --mx/--my (px, for the gold glow) and --px/--py (-1..1, for `.parallax` children).
 */
export function PointerGlow({ children, className, as: Tag = "div" }: { children: React.ReactNode; className?: string; as?: "div" | "section" }) {
  const ref = useRef<HTMLElement>(null);
  const frame = useRef(0);
  const onMove = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    const el = ref.current;
    if (!el) return;
    cancelAnimationFrame(frame.current);
    const { clientX, clientY } = e;
    frame.current = requestAnimationFrame(() => {
      const r = el.getBoundingClientRect();
      const x = clientX - r.left;
      const y = clientY - r.top;
      el.style.setProperty("--mx", `${x}px`);
      el.style.setProperty("--my", `${y}px`);
      el.style.setProperty("--px", ((x / r.width) * 2 - 1).toFixed(3));
      el.style.setProperty("--py", ((y / r.height) * 2 - 1).toFixed(3));
    });
  };
  const onLeave = () => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty("--px", "0");
    el.style.setProperty("--py", "0");
  };
  return (
    <Tag ref={ref as React.Ref<HTMLDivElement>} onPointerMove={onMove} onPointerLeave={onLeave} className={cn("pointer-glow", className)}>
      {children}
    </Tag>
  );
}
