"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { ImagePlus, Loader2, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { sizedImage } from "@/lib/format";
import { cn } from "@/lib/cn";

/** Uploads to the vendor-media bucket under <vendorId>/ (storage policies enforce ownership). */
export function ImageUpload({ vendorId, value, onChange, label = "Upload photo", aspect = "aspect-[4/3]", className }: {
  vendorId: string; value?: string | null; onChange: (url: string | null) => void; label?: string; aspect?: string; className?: string;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function upload(file: File) {
    setError(null);
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) return setError("Use a JPG, PNG or WebP image.");
    if (file.size > 5 * 1024 * 1024) return setError("Image must be under 5 MB.");
    setBusy(true);
    const ext = file.type.split("/")[1];
    const path = `${vendorId}/${crypto.randomUUID()}.${ext}`;
    const supabase = createClient();
    const { error: err } = await supabase.storage.from("vendor-media").upload(path, file, { cacheControl: "31536000", contentType: file.type });
    setBusy(false);
    if (err) return setError("Upload failed. Please try again.");
    onChange(supabase.storage.from("vendor-media").getPublicUrl(path).data.publicUrl);
  }

  return (
    <div className={className}>
      <div className={cn("relative overflow-hidden rounded-xl border-2 border-dashed border-line bg-cream", aspect)}>
        {value ? (
          <>
            <Image src={sizedImage(value, 600)!} alt="" fill unoptimized className="object-cover" sizes="300px" />
            <button type="button" onClick={() => onChange(null)} aria-label="Remove image" className="absolute right-2 top-2 flex size-8 items-center justify-center rounded-full bg-black/60 text-white"><X className="size-4" /></button>
          </>
        ) : (
          <button type="button" onClick={() => input.current?.click()} className="flex h-full w-full flex-col items-center justify-center gap-2 text-sm font-semibold text-slate hover:text-teal">
            {busy ? <Loader2 className="size-6 animate-spin" /> : <ImagePlus className="size-6" />}{busy ? "Uploading…" : label}
          </button>
        )}
      </div>
      <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
      {error && <p className="mt-1 text-xs font-medium text-danger">{error}</p>}
    </div>
  );
}
