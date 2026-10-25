import { Check, X } from "lucide-react";
import { ORDER_STEPS, ORDER_STEP_LABELS } from "@/lib/status";
import { formatShortDate } from "@/lib/format";
import { cn } from "@/lib/cn";

export function OrderStepper({ status, history }: { status: string; history: { to_status: string; created_at: string }[] }) {
  const off = status === "declined" || status === "cancelled";
  const reached = new Map(history.map((h) => [h.to_status, h.created_at]));
  const idx = ORDER_STEPS.indexOf(status as (typeof ORDER_STEPS)[number]);
  return (
    <div className="card p-5">
      {off && (
        <p className="mb-4 flex items-center gap-2 rounded-xl bg-danger-soft px-3 py-2 text-sm font-semibold text-danger"><X className="size-4" />This order was {status}.</p>
      )}
      <ol className="flex items-start overflow-x-auto pb-1 scrollbar-none">
        {ORDER_STEPS.map((s, i) => {
          const done = !off && (i < idx || (i === idx && status === "closed"));
          const current = !off && i === idx && status !== "closed";
          const at = reached.get(s);
          return (
            <li key={s} className="flex min-w-[96px] flex-1 flex-col items-center text-center">
              <div className="flex w-full items-center">
                <span className={cn("h-0.5 flex-1", i === 0 ? "opacity-0" : done || current ? "bg-teal" : "bg-line")} />
                <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold",
                  done ? "border-teal bg-teal text-white" : current ? "border-gold bg-gold-pale text-teal-deep ring-4 ring-gold/20" : "border-line bg-white text-slate")}>
                  {done ? <Check className="size-4" /> : i + 1}
                </span>
                <span className={cn("h-0.5 flex-1", i === ORDER_STEPS.length - 1 ? "opacity-0" : done ? "bg-teal" : "bg-line")} />
              </div>
              <span className={cn("mt-2 text-xs font-semibold", done || current ? "text-ink" : "text-slate")}>{ORDER_STEP_LABELS[s]}</span>
              <span className="text-[11px] text-slate">{at ? formatShortDate(at) : current ? "Now" : "Pending"}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
