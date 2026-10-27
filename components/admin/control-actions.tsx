"use client";

import { useId, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, X, Trash2, Ban, RotateCcw, Eraser, PauseCircle, PlayCircle, AlertTriangle } from "lucide-react";
import { moderateContent, removeVendor, setUserBlocked, eraseUser, setUserRole, setVendorStatus, updateVendorListing, type ContentKind } from "@/lib/actions/admin";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input, Textarea, Select, Checkbox, FormMessage } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";

type Result = { ok: boolean; error?: string };

function useRunner() {
  const [pending, start] = useTransition();
  const toast = useToast();
  const router = useRouter();
  const run = (fn: () => Promise<Result>, success: string, after?: () => void) =>
    start(async () => {
      const r = await fn();
      if (r.ok) { toast("success", success); after?.(); router.refresh(); } else toast("error", r.error ?? "Something went wrong.");
    });
  return { pending, run };
}

/** Asks for a reason (and optionally a typed confirmation) before a sensitive action. */
function ReasonDialog({ open, onClose, title, description, confirmLabel, danger, confirmText, onConfirm, pending, extra }: {
  open: boolean; onClose: () => void; title: string; description: string; confirmLabel: string; danger?: boolean;
  confirmText?: string; onConfirm: (reason: string) => void; pending: boolean; extra?: React.ReactNode;
}) {
  const [reason, setReason] = useState("");
  const [typed, setTyped] = useState("");
  const uid = useId();
  const ok = reason.trim().length >= 3 && (!confirmText || typed.trim() === confirmText);
  return (
    <Dialog open={open} onClose={onClose} title={title} description={description}>
      <div className="space-y-4">
        <Field label="Reason (shown to the vendor or user and kept in the audit log)" name={`reason${uid}`} required>
          <Textarea name={`reason${uid}`} data-field="reason" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={500} className="min-h-24" />
        </Field>
        {confirmText && (
          <Field label={`Type "${confirmText}" to confirm`} name={`confirm${uid}`} required>
            <Input name={`confirm${uid}`} data-field="confirm" value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="off" />
          </Field>
        )}
        {extra}
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant={danger ? "danger" : "primary"} disabled={!ok} loading={pending} onClick={() => onConfirm(reason.trim())}>{confirmLabel}</Button>
        </div>
      </div>
    </Dialog>
  );
}

/** Approve / reject / delete a vendor service, post or photo. */
export function ContentActions({ kind, id, status, readOnly }: { kind: ContentKind; id: string; status: string; readOnly: boolean }) {
  const { pending, run } = useRunner();
  const [dialog, setDialog] = useState<"reject" | "delete" | null>(null);
  if (readOnly) return <p className="text-xs text-slate">View only</p>;
  return (
    <div className="flex flex-wrap gap-2">
      {status !== "approved" && (
        <Button size="sm" loading={pending} onClick={() => run(() => moderateContent(kind, id, "approve"), "Approved and live")}><Check className="size-4" />Approve</Button>
      )}
      {status !== "rejected" && (
        <Button size="sm" variant="outline" disabled={pending} onClick={() => setDialog("reject")}><X className="size-4" />Reject</Button>
      )}
      <Button size="sm" variant="ghost" className="text-danger" disabled={pending} onClick={() => setDialog("delete")}><Trash2 className="size-4" />Delete</Button>
      <ReasonDialog open={dialog === "reject"} onClose={() => setDialog(null)} title="Reject this item"
        description="It stays hidden from the public. The vendor sees your reason and can edit and resubmit." confirmLabel="Reject" pending={pending}
        onConfirm={(r) => run(() => moderateContent(kind, id, "reject", r), "Rejected. Vendor notified.", () => setDialog(null))} />
      <ReasonDialog open={dialog === "delete"} onClose={() => setDialog(null)} title="Delete permanently" danger
        description="This removes the item for good. The vendor is notified with your reason." confirmLabel="Delete" pending={pending}
        onConfirm={(r) => run(() => moderateContent(kind, id, "delete", r), "Deleted. Vendor notified.", () => setDialog(null))} />
    </div>
  );
}

const ROLES = ["customer", "vendor", "finance", "admin"] as const;

/** Role change, block/unblock and data erasure for one account. */
export function UserActions({ user, isSelf, readOnly }: {
  user: { id: string; role: string; blocked: boolean; name: string }; isSelf: boolean; readOnly: boolean;
}) {
  const { pending, run } = useRunner();
  const [dialog, setDialog] = useState<"block" | "erase" | null>(null);
  if (readOnly || isSelf) return <p className="text-xs text-slate">{isSelf ? "This is you" : "View only"}</p>;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <label className="sr-only" htmlFor={`role-${user.id}`}>Role</label>
      <Select id={`role-${user.id}`} name="role" defaultValue={user.role} disabled={pending} className="h-9 w-32 text-sm"
        onChange={(e) => {
          const role = e.target.value as (typeof ROLES)[number];
          if (!window.confirm(`Change ${user.name}'s role to ${role}?`)) { e.target.value = user.role; return; }
          run(() => setUserRole(user.id, role), `Role changed to ${role}`);
        }}>
        {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
      </Select>
      {user.blocked ? (
        <Button size="sm" variant="outline" loading={pending} onClick={() => run(() => setUserBlocked(user.id, false), "Account unblocked")}><RotateCcw className="size-4" />Unblock</Button>
      ) : (
        <Button size="sm" variant="outline" className="text-danger" disabled={pending} onClick={() => setDialog("block")}><Ban className="size-4" />Block</Button>
      )}
      <Button size="sm" variant="ghost" className="text-danger" disabled={pending} onClick={() => setDialog("erase")}><Eraser className="size-4" />Erase data</Button>
      <ReasonDialog open={dialog === "block"} onClose={() => setDialog(null)} title={`Block ${user.name}`} danger
        description="They are signed out and cannot sign in or use the site until unblocked." confirmLabel="Block account" pending={pending}
        onConfirm={(r) => run(() => setUserBlocked(user.id, true, r), "Account blocked", () => setDialog(null))} />
      <ReasonDialog open={dialog === "erase"} onClose={() => setDialog(null)} title={`Erase ${user.name}'s personal data`} danger confirmText="ERASE"
        description="Removes their name, phone and email from Tarkkash records (for data deletion requests) and blocks the account. This cannot be undone. Order records stay for accounting, anonymised."
        confirmLabel="Erase data" pending={pending}
        onConfirm={(r) => run(() => eraseUser(user.id, r), "Personal data erased", () => setDialog(null))} />
    </div>
  );
}

/** Suspend, reactivate or remove a vendor. */
export function VendorDangerZone({ vendorId, name, status, readOnly }: { vendorId: string; name: string; status: string; readOnly: boolean }) {
  const { pending, run } = useRunner();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [permanent, setPermanent] = useState(false);
  if (readOnly) return null;
  return (
    <section className="card border-danger/30 p-5">
      <h2 className="flex items-center gap-2 font-sans text-base font-semibold text-danger"><AlertTriangle className="size-5" />Danger zone</h2>
      <p className="mt-1 text-xs text-slate">For vendors who post inappropriate content, mistreat customers or break the terms.</p>
      <div className="mt-4 grid gap-2">
        {status === "active" && (
          <Button variant="outline" loading={pending} onClick={() => run(() => setVendorStatus(vendorId, "paused", "Your listing has been suspended by Tarkkash. Please contact support."), "Vendor suspended")}>
            <PauseCircle className="size-4" />Suspend (hide temporarily)
          </Button>
        )}
        {(status === "paused" || status === "removed" || status === "rejected") && (
          <Button variant="outline" loading={pending} onClick={() => run(() => setVendorStatus(vendorId, "active", "Your listing is live again."), "Vendor reactivated")}>
            <PlayCircle className="size-4" />Reactivate
          </Button>
        )}
        {status !== "removed" && (
          <Button variant="danger" disabled={pending} onClick={() => setOpen(true)}><Trash2 className="size-4" />Remove vendor</Button>
        )}
      </div>
      <ReasonDialog open={open} onClose={() => setOpen(false)} title={`Remove ${name}`} danger confirmText={name}
        description="The listing disappears from the site, vendor logins lose portal access, open orders are cancelled and their enquiries go back to your queue for reassignment."
        confirmLabel={permanent ? "Delete permanently" : "Remove vendor"} pending={pending}
        extra={<Checkbox name="permanent" checked={permanent} onChange={(e) => setPermanent(e.target.checked)}
          label="Delete permanently if they have no orders (otherwise the record is archived for accounting)" />}
        onConfirm={(r) => run(async () => {
          const res = await removeVendor(vendorId, r, permanent);
          if (res.ok && res.data.result === "deleted") router.push("/admin/vendors");
          return res;
        }, permanent ? "Vendor removed" : "Vendor removed and hidden", () => setOpen(false))} />
    </section>
  );
}

/** Admin edit of a vendor's public listing. */
export function VendorListingForm({ vendor, categories, readOnly }: {
  vendor: { id: string; name: string; tagline: string | null; description: string | null; locality: string | null; serviceArea: string[]; categoryId: string | null };
  categories: { id: string; name: string }[]; readOnly: boolean;
}) {
  const { pending, run } = useRunner();
  const [error, setError] = useState<string | null>(null);
  if (readOnly) return null;
  return (
    <section className="card p-5">
      <h2 className="font-sans text-base font-semibold">Edit listing</h2>
      <form className="mt-4 space-y-3" onSubmit={(e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        setError(null);
        run(async () => {
          const r = await updateVendorListing(vendor.id, {
            name: String(f.get("name") ?? ""), tagline: String(f.get("tagline") ?? ""), description: String(f.get("description") ?? ""),
            locality: String(f.get("locality") ?? ""), serviceArea: String(f.get("serviceArea") ?? ""), primaryCategoryId: String(f.get("category") ?? ""),
          });
          if (!r.ok) setError(r.error);
          return r;
        }, "Listing updated");
      }}>
        {error && <FormMessage>{error}</FormMessage>}
        <Field label="Business name" name="name" required><Input name="name" defaultValue={vendor.name} maxLength={120} /></Field>
        <Field label="Tagline" name="tagline"><Input name="tagline" defaultValue={vendor.tagline ?? ""} maxLength={160} /></Field>
        <Field label="Category" name="category">
          <Select name="category" defaultValue={vendor.categoryId ?? ""}>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
        </Field>
        <Field label="Locality" name="locality"><Input name="locality" defaultValue={vendor.locality ?? ""} maxLength={80} /></Field>
        <Field label="Service area" name="serviceArea" hint="Comma separated"><Input name="serviceArea" defaultValue={vendor.serviceArea.join(", ")} /></Field>
        <Field label="Description" name="description"><Textarea name="description" defaultValue={vendor.description ?? ""} maxLength={4000} className="min-h-28" /></Field>
        <Button type="submit" loading={pending} className="w-full">Save listing</Button>
      </form>
    </section>
  );
}
