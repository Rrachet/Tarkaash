"use client";

import { useState, useTransition } from "react";
import { Mail, MessageCircle } from "lucide-react";
import { updateCommPrefs } from "@/lib/actions/customer";
import { useToast } from "@/components/ui/toast";

type Prefs = { email: boolean; sms: boolean; whatsapp: boolean };

/** Lets a customer choose how Tarkkash sends enquiry and order updates. */
export function CommPrefs({ initial, phone }: { initial: Prefs; phone: string | null }) {
  const [prefs, setPrefs] = useState<Prefs>(initial);
  const [pending, start] = useTransition();
  const toast = useToast();
  const toggle = (k: "email" | "whatsapp") => {
    const next = { ...prefs, [k]: !prefs[k] };
    setPrefs(next);
    start(async () => {
      const r = await updateCommPrefs(next);
      if (r.ok) toast("success", "Preferences saved"); else { setPrefs(prefs); toast("error", r.error); }
    });
  };
  const rows = [
    { k: "email" as const, icon: Mail, label: "Email updates", hint: "Enquiry received, provider confirmed, order completed." },
    { k: "whatsapp" as const, icon: MessageCircle, label: "WhatsApp updates", hint: phone ? `Sent to ${phone}` : "Add a phone number on your next enquiry to receive these." },
  ];
  return (
    <div className="card p-5">
      <h2 className="font-sans text-base font-semibold">How we keep you updated</h2>
      <ul className="mt-3 space-y-3">
        {rows.map(({ k, icon: I, label, hint }) => (
          <li key={k} className="flex items-start gap-3">
            <I className="mt-0.5 size-5 shrink-0 text-teal" aria-hidden />
            <div className="min-w-0 flex-1"><p className="text-sm font-semibold">{label}</p><p className="text-xs text-slate">{hint}</p></div>
            <button type="button" role="switch" aria-checked={prefs[k]} aria-label={label} disabled={pending} onClick={() => toggle(k)}
              className={`relative h-6 w-11 shrink-0 rounded-full transition ${prefs[k] ? "bg-teal" : "bg-line"}`}>
              <span className={`absolute top-0.5 size-5 rounded-full bg-white shadow transition-all ${prefs[k] ? "left-[1.375rem]" : "left-0.5"}`} />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
