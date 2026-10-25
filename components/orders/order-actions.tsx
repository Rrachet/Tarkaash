"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Phone, Mail, Eye, IndianRupee, Pencil, CheckCircle2 } from "lucide-react";
import { transitionOrder, updateOrder, recordPayment, getOrderContact } from "@/lib/actions/vendor";
import { VENDOR_ACTIONS, ADMIN_ACTIONS, type OrderStatus } from "@/lib/status-actions";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input, Select, Textarea, FormMessage } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";

type Props = {
  orderId: string;
  status: string;
  role: "vendor" | "admin";
  agreedAmount: number | null;
  scheduledFor: string | null;
  scope: string | null;
  notes: string | null;
};

export function OrderActions({ orderId, status, role, agreedAmount, scheduledFor, scope, notes }: Props) {
  const actions = (role === "admin" ? { ...VENDOR_ACTIONS, ...ADMIN_ACTIONS } : VENDOR_ACTIONS)[status] ?? [];
  const [noteFor, setNoteFor] = useState<{ to: string; label: string } | null>(null);
  const [note, setNote] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fe, setFe] = useState<Record<string, string>>({});
  const [pending, start] = useTransition();
  const toast = useToast();
  const router = useRouter();
  const editable = !["declined", "cancelled", "submitted", "closed"].includes(status);
  const canPay = ["completed", "payment_recorded"].includes(status);

  const move = (to: string, n?: string) => start(async () => {
    setError(null);
    const r = await transitionOrder({ orderId, to: to as OrderStatus, note: n });
    if (r.ok) { toast("success", "Order updated"); setNoteFor(null); setNote(""); router.refresh(); }
    else { setError(r.error); toast("error", r.error); if (to === "completed" && /agreed price/i.test(r.error)) setEditOpen(true); }
  });

  return (
    <div className="card p-5">
      <h2 className="font-sans text-base font-semibold">Next steps</h2>
      {error && <div className="mt-3"><FormMessage>{error}</FormMessage></div>}
      <div className="mt-4 flex flex-col gap-2">
        {actions.map((a) => (
          <Button key={a.to} variant={a.variant} loading={pending && !noteFor} className="w-full"
            onClick={() => (a.needsNote ? setNoteFor({ to: a.to, label: a.label }) : move(a.to))}>
            {a.label}
          </Button>
        ))}
        {canPay && <Button variant="gold" className="w-full" onClick={() => setPayOpen(true)}><IndianRupee className="size-4" />Record payment</Button>}
        {editable && <Button variant="outline" className="w-full" onClick={() => setEditOpen(true)}><Pencil className="size-4" />Edit price & schedule</Button>}
        {actions.length === 0 && !canPay && !editable && (
          <p className="flex items-center gap-2 rounded-xl bg-cream px-3 py-2.5 text-sm text-slate">
            <CheckCircle2 className="size-4 text-success" />{status === "submitted" ? "Submitted — Tarkaash will verify and close this order." : "No further action needed."}
          </p>
        )}
      </div>
      {status === "submitted" && role === "vendor" && <p className="mt-3 text-xs text-slate">Tarkaash reviews the record and closes the order.</p>}

      <Dialog open={!!noteFor} onClose={() => setNoteFor(null)} title={noteFor?.label ?? ""} description="Add a short reason. Tarkaash uses this to reassign or follow up.">
        <div className="space-y-4">
          <Textarea name="note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Fully booked on the requested date" />
          <Button variant="danger" className="w-full" loading={pending} disabled={note.trim().length < 3} onClick={() => noteFor && move(noteFor.to, note)}>Confirm</Button>
        </div>
      </Dialog>

      <Dialog open={editOpen} onClose={() => setEditOpen(false)} title="Price & schedule" description="Agreed with the customer through Tarkaash.">
        <form className="space-y-4" noValidate onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          setFe({});
          start(async () => {
            const sched = String(fd.get("scheduledFor") ?? "");
            const r = await updateOrder({ orderId, agreedAmount: fd.get("agreedAmount") ? Number(fd.get("agreedAmount")) : undefined,
              scheduledFor: sched ? new Date(sched).toISOString() : undefined, scope: String(fd.get("scope") ?? ""), notes: String(fd.get("notes") ?? "") });
            if (r.ok) { setEditOpen(false); toast("success", "Order details saved"); router.refresh(); } else { setError(r.error); setFe(r.fieldErrors ?? {}); }
          });
        }}>
          <Field label="Agreed price (₹)" name="agreedAmount" error={fe.agreedAmount}><Input name="agreedAmount" type="number" min={0} step="1" defaultValue={agreedAmount ?? ""} error={fe.agreedAmount} /></Field>
          <Field label="Scheduled for" name="scheduledFor"><Input name="scheduledFor" type="datetime-local" defaultValue={scheduledFor ? toLocal(scheduledFor) : ""} /></Field>
          <Field label="Agreed scope" name="scope"><Textarea name="scope" defaultValue={scope ?? ""} className="min-h-20" /></Field>
          <Field label="Internal notes" name="notes"><Textarea name="notes" defaultValue={notes ?? ""} className="min-h-20" /></Field>
          <Button type="submit" className="w-full" loading={pending}>Save</Button>
        </form>
      </Dialog>

      <Dialog open={payOpen} onClose={() => setPayOpen(false)} title="Record payment" description="Payment status is recorded separately from completion.">
        <form className="space-y-4" noValidate onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          setFe({});
          start(async () => {
            const r = await recordPayment({ orderId, amount: Number(fd.get("amount")), method: String(fd.get("method")) as "upi", reference: String(fd.get("reference") ?? "") });
            if (r.ok) { setPayOpen(false); toast("success", "Payment recorded"); router.refresh(); } else { setError(r.error); setFe(r.fieldErrors ?? {}); }
          });
        }}>
          <Field label="Amount received (₹)" name="amount" error={fe.amount}><Input name="amount" type="number" min={1} defaultValue={agreedAmount ?? ""} error={fe.amount} /></Field>
          <Field label="Method" name="method"><Select name="method" defaultValue="upi"><option value="upi">UPI</option><option value="cash">Cash</option><option value="bank_transfer">Bank transfer</option><option value="card">Card</option><option value="other">Other</option></Select></Field>
          <Field label="Transaction reference" name="reference" error={fe.reference} hint="Required for non-cash payments."><Input name="reference" error={fe.reference} /></Field>
          <Button type="submit" variant="gold" className="w-full" loading={pending}>Record payment</Button>
        </form>
      </Dialog>
    </div>
  );
}

function toLocal(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function ContactReveal({ orderId, status }: { orderId: string; status: string }) {
  const [data, setData] = useState<{ available: boolean; name?: string; email?: string | null; phone?: string | null; reason?: string } | null>(null);
  const [pending, start] = useTransition();
  const allowed = ["accepted", "in_progress", "completed", "payment_recorded", "submitted"].includes(status);
  return (
    <div className="card p-5">
      <h2 className="font-sans text-base font-semibold">Customer contact</h2>
      {!allowed ? (
        <p className="mt-2 text-sm text-slate">{status === "new" ? "Contact details are shared once you accept the enquiry." : "Contact details are no longer available for this order."}</p>
      ) : data?.available ? (
        <div className="mt-3 space-y-2 text-sm">
          <p className="font-semibold">{data.name}</p>
          {data.phone && <a href={`tel:${data.phone}`} className="flex items-center gap-2 text-teal hover:underline"><Phone className="size-4" />{data.phone}</a>}
          {data.email && <a href={`mailto:${data.email}`} className="flex items-center gap-2 text-teal hover:underline"><Mail className="size-4" />{data.email}</a>}
          <p className="pt-1 text-xs text-slate">Access is logged. Use only to fulfil this order.</p>
        </div>
      ) : (
        <Button variant="outline" className="mt-3 w-full" loading={pending} onClick={() => start(async () => {
          const r = await getOrderContact(orderId);
          setData(r.ok ? r.data : { available: false, reason: r.error });
        })}><Eye className="size-4" />Show contact details</Button>
      )}
      {data && !data.available && data.reason && <p className="mt-2 text-sm text-danger">{data.reason}</p>}
    </div>
  );
}
