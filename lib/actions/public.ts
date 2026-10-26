"use server";

import { cookies } from "next/headers";
import { ENQUIRY_COOKIE, type EnquirySummary } from "@/lib/enquiry-summary";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { enquirySchema, ticketSchema, fieldErrors, type EnquiryInput, type TicketInput } from "@/lib/validation";
import { friendlyError, fail, type ActionResult } from "@/lib/errors";

/** Customer enquiry through Tarkaash. Works signed in or as a guest; idempotent per form instance. */
export async function submitEnquiry(input: EnquiryInput): Promise<ActionResult<{ id: string; refCode: string; duplicate: boolean }>> {
  const parsed = enquirySchema.safeParse(input);
  if (!parsed.success) return fail("Please check the highlighted fields.", fieldErrors(parsed.error));
  const v = parsed.data;
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("submit_enquiry", {
    p: {
      idempotency_key: v.idempotencyKey,
      name: v.name,
      email: v.email ?? null,
      phone: v.phone ?? null,
      request: v.request,
      vendor_id: v.vendorId ?? null,
      service_id: v.serviceId ?? null,
      category_id: v.categoryId ?? null,
      preferred_date: v.preferredDate ?? null,
      preferred_time: v.preferredTime ?? null,
      locality: v.locality ?? null,
      details: v.details,
      assist_opt_in: v.assistOptIn,
      consent: v.consent,
      source: v.source,
      session_id: v.sessionId ?? null,
    },
  });
  if (error) return fail(friendlyError(error));
  const r = data as { id: string; ref_code: string; duplicate: boolean };

  // Remember a summary of what this browser just sent, so the confirmation page can show it
  // to a guest without reading the enquiry from the database (guests cannot, by design).
  const [vendor, service] = await Promise.all([
    v.vendorId ? supabase.from("vendors").select("name, slug").eq("id", v.vendorId).maybeSingle() : Promise.resolve({ data: null }),
    v.serviceId ? supabase.from("services").select("title").eq("id", v.serviceId).maybeSingle() : Promise.resolve({ data: null }),
  ]);
  const summary: EnquirySummary = {
    ref: r.ref_code, duplicate: r.duplicate, vendor: vendor.data ?? null, service: service.data?.title ?? null,
    preferredDate: v.preferredDate ?? null, preferredTime: v.preferredTime ?? null, locality: v.locality ?? null,
    assist: v.assistOptIn, at: new Date().toISOString(),
  };
  (await cookies()).set(ENQUIRY_COOKIE, Buffer.from(JSON.stringify(summary)).toString("base64url"), {
    httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/enquiry", maxAge: 60 * 60 * 24 * 7,
  });
  return { ok: true, data: { id: r.id, refCode: r.ref_code, duplicate: r.duplicate } };
}

/** Contact form; routed to a queue by topic. */
export async function submitTicket(input: TicketInput): Promise<ActionResult<{ refCode: string }>> {
  const parsed = ticketSchema.safeParse(input);
  if (!parsed.success) return fail("Please check the highlighted fields.", fieldErrors(parsed.error));
  const v = parsed.data;
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("submit_ticket", {
    p: { name: v.name, email: v.email ?? null, phone: v.phone ?? null, topic: v.topic, message: v.message, consent: v.consent },
  });
  if (error) return fail(friendlyError(error));
  return { ok: true, data: { refCode: (data as { ref_code: string }).ref_code } };
}

const EVENT_TYPES = ["profile_view", "service_view", "search", "enquiry_start", "cta_click", "share", "category_view"] as const;
type EventType = (typeof EVENT_TYPES)[number];

/** Fire-and-forget analytics event. Never throws. */
export async function logEvent(input: {
  type: EventType;
  vendorId?: string;
  serviceId?: string;
  source?: string;
  sessionId?: string;
  path?: string;
  meta?: Record<string, string | number | boolean>;
}): Promise<void> {
  if (!EVENT_TYPES.includes(input.type)) return;
  try {
    const supabase = await createClient();
    await supabase.rpc("log_event", {
      p_type: input.type,
      p_vendor: input.vendorId,
      p_service: input.serviceId,
      p_source: input.source?.slice(0, 40),
      p_session: input.sessionId?.slice(0, 64),
      p_path: input.path?.slice(0, 200),
      p_meta: input.meta ?? {},
    });
  } catch {
    // analytics must never break the page
  }
}

/** Save / unsave a provider (likes) and follow / unfollow for updates. */
export async function toggleReaction(kind: "like" | "follow", vendorId: string, on: boolean): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return fail("Please sign in to save providers.");
  const table = kind === "like" ? "likes" : "follows";
  const { error } = on
    ? await supabase.from(table).upsert({ user_id: user.id, vendor_id: vendorId }, { onConflict: "user_id,vendor_id", ignoreDuplicates: true })
    : await supabase.from(table).delete().eq("user_id", user.id).eq("vendor_id", vendorId);
  if (error) return fail(friendlyError(error));
  revalidatePath("/account");
  return { ok: true, data: undefined };
}
