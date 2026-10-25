"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  transitionSchema, orderUpdateSchema, paymentSchema, serviceSchema, vendorProfileSchema, vendorApplicationSchema,
  fieldErrors, type ServiceInput, type VendorApplicationInput, type OrderStatus,
} from "@/lib/validation";
import { friendlyError, fail, type ActionResult } from "@/lib/errors";
import type { z } from "zod";

function revalidateOrder(orderId: string) {
  revalidatePath("/vendor/orders");
  revalidatePath(`/vendor/orders/${orderId}`);
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin/enquiries");
}

/** Move an order along its lifecycle. Allowed transitions and roles are enforced in the database. */
export async function transitionOrder(input: { orderId: string; to: OrderStatus; note?: string }): Promise<ActionResult<{ status: OrderStatus }>> {
  const parsed = transitionSchema.safeParse(input);
  if (!parsed.success) return fail("Please check the details.", fieldErrors(parsed.error));
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("transition_order", {
    p_order: parsed.data.orderId, p_to: parsed.data.to, p_note: parsed.data.note,
  });
  if (error) return fail(friendlyError(error));
  revalidateOrder(parsed.data.orderId);
  return { ok: true, data: { status: (data as { status: OrderStatus }).status } };
}

export async function updateOrder(input: z.input<typeof orderUpdateSchema>): Promise<ActionResult> {
  const parsed = orderUpdateSchema.safeParse(input);
  if (!parsed.success) return fail("Please check the highlighted fields.", fieldErrors(parsed.error));
  const v = parsed.data;
  const supabase = await createClient();
  const { error } = await supabase.rpc("vendor_update_order", {
    p_order: v.orderId,
    // Every argument must be sent (null when empty) so PostgREST can match the function signature.
    p_amount: (v.agreedAmount ?? null) as number,
    p_scheduled: (v.scheduledFor ?? null) as string,
    p_scope: (v.scope ?? null) as string,
    p_notes: (v.notes ?? null) as string,
  });
  if (error) return fail(friendlyError(error));
  revalidateOrder(v.orderId);
  return { ok: true, data: undefined };
}

export async function recordPayment(input: z.input<typeof paymentSchema>): Promise<ActionResult> {
  const parsed = paymentSchema.safeParse(input);
  if (!parsed.success) return fail("Please check the highlighted fields.", fieldErrors(parsed.error));
  const v = parsed.data;
  const supabase = await createClient();
  const { error } = await supabase.rpc("record_payment", {
    p_order: v.orderId, p_amount: v.amount, p_method: v.method, p_ref: v.reference, p_evidence: v.evidenceUrl,
  });
  if (error) return fail(friendlyError(error));
  revalidateOrder(v.orderId);
  return { ok: true, data: undefined };
}

/** Customer contact for an accepted order (audited). */
export async function getOrderContact(orderId: string): Promise<ActionResult<{ available: boolean; name?: string; email?: string | null; phone?: string | null; reason?: string }>> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("order_contact", { p_order: orderId });
  if (error) return fail(friendlyError(error));
  return { ok: true, data: data as { available: boolean } };
}

export async function saveService(input: ServiceInput): Promise<ActionResult<{ id: string }>> {
  const parsed = serviceSchema.safeParse(input);
  if (!parsed.success) return fail("Please check the highlighted fields.", fieldErrors(parsed.error));
  const v = parsed.data;
  const supabase = await createClient();
  const { data: vendor } = await supabase.from("vendors").select("primary_category_id").eq("id", v.vendorId).single();
  const row = {
    vendor_id: v.vendorId,
    category_id: vendor?.primary_category_id ?? null,
    title: v.title,
    description: v.description ?? null,
    price_type: v.priceType,
    price_amount: v.priceType === "quote" ? null : (v.priceAmount ?? null),
    price_unit: v.priceUnit ?? null,
    lead_time: v.leadTime ?? null,
    delivery_options: v.deliveryOptions,
    availability: v.availability ?? null,
    image_url: v.imageUrl ?? null,
    active: v.active,
  };
  const query = v.id
    ? supabase.from("services").update(row).eq("id", v.id).eq("vendor_id", v.vendorId).select("id").single()
    : supabase.from("services").insert(row).select("id").single();
  const { data, error } = await query;
  if (error || !data) return fail(friendlyError(error));
  revalidatePath("/vendor/services");
  return { ok: true, data: { id: data.id } };
}

/** Services are deactivated rather than deleted so past enquiries keep their context. */
export async function setServiceActive(serviceId: string, active: boolean): Promise<ActionResult> {
  const supabase = await createClient();
  const { error, count } = await supabase.from("services").update({ active }, { count: "exact" }).eq("id", serviceId);
  if (error) return fail(friendlyError(error));
  if (!count) return fail("You do not have access to this service.");
  revalidatePath("/vendor/services");
  return { ok: true, data: undefined };
}

export async function updateVendorProfile(input: z.input<typeof vendorProfileSchema>): Promise<ActionResult> {
  const parsed = vendorProfileSchema.safeParse(input);
  if (!parsed.success) return fail("Please check the highlighted fields.", fieldErrors(parsed.error));
  const v = parsed.data;
  const supabase = await createClient();
  const { error, count } = await supabase.from("vendors").update({
    name: v.name, tagline: v.tagline ?? null, description: v.description ?? null, locality: v.locality,
    service_area: v.serviceArea, languages: v.languages, highlights: v.highlights, key_terms: v.keyTerms ?? null,
    years_experience: v.yearsExperience ?? null, avatar_url: v.avatarUrl ?? null, cover_url: v.coverUrl ?? null,
  }, { count: "exact" }).eq("id", v.vendorId);
  if (error) return fail(friendlyError(error));
  if (!count) return fail("You do not have access to this listing.");
  revalidatePath("/vendor/profile");
  return { ok: true, data: undefined };
}

export async function addGalleryImage(vendorId: string, url: string, caption?: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("vendor_media").insert({ vendor_id: vendorId, url, caption: caption ?? null });
  if (error) return fail(friendlyError(error));
  revalidatePath("/vendor/profile");
  return { ok: true, data: undefined };
}

export async function removeGalleryImage(mediaId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("vendor_media").delete().eq("id", mediaId);
  if (error) return fail(friendlyError(error));
  revalidatePath("/vendor/profile");
  return { ok: true, data: undefined };
}

export async function postVendorUpdate(vendorId: string, title: string, body?: string): Promise<ActionResult> {
  const t = title.trim();
  if (t.length < 3 || t.length > 120) return fail("Add a short title (3–120 characters).");
  const supabase = await createClient();
  const { error } = await supabase.from("vendor_updates").insert({ vendor_id: vendorId, title: t, body: body?.trim().slice(0, 1000) || null });
  if (error) return fail(friendlyError(error));
  revalidatePath("/vendor/followers");
  return { ok: true, data: undefined };
}

/** "List your service" application from a signed-in user. */
export async function applyAsVendor(input: VendorApplicationInput): Promise<ActionResult<{ vendorId: string; refCode: string }>> {
  const parsed = vendorApplicationSchema.safeParse(input);
  if (!parsed.success) return fail("Please check the highlighted fields.", fieldErrors(parsed.error));
  const v = parsed.data;
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_vendor_application", {
    p: {
      business_name: v.businessName, category_id: v.categoryId, locality: v.locality, city: v.city,
      tagline: v.tagline ?? null, description: v.description ?? null, service_area: v.serviceArea ?? null, phone: v.phone ?? null,
    },
  });
  if (error) return fail(friendlyError(error));
  const r = data as { vendor_id: string; ref_code: string };
  return { ok: true, data: { vendorId: r.vendor_id, refCode: r.ref_code } };
}

export async function markNotificationsRead(ids?: string[]): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("mark_notifications_read", { p_ids: ids });
  if (error) return fail(friendlyError(error));
  return { ok: true, data: undefined };
}
