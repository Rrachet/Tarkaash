"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { UserCheck, Ban, StickyNote, BadgeCheck } from "lucide-react";
import { assignEnquiry, setEnquiryStatus, addEnquiryNote } from "@/lib/actions/admin";
import { Button } from "@/components/ui/button";
import { Field, Select, Textarea, FormMessage } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";

type V = { id: string; name: string; locality: string | null; categoryId: string | null; verified: boolean };

export function EnquiryAdminActions({ enquiryId, status, canEdit, hasActiveOrder, suggestedVendorId, categoryId, vendors }: {
  enquiryId: string; status: string; canEdit: boolean; hasActiveOrder: boolean; suggestedVendorId?: string; categoryId?: string; vendors: V[];
}) {
  const [showAll, setShowAll] = useState(false);
  const [vendorId, setVendorId] = useState(suggestedVendorId ?? "");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const toast = useToast();
  const router = useRouter();
  const list = useMemo(() => (showAll || !categoryId ? vendors : vendors.filter((v) => v.categoryId === categoryId || v.id === suggestedVendorId)), [showAll, vendors, categoryId, suggestedVendorId]);

  if (!canEdit) return <p className="card p-5 text-sm text-slate">Finance users have read-only access to the queue.</p>;

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, msg: string) => start(async () => {
    setError(null);
    const r = await fn();
    if (r.ok) { toast("success", msg); setNote(""); router.refresh(); } else { setError(r.error ?? "Something went wrong"); }
  });

  return (
    <div className="space-y-6">
      {status === "new" && (
        <section className="card border-gold/60 p-5 ring-2 ring-gold/20">
          <h2 className="flex items-center gap-2 font-sans text-base font-semibold"><UserCheck className="size-5 text-teal" />Assign to a provider</h2>
          {error && <div className="mt-3"><FormMessage>{error}</FormMessage></div>}
          <Field label="Provider" name="vendor" className="mt-3">
            <Select name="vendor" value={vendorId} onChange={(e) => setVendorId(e.target.value)}>
              <option value="">Choose provider…</option>
              {list.map((v) => <option key={v.id} value={v.id}>{v.name}{v.id === suggestedVendorId ? " (requested)" : ""}{v.verified ? " ✓" : ""}, {v.locality}</option>)}
            </Select>
          </Field>
          {categoryId && <label className="mt-2 flex items-center gap-2 text-xs text-slate"><input type="checkbox" checked={showAll} onChange={(e) => setShowAll(e.target.checked)} className="accent-teal" />Show providers from all categories</label>}
          <Textarea name="assignNote" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note for the record (optional)" className="mt-3 min-h-16" />
          <Button className="mt-3 w-full" loading={pending} disabled={!vendorId} onClick={() => run(async () => assignEnquiry(enquiryId, vendorId, note || undefined), "Enquiry assigned. Vendor notified.")}>
            <BadgeCheck className="size-4" />Assign & notify vendor
          </Button>
        </section>
      )}
      <section className="card p-5">
        <h2 className="flex items-center gap-2 font-sans text-base font-semibold"><StickyNote className="size-5 text-gold-600" />Add a note</h2>
        <Textarea name="note" value={status === "new" ? "" : note} onChange={(e) => setNote(e.target.value)} placeholder="Call notes, follow-ups…" className="mt-3 min-h-20" disabled={status === "new"} />
        <Button variant="outline" className="mt-3 w-full" loading={pending} disabled={status === "new" || note.trim().length < 2} onClick={() => run(async () => addEnquiryNote(enquiryId, note), "Note added")}>Save note</Button>
      </section>
      {!hasActiveOrder && !["closed"].includes(status) && (
        <section className="card p-5">
          <h2 className="flex items-center gap-2 font-sans text-base font-semibold"><Ban className="size-5 text-danger" />Close without an order</h2>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {["cancelled", "spam"].includes(status) ? (
              <Button variant="outline" className="col-span-2" loading={pending} onClick={() => run(async () => setEnquiryStatus(enquiryId, "new", "Reopened"), "Enquiry reopened")}>Reopen</Button>
            ) : (<>
              <Button variant="outline" loading={pending} onClick={() => run(async () => setEnquiryStatus(enquiryId, "cancelled", "No suitable provider available"), "Enquiry cancelled")}>Cancel</Button>
              <Button variant="ghost" className="text-danger" loading={pending} onClick={() => run(async () => setEnquiryStatus(enquiryId, "spam", "Marked as spam"), "Marked as spam")}>Mark spam</Button>
            </>)}
          </div>
        </section>
      )}
    </div>
  );
}
