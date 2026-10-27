import Image from "next/image";
import Link from "next/link";
import { Star } from "lucide-react";
import { cn } from "@/lib/cn";
import { initials, sizedImage } from "@/lib/format";

export function Logo({ variant = "gold", className, priority }: { variant?: "gold" | "color"; className?: string; priority?: boolean }) {
  return (
    <Link href="/" aria-label="Tarkkash home" className={cn("inline-flex shrink-0 transition-opacity hover:opacity-90", className)}>
      <Image src={`/brand/tarkaash-logo-${variant}.webp`} alt="Tarkkash, Har Hunar Ko Ek Pehchaan" width={900} height={440}
        className="h-full w-auto" priority={priority} />
    </Link>
  );
}

export function Avatar({ src, name, size = 48, className, rounded = "full" }: { src?: string | null; name?: string | null; size?: number; className?: string; rounded?: "full" | "xl" }) {
  const r = rounded === "full" ? "rounded-full" : "rounded-xl";
  const url = sizedImage(src, size * 2, size * 2);
  return url ? (
    <Image src={url} alt={name ?? ""} width={size} height={size} unoptimized
      className={cn(r, "object-cover bg-cream-200", className)} style={{ width: size, height: size }} />
  ) : (
    <span aria-hidden className={cn(r, "inline-flex items-center justify-center bg-teal font-display font-semibold text-gold", className)}
      style={{ width: size, height: size, fontSize: size * 0.38 }}>
      {initials(name)}
    </span>
  );
}

export function RatingStars({ value, size = 14, className }: { value: number; size?: number; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-0.5", className)} aria-label={`${value.toFixed(1)} out of 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} aria-hidden style={{ width: size, height: size }}
          className={i <= Math.round(value) ? "fill-gold text-gold" : "fill-line text-line"} />
      ))}
    </span>
  );
}

export function EmptyState({ icon, title, children, action, className }: { icon?: React.ReactNode; title: string; children?: React.ReactNode; action?: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-col items-center justify-center rounded-2xl border border-dashed border-line bg-white/60 px-6 py-12 text-center", className)}>
      {icon && <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-gold-pale text-teal">{icon}</div>}
      <h3 className="text-lg font-semibold">{title}</h3>
      {children && <div className="mt-1 max-w-md text-sm text-slate">{children}</div>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function SectionHeading({ eyebrow, title, children, align = "left", action }: { eyebrow?: string; title: React.ReactNode; children?: React.ReactNode; align?: "left" | "center"; action?: React.ReactNode }) {
  return (
    <div data-reveal className={cn("mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between", align === "center" && "sm:flex-col sm:items-center text-center")}>
      <div className={cn(align === "center" && "mx-auto max-w-2xl")}>
        {eyebrow && <p className="eyebrow mb-3">{eyebrow}</p>}
        <h2 className="text-3xl font-semibold text-ink sm:text-4xl">{title}</h2>
        {children && <p className="mt-3 text-base text-slate sm:text-lg">{children}</p>}
      </div>
      {action}
    </div>
  );
}

export function StatCard({ label, value, sub, icon, tone = "teal", className }: { label: string; value: React.ReactNode; sub?: React.ReactNode; icon?: React.ReactNode; tone?: "teal" | "gold" | "mint" | "rose" | "violet" | "sky"; className?: string }) {
  const chip = { teal: "bg-teal/10 text-teal", gold: "bg-gold-pale text-gold-600", mint: "bg-mint text-success", rose: "bg-rose-50 text-rose-600", violet: "bg-violet-50 text-violet-600", sky: "bg-sky-50 text-sky-700" }[tone];
  return (
    <div data-reveal className={cn("group card p-4 transition duration-300 hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)] sm:p-5", className)}>
      <div className="flex items-center gap-2.5">
        {icon && <span className={cn("flex size-9 items-center justify-center rounded-xl transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-6", chip)}>{icon}</span>}
        <p className="text-sm font-medium text-slate">{label}</p>
      </div>
      <p className="mt-3 font-display text-2xl font-semibold text-ink sm:text-3xl">{value}</p>
      {sub && <p className="mt-1 text-xs text-slate">{sub}</p>}
    </div>
  );
}

export function DataFreshness({ generatedAt, sample, label }: { generatedAt?: string; sample?: boolean; label?: string }) {
  return (
    <p className="text-xs text-slate">
      {label ? `${label} · ` : ""}Updated {generatedAt ? new Date(generatedAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" }) : "just now"}
      {sample && " · includes sample data"}
    </p>
  );
}
