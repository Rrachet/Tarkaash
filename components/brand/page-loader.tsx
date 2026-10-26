import { KMark } from "./k-mark";
import { cn } from "@/lib/cn";

/** Route loading state: the pulsing "क" mark inside a spinning gold ring. */
export function PageLoader({ className, label = "Loading" }: { className?: string; label?: string }) {
  return (
    <div className={cn("flex min-h-[60vh] w-full flex-col items-center justify-center gap-5", className)} role="status" aria-live="polite">
      <div className="k-loader">
        <span className="k-loader-ring" aria-hidden="true" />
        <KMark size={64} className="k-loader-mark" />
      </div>
      <p className="text-sm font-medium tracking-wide text-slate">{label}…</p>
    </div>
  );
}
