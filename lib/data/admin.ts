import "server-only";
import { createClient } from "@/lib/supabase/server";

export async function getAdminCounts() {
  const supabase = await createClient();
  const [unassigned, submitted, pendingVendors, pendingReviews, openTickets, unread] = await Promise.all([
    supabase.from("enquiries").select("id", { count: "exact", head: true }).eq("status", "new"),
    supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", "submitted"),
    supabase.from("vendors").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("reviews").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("support_tickets").select("id", { count: "exact", head: true }).in("status", ["open", "in_progress"]),
    supabase.from("notifications").select("id", { count: "exact", head: true }).eq("audience", "admin").is("read_at", null),
  ]);
  return {
    unassigned: unassigned.count ?? 0, submitted: submitted.count ?? 0, pendingVendors: pendingVendors.count ?? 0,
    pendingReviews: pendingReviews.count ?? 0, openTickets: openTickets.count ?? 0, unread: unread.count ?? 0,
  };
}

export const ENQUIRY_TABS: Record<string, { label: string; statuses: string[] }> = {
  new: { label: "Unassigned", statuses: ["new"] },
  assigned: { label: "Awaiting vendor", statuses: ["assigned"] },
  in_fulfilment: { label: "In fulfilment", statuses: ["in_fulfilment"] },
  closed: { label: "Closed", statuses: ["closed"] },
  cancelled: { label: "Cancelled / spam", statuses: ["cancelled", "spam"] },
  all: { label: "All", statuses: [] },
};

export async function getEnquiries(tab: string, page = 1, q?: string) {
  const supabase = await createClient();
  const t = ENQUIRY_TABS[tab] ?? ENQUIRY_TABS.new!;
  let query = supabase.from("enquiries")
    .select("id, ref_code, status, request, preferred_date, locality, assist_opt_in, source, created_at, is_demo, customers(name), categories(name), services(title), requested:vendors!enquiries_requested_vendor_id_fkey(name), assigned:vendors!enquiries_vendor_id_fkey(name)", { count: "exact" })
    .order("created_at", { ascending: tab === "new" }).range((page - 1) * 25, page * 25 - 1);
  if (t.statuses.length) query = query.in("status", t.statuses as never);
  if (q) query = query.ilike("ref_code", `%${q.trim()}%`);
  const { data, count } = await query;
  return { rows: data ?? [], total: count ?? 0 };
}

export async function getEnquiryDetail(id: string) {
  const supabase = await createClient();
  const { data: e } = await supabase.from("enquiries")
    .select("*, customers(name, email, phone, consent_at), categories(id, name), services(id, title, price_type, price_amount, price_unit), requested:vendors!enquiries_requested_vendor_id_fkey(id, name, slug), assigned:vendors!enquiries_vendor_id_fkey(id, name, slug)")
    .eq("id", id).maybeSingle();
  if (!e) return null;
  const [{ data: events }, { data: orders }, { data: vendors }] = await Promise.all([
    supabase.from("enquiry_events").select("id, action, from_status, to_status, note, created_at, vendors(name)").eq("enquiry_id", id).order("created_at"),
    supabase.from("orders").select("id, ref_code, status, vendors(name), created_at").eq("enquiry_id", id).order("created_at"),
    supabase.from("vendors").select("id, name, locality, primary_category_id, verification").eq("status", "active").order("name"),
  ]);
  return { enquiry: e, events: events ?? [], orders: orders ?? [], vendors: vendors ?? [] };
}

export async function getAdminOrders(status: string, page = 1) {
  const supabase = await createClient();
  let q = supabase.from("orders")
    .select("id, ref_code, title, status, agreed_amount, created_at, customer_display_name, vendors(name)", { count: "exact" })
    .order("created_at", { ascending: false }).range((page - 1) * 25, page * 25 - 1);
  if (status !== "all") q = q.eq("status", status as never);
  const { data, count } = await q;
  return { rows: data ?? [], total: count ?? 0 };
}
