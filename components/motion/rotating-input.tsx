"use client";

import { useEffect, useState } from "react";

/** Search input whose placeholder types out example needs one after another. */
export function RotatingSearchInput({ name, examples, className, label }: { name: string; examples: string[]; className?: string; label: string }) {
  const [text, setText] = useState(examples[0] ?? "");
  useEffect(() => {
    if (!document.documentElement.classList.contains("motion") || examples.length < 2) return;
    let word = 0;
    let chars = examples[0]!.length;
    let phase: "hold" | "delete" | "type" = "hold";
    let t = 0;
    const step = () => {
      let delay = 70;
      if (phase === "hold") { phase = "delete"; delay = 30; }
      else if (phase === "delete") {
        chars--;
        delay = 32;
        if (chars <= 0) { chars = 0; word = (word + 1) % examples.length; phase = "type"; delay = 280; }
      } else {
        chars++;
        if (chars >= examples[word]!.length) { phase = "hold"; delay = 2200; }
      }
      setText(examples[word]!.slice(0, chars));
      t = window.setTimeout(step, delay);
    };
    t = window.setTimeout(step, 2600);
    return () => window.clearTimeout(t);
  }, [examples]);
  return <input name={name} aria-label={label} placeholder={text ? `${text}…` : ""} autoComplete="off" className={className} />;
}
