"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Pause, Play, Clock, Package } from "lucide-react";
import { saveService, setServiceActive } from "@/lib/actions/vendor";
import { priceLabel, sizedImage, DELIVERY_LABELS } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input, Select, Textarea, FormMessage } from "@/components/ui/field";
import { EmptyState } from "@/components/ui/misc";
import { useToast } from "@/components/ui/toast";
import { ImageUpload } from "./image-upload";

type Service = {
  id: string; title: string; description: string | null; price_type: string; price_amount: number | null; price_unit: string | null;
  lead_time: string | null; delivery_options: string[]; availability: string | null; image_url: string | null; active: boolean; moderation?: string; moderation_note?: string | null;
};

export function ServicesManager({ vendorId, services, openNew }: { vendorId: string; services: Service[]; openNew?: boolean }) {
  const [editing, setEditing] = useState<Service | "new" | null>(openNew ? "new" : null);
  const [pending, start] = useTransition();
  const toast = useToast();
  const router = useRouter();

  return (
    <>
      <div className="mb-5 flex justify-end"><Button onClick={() => setEditing("new")}><Plus className="size-4" />Add service</Button></div>
      {services.length === 0 ? (
        <EmptyState icon={<Package className="size-6" />} title="No services yet" action={<Button onClick={() => setEditing("new")}>Add your first service</Button>}>
          Add services with an indicative price so customers know what to enquire about.
        </EmptyState>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {services.map((s) => (
            <article key={s.id} className={`card overflow-hidden ${s.active ? "" : "opacity-70"}`}>
              <div className="relative aspect-[16/9] bg-cream-200">
                {s.image_url ? <Image src={sizedImage(s.image_url, 640, 360)!} alt="" fill unoptimized className="object-cover" sizes="400px" /> : <div className="pattern-jaali h-full bg-teal-deep" />}
                {!s.active && <Badge tone="slate" className="absolute left-3 top-3">Paused</Badge>}
                {s.moderation && s.moderation !== "approved" && (
                  <Badge tone={s.moderation === "pending" ? "gold" : "danger"} className="absolute right-3 top-3">{s.moderation === "pending" ? "Waiting for approval" : "Not approved"}</Badge>
                )}
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-2"><h3 className="font-display text-lg font-semibold">{s.title}</h3><span className="text-sm font-semibold text-teal">{priceLabel(s)}</span></div>
                {s.moderation === "rejected" && s.moderation_note && <p className="mt-1 rounded-lg bg-danger-soft px-2.5 py-1.5 text-xs text-danger">Not approved: {s.moderation_note}. Edit and save to resubmit.</p>}
                {s.description && <p className="mt-1 line-clamp-2 text-sm text-slate">{s.description}</p>}
                <p className="mt-2 flex flex-wrap gap-x-3 text-xs text-slate">
                  {s.lead_time && <span className="inline-flex items-center gap-1"><Clock className="size-3.5" />{s.lead_time}</span>}
                  {s.delivery_options.map((d) => <span key={d}>{DELIVERY_LABELS[d] ?? d}</span>)}
                </p>
                <div className="mt-4 flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setEditing(s)}><Pencil className="size-4" />Edit</Button>
                  <Button size="sm" variant="ghost" loading={pending} onClick={() => start(async () => {
                    const r = await setServiceActive(s.id, !s.active);
                    if (r.ok) { toast("success", s.active ? "Service paused" : "Service is live again"); router.refresh(); } else toast("error", r.error);
                  })}>{s.active ? <><Pause className="size-4" />Pause</> : <><Play className="size-4" />Resume</>}</Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
      {editing && <ServiceDialog vendorId={vendorId} service={editing === "new" ? null : editing} onClose={() => setEditing(null)} />}
    </>
  );
}

function ServiceDialog({ vendorId, service, onClose }: { vendorId: string; service: Service | null; onClose: () => void }) {
  const [priceType, setPriceType] = useState(service?.price_type ?? "from");
  const [image, setImage] = useState<string | null>(service?.image_url ?? null);
  const [fe, setFe] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const toast = useToast();
  const router = useRouter();
  return (
    <Dialog open onClose={onClose} title={service ? "Edit service" : "Add a service"} className="max-w-2xl">
      <form className="space-y-4" noValidate onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const g = (k: string) => String(fd.get(k) ?? "");
        setFe({}); setError(null);
        start(async () => {
          const r = await saveService({
            id: service?.id, vendorId, title: g("title"), description: g("description"), priceType: priceType as "from",
            priceAmount: g("priceAmount") ? Number(g("priceAmount")) : undefined, priceUnit: g("priceUnit"), leadTime: g("leadTime"),
            deliveryOptions: fd.getAll("delivery").map(String) as ("delivery" | "pickup")[], availability: g("availability"),
            imageUrl: image ?? undefined, active: service?.active ?? true,
          });
          if (r.ok) { toast("success", service ? "Service updated" : "Service added"); onClose(); router.refresh(); }
          else { setError(r.error); setFe(r.fieldErrors ?? {}); }
        });
      }}>
        {error && <FormMessage>{error}</FormMessage>}
        <div className="grid gap-4 sm:grid-cols-[200px_1fr]">
          <ImageUpload vendorId={vendorId} value={image} onChange={setImage} />
          <div className="space-y-4">
            <Field label="Service title" name="title" required error={fe.title}><Input name="title" defaultValue={service?.title} error={fe.title} /></Field>
            <Field label="Short description" name="description"><Textarea name="description" defaultValue={service?.description ?? ""} className="min-h-20" /></Field>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Pricing" name="priceType">
            <Select name="priceType" value={priceType} onChange={(e) => setPriceType(e.target.value)}>
              <option value="from">Starting from</option><option value="fixed">Fixed price</option><option value="per_unit">Per unit</option><option value="quote">Request a quote</option>
            </Select>
          </Field>
          {priceType !== "quote" && <>
            <Field label="Price (₹)" name="priceAmount" error={fe.priceAmount}><Input name="priceAmount" type="number" min={0} defaultValue={service?.price_amount ?? ""} error={fe.priceAmount} /></Field>
            <Field label="Unit" name="priceUnit" hint="e.g. per kg, per person"><Input name="priceUnit" defaultValue={service?.price_unit ?? ""} /></Field>
          </>}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Lead time" name="leadTime" hint="e.g. Ready in 1 day"><Input name="leadTime" defaultValue={service?.lead_time ?? ""} /></Field>
          <Field label="Availability" name="availability" hint="e.g. Weekends only"><Input name="availability" defaultValue={service?.availability ?? ""} /></Field>
        </div>
        <fieldset>
          <legend className="text-sm font-semibold">How is it delivered?</legend>
          <div className="mt-2 flex flex-wrap gap-3">
            {Object.entries(DELIVERY_LABELS).map(([k, l]) => (
              <label key={k} className="flex min-h-10 cursor-pointer items-center gap-2 rounded-full border border-line px-3 text-sm has-[:checked]:border-teal has-[:checked]:bg-teal/5">
                <input type="checkbox" name="delivery" value={k} defaultChecked={service?.delivery_options.includes(k)} className="accent-teal" />{l}
              </label>
            ))}
          </div>
        </fieldset>
        <Button type="submit" className="w-full" loading={pending}>{service ? "Save changes" : "Add service"}</Button>
      </form>
    </Dialog>
  );
}
