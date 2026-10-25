import { cn } from "@/lib/cn";
import type { Tone } from "@/lib/status";

const tones: Record<Tone, string> = {
  neutral: "bg-cream-200 text-ink",
  teal: "bg-teal/10 text-teal",
  gold: "bg-gold-pale text-[#8a5a10]",
  mint: "bg-mint text-success",
  danger: "bg-danger-soft text-danger",
  slate: "bg-slate/10 text-slate",
};

export function Badge({ tone = "neutral", className, children }: { tone?: Tone; className?: string; children: React.ReactNode }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap", tones[tone], className)}>
      {children}
    </span>
  );
}

export function StatusBadge({ map, status }: { map: Record<string, { label: string; tone: Tone }>; status: string }) {
  const s = map[status] ?? { label: status, tone: "neutral" as Tone };
  return <Badge tone={s.tone}>{s.label}</Badge>;
}

export function SampleBadge({ className }: { className?: string }) {
  return (
    <span title="Illustrative demo data — not yet validated" className={cn("inline-flex items-center rounded-full border border-dashed border-gold/60 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-gold-600", className)}>
      Sample data
    </span>
  );
}
