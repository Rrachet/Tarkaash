"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateSetting, type SettingKey } from "@/lib/actions/admin";
import { Button } from "@/components/ui/button";
import { Field, Input, Checkbox } from "@/components/ui/field";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { formatDateTime } from "@/lib/format";

type Row = { value: Record<string, unknown>; description: string | null; updated_at: string };
type Settings = Record<SettingKey, Row>;

export function SettingsForms({ settings, canEdit }: { settings: Settings; canEdit: boolean }) {
  const [pending, start] = useTransition();
  const toast = useToast();
  const router = useRouter();
  const save = (key: SettingKey, build: (fd: FormData) => unknown) => (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const value = build(new FormData(e.currentTarget));
    start(async () => {
      const r = await updateSetting(key, value);
      if (r.ok) { toast("success", "Setting saved"); router.refresh(); } else toast("error", r.error);
    });
  };
  const num = (fd: FormData, k: string) => Number(fd.get(k));
  const on = (fd: FormData, k: string) => fd.get(k) === "on";
  const a = settings.assist?.value ?? {}; const c = settings.commission?.value ?? {}; const b = settings.boost_thresholds?.value ?? {};
  const ct = settings.contact?.value ?? {}; const en = settings.enquiry?.value ?? {};
  const md = settings.moderation?.value ?? { require_approval: true };

  return (
    <fieldset disabled={!canEdit || pending} className="grid gap-6 xl:grid-cols-2">
      <Card title="Tarkaash Assist fee" row={settings.assist} approved={!!a.approved}>
        <form onSubmit={save("assist", (fd) => ({ enabled: on(fd, "enabled"), fee: num(fd, "fee"), currency: "INR", approved: on(fd, "approved"), label: String(fd.get("label")) }))} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Label" name="label"><Input name="label" defaultValue={String(a.label ?? "Tarkaash Assist")} /></Field>
            <Field label="Fee (₹)" name="fee"><Input name="fee" type="number" min={0} defaultValue={Number(a.fee ?? 0)} /></Field>
          </div>
          <Checkbox name="enabled" defaultChecked={!!a.enabled} label="Offer Tarkaash Assist on enquiry forms" />
          <Checkbox name="approved" defaultChecked={!!a.approved} label="Fee approved by product owner" />
          <Button type="submit" size="sm">Save</Button>
        </form>
      </Card>
      <Card title="Commission" row={settings.commission} approved={!!c.approved}>
        <form onSubmit={save("commission", (fd) => ({ pct: num(fd, "pct"), approved: on(fd, "approved") }))} className="space-y-3">
          <Field label="Commission on closed orders (%)" name="pct" hint="Booked to the ledger when Tarkaash closes an order."><Input name="pct" type="number" min={0} max={50} step="0.5" defaultValue={Number(c.pct ?? 0)} /></Field>
          <Checkbox name="approved" defaultChecked={!!c.approved} label="Commission approved by product owner" />
          <Button type="submit" size="sm">Save</Button>
        </form>
      </Card>
      <Card title="Vendor content approval" row={settings.moderation}>
        <form onSubmit={save("moderation", (fd) => ({ require_approval: on(fd, "require") }))} className="space-y-3">
          <Checkbox name="require" defaultChecked={md.require_approval !== false} label="New or edited vendor services, posts and photos need admin approval before they appear publicly" />
          <p className="text-xs text-slate">Turn off to let vendor content go live straight away. You can still reject or delete anything from Content approval.</p>
          <Button type="submit" size="sm">Save</Button>
        </form>
      </Card>
      <Card title="Enquiry routing & abuse controls" row={settings.enquiry}>
        <form onSubmit={save("enquiry", (fd) => ({ auto_assign_requested_vendor: on(fd, "auto"), max_per_contact_per_hour: num(fd, "max") }))} className="space-y-3">
          <Checkbox name="auto" defaultChecked={!!en.auto_assign_requested_vendor} label="Auto-assign enquiries to the requested provider (skip manual review)" />
          <Field label="Max enquiries per contact per hour" name="max"><Input name="max" type="number" min={1} max={100} defaultValue={Number(en.max_per_contact_per_hour ?? 5)} /></Field>
          <Button type="submit" size="sm">Save</Button>
        </form>
      </Card>
      <Card title="Public contact channels" row={settings.contact} approved={!!ct.confirmed} approvedLabel="Shown publicly">
        <form onSubmit={save("contact", (fd) => ({ email: String(fd.get("email")) || null, phone: String(fd.get("phone")) || null, address: String(fd.get("address")) || null, confirmed: on(fd, "confirmed") }))} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Email" name="email"><Input name="email" type="email" defaultValue={String(ct.email ?? "")} /></Field>
            <Field label="WhatsApp / phone" name="phone"><Input name="phone" defaultValue={String(ct.phone ?? "")} /></Field>
          </div>
          <Field label="Address" name="address"><Input name="address" defaultValue={String(ct.address ?? "")} /></Field>
          <Checkbox name="confirmed" defaultChecked={!!ct.confirmed} label="These details are confirmed. Show them on the Contact page." />
          <Button type="submit" size="sm">Save</Button>
        </form>
      </Card>
      <Card title="Boost queue thresholds" row={settings.boost_thresholds} className="xl:col-span-2">
        <form onSubmit={save("boost_thresholds", (fd) => ({
          low_views: num(fd, "low_views"), high_views: num(fd, "high_views"), min_enquiry_rate: num(fd, "min_enquiry_rate"), slow_response_hours: num(fd, "slow_response_hours"),
          min_enquiries_for_response: num(fd, "min_enquiries_for_response"), cancel_ratio: num(fd, "cancel_ratio"), min_rating: num(fd, "min_rating"), min_completeness: num(fd, "min_completeness"),
        }))} className="grid gap-3 sm:grid-cols-4">
          {[["low_views", "Low exposure: views below"], ["high_views", "High exposure: views from"], ["min_enquiry_rate", "Min enquiry rate (0 to 1)", "0.01"], ["slow_response_hours", "Slow response (hours)"],
            ["min_enquiries_for_response", "Min assignments to judge response"], ["cancel_ratio", "Cancel ratio flag (0 to 1)", "0.05"], ["min_rating", "Min average rating", "0.1"], ["min_completeness", "Listing complete (%)"]].map(([k, l, step]) => (
            <Field key={k} label={l!} name={k!}><Input name={k} type="number" step={step ?? "1"} defaultValue={Number(b[k!] ?? 0)} /></Field>
          ))}
          <div className="sm:col-span-4"><Button type="submit" size="sm">Save thresholds</Button></div>
        </form>
      </Card>
    </fieldset>
  );
}

function Card({ title, row, approved, approvedLabel = "Approved", className, children }: { title: string; row?: Row; approved?: boolean; approvedLabel?: string; className?: string; children: React.ReactNode }) {
  return (
    <section className={`card p-5 ${className ?? ""}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-sans text-base font-semibold">{title}</h2>
        {approved !== undefined && <Badge tone={approved ? "mint" : "gold"}>{approved ? approvedLabel : "Pending approval"}</Badge>}
      </div>
      {row?.description && <p className="mt-1 text-xs text-slate">{row.description}</p>}
      <div className="mt-4">{children}</div>
      {row?.updated_at && <p className="mt-3 text-xs text-slate">Last updated {formatDateTime(row.updated_at)}</p>}
    </section>
  );
}
