// notify-dispatch: delivers one Tarkkash notification by email (Resend) and WhatsApp (Meta Cloud API).
//
// Called by the database (pg_net) right after a row is inserted into public.notifications.
// The body only carries the notification id. The function loads the row with the service role and
// sends it only if it is recent and not yet dispatched, so calling it by hand cannot spam anyone.
import { createClient } from "npm:@supabase/supabase-js@2.49.4";

const SITE = Deno.env.get("SITE_URL") ?? "https://www.tarkkash.com";
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
const MAIL_FROM = Deno.env.get("MAIL_FROM") ?? "Tarkkash <notifications@tarkkash.com>";
const WA_TOKEN = Deno.env.get("WHATSAPP_TOKEN") ?? "";
const WA_PHONE_ID = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID") ?? "";
const WA_TEMPLATE = Deno.env.get("WHATSAPP_TEMPLATE") ?? "hello_world";
const WA_LANG = Deno.env.get("WHATSAPP_TEMPLATE_LANG") ?? (WA_TEMPLATE === "hello_world" ? "en_US" : "en");
const MAX_AGE_MS = 10 * 60 * 1000;

const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
  auth: { persistSession: false },
});

type Notification = {
  id: string; audience: "admin" | "vendor" | "user" | "customer"; vendor_id: string | null; user_id: string | null;
  customer_id: string | null; event: string | null; title: string; body: string | null; link: string | null;
  created_at: string; dispatched_at: string | null;
};
type Settings = { email_enabled?: boolean; whatsapp_enabled?: boolean; demo_email?: string | null; demo_whatsapp?: string | null };
type Recipient = { email?: string | null; phone?: string | null; demo: boolean; email_ok: boolean; whatsapp_ok: boolean };
type Delivery = { channel: "email" | "whatsapp"; recipient: string; redirected_from?: string | null; status: "sent" | "failed" | "skipped"; provider_id?: string | null; detail?: string | null };

const isDemoEmail = (e?: string | null) => !!e && e.toLowerCase().endsWith("@example.com");

/** Indian numbers to WhatsApp format: digits only, country code 91 added to 10-digit numbers. */
export function normalisePhone(raw?: string | null): string | null {
  if (!raw) return null;
  let d = raw.replace(/[^0-9]/g, "");
  if (d.length === 11 && d.startsWith("0")) d = d.slice(1);
  if (d.length === 10) d = "91" + d;
  return d.length >= 11 && d.length <= 15 ? d : null;
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
// WhatsApp template parameters may not contain new lines, tabs or long runs of spaces.
const waText = (s: string) => s.replace(/[\r\n\t]+/g, " ").replace(/ {2,}/g, " ").trim().slice(0, 900) || "-";

function emailHtml(title: string, body: string, url: string): string {
  return `<!doctype html><html><body style="margin:0;background:#fbf8f0;font-family:Inter,Arial,sans-serif;color:#122b3a">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fbf8f0;padding:32px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #e4e0d7;border-radius:16px;overflow:hidden">
<tr><td style="background:#003b3c;padding:20px 28px"><img src="${SITE}/brand/tarkaash-logo-gold.png" alt="Tarkkash" height="48" style="display:block;height:48px"></td></tr>
<tr><td style="padding:28px">
<h1 style="margin:0 0 12px;font-family:Georgia,serif;font-size:22px;line-height:1.3;color:#003b3c">${esc(title)}</h1>
<p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#5c6b73">${esc(body)}</p>
<a href="${url}" style="display:inline-block;background:#003b3c;color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;padding:12px 22px;border-radius:10px">Open in Tarkkash</a>
</td></tr>
<tr><td style="padding:16px 28px;border-top:1px solid #e4e0d7;font-size:12px;color:#5c6b73">Tarkkash · Har Hunar Ko Ek Pehchaan · Hyderabad</td></tr>
</table></td></tr></table></body></html>`;
}

async function sendEmail(to: string, title: string, body: string, url: string): Promise<Omit<Delivery, "channel" | "recipient">> {
  if (!RESEND_API_KEY) return { status: "skipped", detail: "Email is not set up yet (RESEND_API_KEY missing)" };
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: MAIL_FROM, to: [to], subject: title, html: emailHtml(title, body, url), text: `${title}\n\n${body}\n\n${url}` }),
  });
  const j = await r.json().catch(() => ({}));
  return r.ok ? { status: "sent", provider_id: j.id ?? null } : { status: "failed", detail: (j.message ?? `HTTP ${r.status}`).slice(0, 300) };
}

async function sendWhatsApp(to: string, title: string, body: string, url: string): Promise<Omit<Delivery, "channel" | "recipient">> {
  if (!WA_TOKEN || !WA_PHONE_ID) return { status: "skipped", detail: "WhatsApp is not set up yet (token or phone number id missing)" };
  const template: Record<string, unknown> = { name: WA_TEMPLATE, language: { code: WA_LANG } };
  if (WA_TEMPLATE !== "hello_world") {
    template.components = [{ type: "body", parameters: [waText(title), waText(body), waText(url)].map((text) => ({ type: "text", text })) }];
  }
  const r = await fetch(`https://graph.facebook.com/v21.0/${WA_PHONE_ID}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${WA_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ messaging_product: "whatsapp", to, type: "template", template }),
  });
  const j = await r.json().catch(() => ({}));
  return r.ok
    ? { status: "sent", provider_id: j.messages?.[0]?.id ?? null }
    : { status: "failed", detail: (j.error?.error_user_msg ?? j.error?.message ?? `HTTP ${r.status}`).slice(0, 300) };
}

async function recipientsFor(n: Notification): Promise<Recipient[]> {
  if (n.audience === "admin") {
    const { data } = await db.from("profiles").select("email, phone").eq("role", "admin").is("blocked_at", null);
    return (data ?? []).map((p) => ({ email: p.email, phone: p.phone, demo: isDemoEmail(p.email), email_ok: true, whatsapp_ok: true }));
  }
  if (n.audience === "vendor" && n.vendor_id) {
    const { data: v } = await db.from("vendors").select("phone, is_demo").eq("id", n.vendor_id).single();
    const { data: members } = await db.from("vendor_members").select("profiles(email, phone)").eq("vendor_id", n.vendor_id);
    const people = (members ?? []).map((m) => (m as unknown as { profiles: { email: string | null; phone: string | null } }).profiles).filter(Boolean);
    const out: Recipient[] = people.map((p) => ({ email: p.email, phone: null, demo: !!v?.is_demo || isDemoEmail(p.email), email_ok: true, whatsapp_ok: false }));
    const phone = v?.phone ?? people.find((p) => p.phone)?.phone ?? null;
    out.push({ email: null, phone, demo: !!v?.is_demo, email_ok: false, whatsapp_ok: true });
    return out;
  }
  if (n.audience === "user" && n.user_id) {
    const { data: p } = await db.from("profiles").select("email, phone").eq("id", n.user_id).single();
    return p ? [{ email: p.email, phone: p.phone, demo: isDemoEmail(p.email), email_ok: true, whatsapp_ok: true }] : [];
  }
  if (n.audience === "customer" && n.customer_id) {
    const { data: c } = await db.from("customers").select("email, phone, is_demo, comm_prefs").eq("id", n.customer_id).single();
    if (!c) return [];
    const prefs = (c.comm_prefs ?? {}) as { email?: boolean; whatsapp?: boolean };
    const demo = c.is_demo || isDemoEmail(c.email);
    return [{ email: c.email, phone: c.phone, demo, email_ok: demo || prefs.email !== false, whatsapp_ok: demo || prefs.whatsapp !== false }];
  }
  return [];
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  const { notification_id } = await req.json().catch(() => ({}));
  if (typeof notification_id !== "string") return Response.json({ ok: false, error: "notification_id required" }, { status: 400 });

  // Claim the row: only recent, undispatched notifications are sent, and only once.
  const since = new Date(Date.now() - MAX_AGE_MS).toISOString();
  const { data: claimed } = await db.from("notifications").update({ dispatched_at: new Date().toISOString() })
    .eq("id", notification_id).is("dispatched_at", null).gte("created_at", since).select("*");
  const n = claimed?.[0] as Notification | undefined;
  if (!n) return Response.json({ ok: true, skipped: "not found, too old or already sent" });

  const { data: s } = await db.from("settings").select("value").eq("key", "notifications").single();
  const settings = (s?.value ?? {}) as Settings;
  const url = n.link ? new URL(n.link, SITE).toString() : SITE;
  const body = n.body ?? "";

  const deliveries: Delivery[] = [];
  const seen = new Set<string>();
  for (const r of await recipientsFor(n)) {
    if (r.email_ok && r.email) {
      const to = r.demo ? settings.demo_email ?? null : r.email;
      const key = `e:${to}`;
      if (!to) deliveries.push({ channel: "email", recipient: r.email, status: "skipped", detail: "Demo account: set a demo email in Admin > Settings" });
      else if (!seen.has(key)) {
        seen.add(key);
        const res = settings.email_enabled === false ? { status: "skipped" as const, detail: "Email turned off in settings" } : await sendEmail(to, n.title, body, url);
        deliveries.push({ channel: "email", recipient: to, redirected_from: r.demo ? r.email : null, ...res });
      }
    }
    if (r.whatsapp_ok && (r.phone || r.demo)) {
      const to = normalisePhone(r.demo ? settings.demo_whatsapp : r.phone);
      const key = `w:${to}`;
      if (!to) deliveries.push({ channel: "whatsapp", recipient: r.phone ?? "none", status: "skipped", detail: r.demo ? "Demo account: set a demo WhatsApp number in Admin > Settings" : "No valid phone number" });
      else if (!seen.has(key)) {
        seen.add(key);
        const res = settings.whatsapp_enabled === false ? { status: "skipped" as const, detail: "WhatsApp turned off in settings" } : await sendWhatsApp(to, n.title, body, url);
        deliveries.push({ channel: "whatsapp", recipient: "+" + to, redirected_from: r.demo ? r.phone ?? null : null, ...res });
      }
    }
  }

  if (deliveries.length) await db.from("notification_deliveries").insert(deliveries.map((d) => ({ ...d, notification_id: n.id })));
  return Response.json({ ok: true, deliveries: deliveries.map((d) => ({ channel: d.channel, status: d.status })) });
});
