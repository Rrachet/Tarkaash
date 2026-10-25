import Link from "next/link";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "gold" | "ghost" | "outline" | "danger" | "light";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  primary: "bg-teal text-white hover:bg-teal-600 shadow-sm",
  gold: "bg-gold text-teal-deep hover:bg-gold-600 hover:text-white shadow-sm",
  ghost: "bg-transparent text-teal hover:bg-teal/5",
  outline: "border border-line bg-white text-ink hover:border-teal/40 hover:bg-cream",
  danger: "bg-danger text-white hover:bg-danger/90",
  light: "bg-white/10 text-white ring-1 ring-white/25 hover:bg-white/20",
};
const sizes: Record<Size, string> = {
  sm: "h-9 px-3.5 text-sm",
  md: "h-11 px-5 text-sm",
  lg: "h-13 px-7 text-base",
};

export function buttonClass(variant: Variant = "primary", size: Size = "md", className?: string) {
  return cn(
    "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all duration-200",
    "disabled:pointer-events-none disabled:opacity-55 active:scale-[0.98] whitespace-nowrap",
    variants[variant], sizes[size], className,
  );
}

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size; loading?: boolean };

export function Button({ variant = "primary", size = "md", loading, className, children, disabled, ...rest }: ButtonProps) {
  return (
    <button className={buttonClass(variant, size, className)} disabled={disabled || loading} aria-busy={loading || undefined} {...rest}>
      {loading && <Loader2 className="size-4 animate-spin" aria-hidden />}
      {children}
    </button>
  );
}

type LinkProps = React.ComponentProps<typeof Link> & { variant?: Variant; size?: Size };

export function ButtonLink({ variant = "primary", size = "md", className, ...rest }: LinkProps) {
  return <Link className={buttonClass(variant, size, className)} {...rest} />;
}
