"use client";

import { useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addCostEntry, setLedgerReconciled } from "@/lib/actions/admin";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";

export function CostForm() {
  const [pending, start] = useTransition();
  const ref = useRef<HTMLFormElement>(null);
  const toast = useToast();
  const router = useRouter();
  return (
    <form ref={ref} className="mt-4 grid gap-2 border-t border-line pt-4 sm:grid-cols-2" onSubmit={(e) => {
      e.preventDefault();
      const fd = new FormData(e.currentTarget);
      start(async () => {
        const r = await addCostEntry({ costType: String(fd.get("costType")) as "direct", label: String(fd.get("label")), amount: Number(fd.get("amount")), incurredOn: String(fd.get("incurredOn")), basis: String(fd.get("basis")) as "actual" });
        if (r.ok) { toast("success", "Cost added"); ref.current?.reset(); router.refresh(); } else toast("error", r.error);
      });
    }}>
      <Input name="label" placeholder="Cost label" required aria-label="Cost label" className="sm:col-span-2" />
      <Input name="amount" type="number" min={0} placeholder="Amount ₹" required aria-label="Amount" />
      <Input name="incurredOn" type="date" required aria-label="Date" defaultValue={new Date().toISOString().slice(0, 10)} />
      <Select name="costType" aria-label="Cost type" defaultValue="operating"><option value="operating">Operating</option><option value="direct">Direct</option></Select>
      <Select name="basis" aria-label="Basis" defaultValue="actual"><option value="actual">Actual</option><option value="accrued">Accrued</option><option value="forecast">Forecast</option></Select>
      <Button type="submit" size="sm" loading={pending} className="sm:col-span-2">Add cost</Button>
    </form>
  );
}

export function ReconcileButton({ id, reconciled }: { id: string; reconciled: boolean }) {
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <button type="button" disabled={pending} onClick={() => start(async () => { await setLedgerReconciled(id, !reconciled); router.refresh(); })}
      className={`text-xs font-semibold ${reconciled ? "text-success" : "text-teal hover:underline"}`}>
      {reconciled ? "Reconciled ✓" : pending ? "…" : "Reconcile"}
    </button>
  );
}
