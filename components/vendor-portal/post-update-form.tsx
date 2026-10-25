"use client";

import { useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Megaphone } from "lucide-react";
import { postVendorUpdate } from "@/lib/actions/vendor";
import { Field, Input, Textarea } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

export function PostUpdateForm({ vendorId }: { vendorId: string }) {
  const [pending, start] = useTransition();
  const form = useRef<HTMLFormElement>(null);
  const toast = useToast();
  const router = useRouter();
  return (
    <form ref={form} className="card space-y-4 p-5" onSubmit={(e) => {
      e.preventDefault();
      const fd = new FormData(e.currentTarget);
      start(async () => {
        const r = await postVendorUpdate(vendorId, String(fd.get("title") ?? ""), String(fd.get("body") ?? ""));
        if (r.ok) { toast("success", "Update posted to your followers"); form.current?.reset(); router.refresh(); } else toast("error", r.error);
      });
    }}>
      <h2 className="flex items-center gap-2 font-sans text-base font-semibold"><Megaphone className="size-5 text-gold-600" />Post an update</h2>
      <Field label="Headline" name="title"><Input name="title" placeholder="e.g. Diwali hampers now open" maxLength={120} /></Field>
      <Field label="Details" name="body"><Textarea name="body" placeholder="Limited slots each day. Enquire through Tarkaash." maxLength={1000} /></Field>
      <Button type="submit" loading={pending}>Post update</Button>
    </form>
  );
}
