import "server-only";
import { createClient } from "@/lib/supabase/server";

export async function getAdminCounts() {
  const supabase = await createClient();
  const [unassigned, submitted, pendingVendors, pendingReviews, openTickets, unread, pServices, pUpdates, pMedia] = await Promise.all([
    supabase.from("enquiries").select("id", { count: "exact", head: true }).eq("status", "new"),
    supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", "submitted"),
    supabase.from("vendors").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("reviews").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("support_tickets").select("id", { count: "exact", head: true }).in("status", ["open", "in_progress"]),
    supabase.from("notifications").select("id", { count: "exact", head: true }).eq("audience", "admin").is("read_at", null),
    supabase.from("services").select("id", { count: "exact", head: true }).eq("moderation", "pending"),
    supabase.from("vendor_updates").select("id", { count: "exact", head: true }).eq("moderation", "pending"),
    supabase.from("vendor_media").select("id", { count: "exact", head: true }).eq("moderation", "pending"),
  ]);
  return {
    unassigned: unassigned.count ?? 0, submitted: submitted.count ?? 0, pendingVendors: pendingVendors.count ?? 0,
    pendingReviews: pendingReviews.count ?? 0, openTickets: openTickets.count ?? 0, unread: unread.count ?? 0,
    pendingContent: (pServices.count ?? 0) + (pUpdates.count ?? 0) + (pMedia.count ?? 0),
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


// ---------- Moderation, users and data centre ----------
export type ModerationItem = {
  id: string; kind: "service" | "update" | "media"; vendorId: string; vendorName: string; vendorSlug: string;
  title: string; body: string | null; image: string | null; extra: string | null;
  moderation: string; note: string | null; createdAt: string;
};

export async function getModerationQueue(kind: "service" | "update" | "media", status: string): Promise<ModerationItem[]> {
  const supabase = await createClient();
  const statuses = status === "all" ? ["pending", "approved", "rejected"] : [status];
  if (kind === "service") {
    const { data } = await supabase.from("services")
      .select("id, vendor_id, title, description, image_url, price_type, price_amount, price_unit, moderation, moderation_note, created_at, vendors(name, slug)")
      .in("moderation", statuses as ("pending" | "approved" | "rejected")[]).order("created_at", { ascending: false }).limit(100);
    return (data ?? []).map((s) => ({
      id: s.id, kind, vendorId: s.vendor_id, vendorName: s.vendors?.name ?? "", vendorSlug: s.vendors?.slug ?? "", title: s.title,
      body: s.description, image: s.image_url,
      extra: s.price_amount !== null ? `₹${Number(s.price_amount).toLocaleString("en-IN")}${s.price_unit ? ` ${s.price_unit}` : ""}` : "Quote",
      moderation: s.moderation, note: s.moderation_note, createdAt: s.created_at,
    }));
  }
  if (kind === "update") {
    const { data } = await supabase.from("vendor_updates")
      .select("id, vendor_id, title, body, moderation, moderation_note, created_at, vendors(name, slug)")
      .in("moderation", statuses as ("pending" | "approved" | "rejected")[]).order("created_at", { ascending: false }).limit(100);
    return (data ?? []).map((u) => ({
      id: u.id, kind, vendorId: u.vendor_id, vendorName: u.vendors?.name ?? "", vendorSlug: u.vendors?.slug ?? "", title: u.title,
      body: u.body, image: null, extra: null, moderation: u.moderation, note: u.moderation_note, createdAt: u.created_at,
    }));
  }
  const { data } = await supabase.from("vendor_media")
    .select("id, vendor_id, url, caption, moderation, moderation_note, created_at, vendors(name, slug)")
    .in("moderation", statuses as ("pending" | "approved" | "rejected")[]).order("created_at", { ascending: false }).limit(100);
  return (data ?? []).map((m) => ({
    id: m.id, kind, vendorId: m.vendor_id, vendorName: m.vendors?.name ?? "", vendorSlug: m.vendors?.slug ?? "", title: m.caption ?? "Gallery photo",
    body: null, image: m.url, extra: null, moderation: m.moderation, note: m.moderation_note, createdAt: m.created_at,
  }));
}

export async function getUsers(params: { q?: string; role?: string; blocked?: string; page?: number }) {
  const supabase = await createClient();
  const page = Math.max(1, params.page ?? 1);
  const role = ["customer", "vendor", "admin", "finance"].includes(params.role ?? "") ? (params.role as "customer" | "vendor" | "admin" | "finance") : undefined;
  const { data, error } = await supabase.rpc("admin_list_users", {
    p_search: params.q?.slice(0, 100) || undefined, p_role: role,
    p_blocked: params.blocked === "1" ? true : undefined, p_limit: 50, p_offset: (page - 1) * 50,
  });
  if (error) return { users: [], total: 0, page };
  return { users: data ?? [], total: Number(data?.[0]?.total ?? 0), page };
}

/** Row counts for every table that holds data people enter, for the data centre. */
export async function getDataCounts() {
  const supabase = await createClient();
  const tables = ["enquiries", "orders", "support_tickets", "reviews", "customers", "payments", "vendors", "services",
    "vendor_updates", "vendor_media", "profiles", "analytics_events", "audit_log", "notifications", "platform_ledger", "cost_entries"] as const;
  const counts = await Promise.all(tables.map((t) => supabase.from(t).select("*", { count: "exact", head: true })));
  return Object.fromEntries(tables.map((t, i) => [t, counts[i]!.count ?? 0])) as Record<(typeof tables)[number], number>;
}
