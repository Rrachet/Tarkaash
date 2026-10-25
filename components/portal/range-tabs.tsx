import Link from "next/link";
import { cn } from "@/lib/cn";

export function RangeTabs({ base, current, extra }: { base: string; current: string; extra?: Record<string, string | undefined> }) {
  const qs = (r: string) => {
    const p = new URLSearchParams();
    p.set("range", r);
    Object.entries(extra ?? {}).forEach(([k, v]) => v && p.set(k, v));
    return `${base}?${p.toString()}`;
  };
  return (
    <div className="inline-flex rounded-full border border-line bg-white p-1" role="group" aria-label="Date range">
      {[["7d", "7 days"], ["30d", "30 days"], ["90d", "90 days"]].map(([k, l]) => (
        <Link key={k} href={qs(k!)} aria-current={current === k ? "true" : undefined}
          className={cn("rounded-full px-3.5 py-1.5 text-sm font-semibold transition", current === k ? "bg-teal text-white" : "text-slate hover:text-ink")}>{l}</Link>
      ))}
    </div>
  );
}
