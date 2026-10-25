"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Power, UserPlus } from "lucide-react";
import { setVendorStatus, setVerification, linkVendorMember } from "@/lib/actions/admin";
import { Button } from "@/components/ui/button";
import { Input, FormMessage } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";

export function VendorAdminControls({ vendorId, status, checks, checkList, canEdit }: {
  vendorId: string; status: string; checks: Record<string, boolean>; checkList: { key: string; label: string }[]; canEdit: boolean;
}) {
  const [c, setC] = useState(checks);
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const toast = useToast();
  const router = useRouter();
  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, msg: string) => start(async () => {
    setError(null);
    const r = await fn();
    if (r.ok) { toast("success", msg); router.refresh(); } else setError(r.error ?? "Failed");
  });
  if (!canEdit) return <p className="card p-5 text-sm text-slate">Read-only for finance users.</p>;
  return (
    <aside className="space-y-6">
      {error && <FormMessage>{error}</FormMessage>}
      <section className="card p-5">
        <h2 className="flex items-center gap-2 font-sans text-base font-semibold"><Power className="size-5 text-teal" />Listing status</h2>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {status !== "active" && <Button className="col-span-2" loading={pending} onClick={() => run(() => setVendorStatus(vendorId, "active", "Your listing is approved and live."), "Vendor approved and live")}>Approve & publish</Button>}
          {status === "active" && <Button variant="outline" loading={pending} onClick={() => run(() => setVendorStatus(vendorId, "paused", "Listing paused by Tarkaash."), "Listing paused")}>Pause</Button>}
          {status !== "rejected" && <Button variant="ghost" className="text-danger" loading={pending} onClick={() => run(() => setVendorStatus(vendorId, "rejected", "Application not approved."), "Marked as rejected")}>Reject</Button>}
        </div>
      </section>
      <section className="card p-5">
        <h2 className="flex items-center gap-2 font-sans text-base font-semibold"><ShieldCheck className="size-5 text-success" />Verification checklist</h2>
        <p className="mt-1 text-xs text-slate">The badge appears only when every check is complete.</p>
        <ul className="mt-3 space-y-2">
          {checkList.map((k) => (
            <li key={k.key}><label className="flex cursor-pointer items-start gap-3 rounded-xl border border-line p-3 text-sm has-[:checked]:border-success has-[:checked]:bg-mint/40">
              <input type="checkbox" checked={!!c[k.key]} onChange={(e) => setC({ ...c, [k.key]: e.target.checked })} className="mt-0.5 size-4 accent-teal" />{k.label}
            </label></li>
          ))}
        </ul>
        <Button variant="outline" className="mt-3 w-full" loading={pending} onClick={() => start(async () => {
          const r = await setVerification(vendorId, c);
          if (r.ok) { toast("success", r.data.status === "verified" ? "Verified — badge is now shown" : `Checks saved (${r.data.status})`); router.refresh(); } else setError(r.error);
        })}>Save checks</Button>
      </section>
      <section className="card p-5">
        <h2 className="flex items-center gap-2 font-sans text-base font-semibold"><UserPlus className="size-5 text-gold-600" />Add team member</h2>
        <p className="mt-1 text-xs text-slate">They must have a Tarkaash account first.</p>
        <div className="mt-3 flex gap-2">
          <Input name="memberEmail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@example.com" />
          <Button loading={pending} disabled={!email} onClick={() => run(() => linkVendorMember(vendorId, email), "Member added")}>Add</Button>
        </div>
      </section>
    </aside>
  );
}
