import "server-only";
import { createClient } from "@/lib/supabase/server";

export async function getVendorShell(vendorId: string) {
  const supabase = await createClient();
  const [{ data: vendor }, { count: unread }, { count: needsResponse }] = await Promise.all([
    supabase.from("vendors").select("id, slug, name, tagline, avatar_url, status, verification, is_demo").eq("id", vendorId).single(),
    supabase.from("notifications").select("id", { count: "exact", head: true }).eq("audience", "vendor").eq("vendor_id", vendorId).is("read_at", null),
    supabase.from("orders").select("id", { count: "exact", head: true }).eq("vendor_id", vendorId).eq("status", "new"),
  ]);
  return { vendor, unread: unread ?? 0, needsResponse: needsResponse ?? 0 };
}

export const ORDER_FILTERS: Record<string, { label: string; statuses: string[] }> = {
  all: { label: "All", statuses: [] },
  new: { label: "Needs response", statuses: ["new"] },
  active: { label: "Active", statuses: ["accepted", "in_progress", "completed"] },
  payment: { label: "To submit", statuses: ["payment_recorded"] },
  submitted: { label: "With Tarkkash", statuses: ["submitted"] },
  closed: { label: "Closed", statuses: ["closed"] },
  lost: { label: "Declined / cancelled", statuses: ["declined", "cancelled"] },
};

export async function getVendorOrders(vendorId: string, filter: string, page = 1, pageSize = 20) {
  const supabase = await createClient();
  const f = ORDER_FILTERS[filter] ?? ORDER_FILTERS.all!;
  let q = supabase.from("orders")
    .select("id, ref_code, title, status, agreed_amount, scheduled_for, created_at, customer_display_name, is_demo, enquiries(ref_code, preferred_date)", { count: "exact" })
    .eq("vendor_id", vendorId).order("created_at", { ascending: false }).range((page - 1) * pageSize, page * pageSize - 1);
  if (f.statuses.length) q = q.in("status", f.statuses as never);
  const { data, count } = await q;
  const counts: Record<string, number> = {};
  const { data: all } = await supabase.from("orders").select("status").eq("vendor_id", vendorId);
  for (const [k, def] of Object.entries(ORDER_FILTERS)) counts[k] = def.statuses.length ? (all ?? []).filter((o) => def.statuses.includes(o.status)).length : (all ?? []).length;
  return { orders: data ?? [], total: count ?? 0, counts };
}

export async function getVendorOrder(orderId: string) {
  const supabase = await createClient();
  const { data: order } = await supabase.from("orders")
    .select("*, services(title, price_type, price_amount, price_unit), vendors(name, slug), enquiries(ref_code, request, preferred_date, preferred_time, locality, details, assist_opt_in, assist_fee, source, created_at)")
    .eq("id", orderId).maybeSingle();
  if (!order) return null;
  const [{ data: history }, { data: payments }] = await Promise.all([
    supabase.from("order_status_history").select("id, from_status, to_status, actor_role, note, created_at").eq("order_id", orderId).order("created_at"),
    supabase.from("payments").select("id, amount, method, status, transaction_ref, created_at").eq("order_id", orderId).order("created_at"),
  ]);
  return { order, history: history ?? [], payments: payments ?? [] };
}
