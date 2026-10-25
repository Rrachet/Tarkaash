"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { friendlyError, fail, type ActionResult } from "@/lib/errors";
import { fieldErrors } from "@/lib/validation";
import type { Database, Json } from "@/lib/types/database";

type Enums = Database["public"]["Enums"];
const id = z.uuid();

function revalidateAdmin() {
  revalidatePath("/admin", "layout");
}

export async function assignEnquiry(enquiryId: string, vendorId: string, note?: string): Promise<ActionResult<{ orderId: string; refCode: string }>> {
  if (!id.safeParse(enquiryId).success || !id.safeParse(vendorId).success) return fail("Choose a vendor.");
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_assign_enquiry", { p_enquiry: enquiryId, p_vendor: vendorId, p_note: note?.slice(0, 500) });
  if (error) return fail(friendlyError(error));
  revalidateAdmin();
  const o = data as { id: string; ref_code: string };
  return { ok: true, data: { orderId: o.id, refCode: o.ref_code } };
}

export async function setEnquiryStatus(enquiryId: string, status: Enums["enquiry_status"], note?: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_set_enquiry_status", { p_enquiry: enquiryId, p_status: status, p_note: note?.slice(0, 500) });
  if (error) return fail(friendlyError(error));
  revalidateAdmin();
  return { ok: true, data: undefined };
}

export async function addEnquiryNote(enquiryId: string, note: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_add_enquiry_note", { p_enquiry: enquiryId, p_note: note.slice(0, 1000) });
  if (error) return fail(friendlyError(error));
  revalidatePath(`/admin/enquiries/${enquiryId}`);
  return { ok: true, data: undefined };
}

export async function setVendorStatus(vendorId: string, status: Enums["vendor_status"], note?: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_set_vendor_status", { p_vendor: vendorId, p_status: status, p_note: note?.slice(0, 500) });
  if (error) return fail(friendlyError(error));
  revalidateAdmin();
  revalidatePath("/", "layout");
  return { ok: true, data: undefined };
}

export async function setVerification(vendorId: string, checks: Record<string, boolean>): Promise<ActionResult<{ status: Enums["verification_status"] }>> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_set_verification", { p_vendor: vendorId, p_checks: checks });
  if (error) return fail(friendlyError(error));
  revalidateAdmin();
  return { ok: true, data: { status: data as Enums["verification_status"] } };
}

export async function moderateReview(reviewId: string, status: Enums["moderation_status"]): Promise<ActionResult> {
  const supabase = await createClient();
  const { error, count } = await supabase.from("reviews").update({ status }, { count: "exact" }).eq("id", reviewId);
  if (error) return fail(friendlyError(error));
  if (!count) return fail("Review not found or you do not have access.");
  revalidateAdmin();
  return { ok: true, data: undefined };
}

export async function updateTicket(ticketId: string, status: Enums["ticket_status"], assignToMe = false): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_update_ticket", { p_ticket: ticketId, p_status: status, p_assign_me: assignToMe });
  if (error) return fail(friendlyError(error));
  revalidateAdmin();
  return { ok: true, data: undefined };
}

export async function setPaymentStatus(paymentId: string, status: Enums["payment_status"]): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("staff_set_payment_status", { p_payment: paymentId, p_status: status });
  if (error) return fail(friendlyError(error));
  revalidateAdmin();
  return { ok: true, data: undefined };
}

export async function setUserRole(userId: string, role: Enums["app_role"]): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_set_role", { p_user: userId, p_role: role });
  if (error) return fail(friendlyError(error));
  revalidateAdmin();
  return { ok: true, data: undefined };
}

export async function linkVendorMember(vendorId: string, email: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_link_vendor_member", { p_vendor: vendorId, p_email: email });
  if (error) return fail(friendlyError(error));
  revalidateAdmin();
  return { ok: true, data: undefined };
}

const SETTING_SCHEMAS = {
  assist: z.object({ enabled: z.boolean(), fee: z.number().min(0).max(10000), currency: z.literal("INR"), approved: z.boolean(), label: z.string().min(2).max(40) }),
  commission: z.object({ pct: z.number().min(0).max(50), approved: z.boolean() }),
  boost_thresholds: z.object({
    low_views: z.number().int().min(0), high_views: z.number().int().min(0), min_enquiry_rate: z.number().min(0).max(1),
    slow_response_hours: z.number().int().min(1), min_enquiries_for_response: z.number().int().min(1),
    cancel_ratio: z.number().min(0).max(1), min_rating: z.number().min(1).max(5), min_completeness: z.number().int().min(0).max(100),
  }),
  contact: z.object({ email: z.email().nullable(), phone: z.string().max(20).nullable(), address: z.string().max(200).nullable(), confirmed: z.boolean() }),
  enquiry: z.object({ auto_assign_requested_vendor: z.boolean(), max_per_contact_per_hour: z.number().int().min(1).max(100) }),
} as const;
export type SettingKey = keyof typeof SETTING_SCHEMAS;

/** Update a configurable setting (fees, thresholds, contact). Validated per key; audited via updated_by. */
export async function updateSetting(key: SettingKey, value: unknown): Promise<ActionResult> {
  const schema = SETTING_SCHEMAS[key];
  if (!schema) return fail("Unknown setting.");
  const parsed = schema.safeParse(value);
  if (!parsed.success) return fail("Please check the values.", fieldErrors(parsed.error));
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { error, count } = await supabase.from("settings")
    .update({ value: parsed.data as Json, updated_by: user?.id ?? null, updated_at: new Date().toISOString() }, { count: "exact" })
    .eq("key", key);
  if (error) return fail(friendlyError(error));
  if (!count) return fail("Only admins can change settings.");
  revalidatePath("/", "layout");
  return { ok: true, data: undefined };
}

const costSchema = z.object({
  costType: z.enum(["direct", "operating"]),
  label: z.string().trim().min(2).max(120),
  amount: z.coerce.number().min(0).max(100_000_000),
  incurredOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  basis: z.enum(["actual", "accrued", "forecast"]).default("actual"),
});

export async function addCostEntry(input: z.input<typeof costSchema>): Promise<ActionResult> {
  const parsed = costSchema.safeParse(input);
  if (!parsed.success) return fail("Please check the highlighted fields.", fieldErrors(parsed.error));
  const v = parsed.data;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { error } = await supabase.from("cost_entries").insert({
    cost_type: v.costType, label: v.label, amount: v.amount, incurred_on: v.incurredOn, basis: v.basis, created_by: user?.id ?? null,
  });
  if (error) return fail(friendlyError(error));
  revalidatePath("/admin/commercial");
  return { ok: true, data: undefined };
}

export async function setLedgerReconciled(ledgerId: string, reconciled: boolean): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("platform_ledger")
    .update({ reconciliation: reconciled ? "reconciled" : "pending", basis: reconciled ? "actual" : "accrued" })
    .eq("id", ledgerId);
  if (error) return fail(friendlyError(error));
  revalidatePath("/admin/commercial");
  return { ok: true, data: undefined };
}
