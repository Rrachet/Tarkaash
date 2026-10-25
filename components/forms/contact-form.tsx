"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { CheckCircle2, Send } from "lucide-react";
import { submitTicket } from "@/lib/actions/public";
import { Field, Input, Select, Textarea, Checkbox, FormMessage } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import type { TicketInput } from "@/lib/validation";

export function ContactForm({ initialTopic, initialMessage }: { initialTopic?: string; initialMessage?: string }) {
  const [fe, setFe] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [ref, setRef] = useState<string | null>(null);
  const [pending, start] = useTransition();

  if (ref) {
    return (
      <div className="mt-6 rounded-2xl bg-mint p-6 text-center" role="status">
        <CheckCircle2 className="mx-auto size-10 text-success" />
        <p className="mt-3 text-lg font-semibold">Thanks — your message is with our team.</p>
        <p className="mt-1 text-sm text-ink/80">Reference <strong className="font-mono">{ref}</strong>. We usually reply within one working day.</p>
        <button type="button" onClick={() => setRef(null)} className="mt-4 text-sm font-semibold text-teal hover:underline">Send another message</button>
      </div>
    );
  }

  return (
    <form id="contact-form" className="mt-6 space-y-4 scroll-mt-28" noValidate onSubmit={(e) => {
      e.preventDefault();
      const fd = new FormData(e.currentTarget);
      setFe({}); setError(null);
      start(async () => {
        const r = await submitTicket({
          name: String(fd.get("name") ?? ""), email: String(fd.get("email") ?? ""), phone: String(fd.get("phone") ?? ""),
          topic: String(fd.get("topic") ?? "") as TicketInput["topic"], message: String(fd.get("message") ?? ""),
          consent: (fd.get("consent") === "on") as true,
        });
        if (r.ok) setRef(r.data.refCode); else { setError(r.error); setFe(r.fieldErrors ?? {}); }
      });
    }}>
      {error && <FormMessage>{error}</FormMessage>}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Your name" name="name" required error={fe.name}><Input name="name" autoComplete="name" error={fe.name} /></Field>
        <Field label="Email address" name="email" required error={fe.email}><Input name="email" type="email" autoComplete="email" error={fe.email} /></Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Phone (optional)" name="phone" error={fe.phone}><Input name="phone" type="tel" error={fe.phone} /></Field>
        <Field label="Subject" name="topic" required error={fe.topic}>
          <Select name="topic" defaultValue={initialTopic ?? ""} error={fe.topic}>
            <option value="" disabled>Select a topic</option>
            <option value="listing">List my service</option><option value="support">Customer support</option>
            <option value="feature">Feature suggestion</option><option value="partnership">Partnership / collaboration</option>
            <option value="general">General enquiry</option>
          </Select>
        </Field>
      </div>
      <Field label="Message" name="message" required error={fe.message}><Textarea name="message" defaultValue={initialMessage} placeholder="Tell us more…" error={fe.message} /></Field>
      <Checkbox name="consent" error={fe.consent} label={<>I agree to Tarkaash storing my details to respond to this message (<Link href="/privacy" className="font-semibold text-teal underline">privacy notice</Link>).</>} />
      <Button type="submit" size="lg" loading={pending}>{!pending && <Send className="size-4" />}Send message</Button>
    </form>
  );
}
