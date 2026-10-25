"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Trash2, BadgeCheck, Circle } from "lucide-react";
import { updateVendorProfile, addGalleryImage, removeGalleryImage } from "@/lib/actions/vendor";
import { Field, Input, Textarea, FormMessage } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { sizedImage } from "@/lib/format";
import { ImageUpload } from "./image-upload";

type V = {
  id: string; name: string; tagline: string | null; description: string | null; locality: string | null; service_area: string[]; languages: string[];
  highlights: string[]; key_terms: string | null; years_experience: number | null; avatar_url: string | null; cover_url: string | null;
  verification: string; verification_checks: unknown;
};

const list = (s: string) => s.split(",").map((x) => x.trim()).filter(Boolean);

export function ProfileEditor({ vendor, media }: { vendor: V; media: { id: string; url: string; caption: string | null }[] }) {
  const [avatar, setAvatar] = useState(vendor.avatar_url);
  const [cover, setCover] = useState(vendor.cover_url);
  const [fe, setFe] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const toast = useToast();
  const router = useRouter();
  const checks = (vendor.verification_checks ?? {}) as Record<string, boolean>;

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
      <form className="card space-y-5 p-6" noValidate onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const g = (k: string) => String(fd.get(k) ?? "");
        setFe({}); setError(null);
        start(async () => {
          const r = await updateVendorProfile({
            vendorId: vendor.id, name: g("name"), tagline: g("tagline"), description: g("description"), locality: g("locality"),
            serviceArea: list(g("serviceArea")), languages: list(g("languages")), highlights: list(g("highlights")), keyTerms: g("keyTerms"),
            yearsExperience: g("years") ? Number(g("years")) : undefined, avatarUrl: avatar ?? undefined, coverUrl: cover ?? undefined,
          });
          if (r.ok) { toast("success", "Profile saved"); router.refresh(); } else { setError(r.error); setFe(r.fieldErrors ?? {}); }
        });
      }}>
        {error && <FormMessage>{error}</FormMessage>}
        <div className="grid gap-4 sm:grid-cols-[160px_1fr]">
          <div><p className="mb-1.5 text-sm font-semibold">Profile photo</p><ImageUpload vendorId={vendor.id} value={avatar} onChange={setAvatar} aspect="aspect-square" label="Logo / photo" /></div>
          <div><p className="mb-1.5 text-sm font-semibold">Cover image</p><ImageUpload vendorId={vendor.id} value={cover} onChange={setCover} aspect="aspect-[16/7]" label="Wide cover photo" /></div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Business name" name="name" required error={fe.name}><Input name="name" defaultValue={vendor.name} error={fe.name} /></Field>
          <Field label="Tagline" name="tagline"><Input name="tagline" defaultValue={vendor.tagline ?? ""} /></Field>
        </div>
        <Field label="About your business" name="description" hint="80+ characters improves your listing strength."><Textarea name="description" defaultValue={vendor.description ?? ""} /></Field>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Locality" name="locality" required error={fe.locality}><Input name="locality" defaultValue={vendor.locality ?? ""} error={fe.locality} /></Field>
          <Field label="Years of experience" name="years"><Input name="years" type="number" min={0} defaultValue={vendor.years_experience ?? ""} /></Field>
          <Field label="Languages" name="languages" hint="Comma separated"><Input name="languages" defaultValue={vendor.languages.join(", ")} /></Field>
        </div>
        <Field label="Service area" name="serviceArea" hint="Comma separated localities"><Input name="serviceArea" defaultValue={vendor.service_area.join(", ")} /></Field>
        <Field label="Highlights" name="highlights" hint="Up to 8, comma separated — e.g. Freshly baked, Eggless options"><Input name="highlights" defaultValue={vendor.highlights.join(", ")} /></Field>
        <Field label="Key terms" name="keyTerms" hint="Notice period, delivery radius, advance payment…"><Textarea name="keyTerms" defaultValue={vendor.key_terms ?? ""} className="min-h-20" /></Field>
        <Button type="submit" loading={pending}>Save profile</Button>
      </form>

      <aside className="space-y-6">
        <div className="card p-5">
          <h2 className="font-sans text-base font-semibold">Verification</h2>
          <p className="mt-1 text-sm text-slate">Tarkaash completes these checks before showing a badge. Contact support to start verification.</p>
          <ul className="mt-3 space-y-2 text-sm">
            {[["identity", "Identity document checked"], ["address", "Address & service area confirmed"], ["licence", "Category licence checked"], ["quality", "Sample work reviewed"]].map(([k, l]) => (
              <li key={k} className="flex items-center gap-2">{checks[k!] ? <BadgeCheck className="size-4 text-success" /> : <Circle className="size-4 text-line" />}{l}</li>
            ))}
          </ul>
        </div>
        <div className="card p-5">
          <h2 className="font-sans text-base font-semibold">Gallery</h2>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {media.map((m) => (
              <div key={m.id} className="group relative aspect-square overflow-hidden rounded-lg bg-cream-200">
                <Image src={sizedImage(m.url, 300, 300)!} alt={m.caption ?? ""} fill unoptimized className="object-cover" sizes="150px" />
                <button type="button" aria-label="Remove photo" onClick={() => start(async () => { const r = await removeGalleryImage(m.id); if (r.ok) router.refresh(); else toast("error", r.error); })}
                  className="absolute right-1.5 top-1.5 flex size-8 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition group-hover:opacity-100 focus:opacity-100"><Trash2 className="size-4" /></button>
              </div>
            ))}
            <ImageUpload vendorId={vendor.id} value={null} aspect="aspect-square" label="Add photo"
              onChange={(url) => url && start(async () => { const r = await addGalleryImage(vendor.id, url); if (r.ok) { toast("success", "Photo added"); router.refresh(); } else toast("error", r.error); })} />
          </div>
        </div>
      </aside>
    </div>
  );
}
