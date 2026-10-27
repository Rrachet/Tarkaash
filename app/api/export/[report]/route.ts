import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { toCsv } from "@/lib/csv";
import { resolveRange } from "@/lib/dates";

export const dynamic = "force-dynamic";

const REPORTS = ["orders", "enquiries", "ledger", "categories", "vendors", "customers", "payments", "tickets", "reviews", "posts", "services", "users", "audit"] as const;
// Data centre exports: staff only, on top of row level security.
const STAFF_ONLY = new Set<string>(["customers", "payments", "tickets", "reviews", "posts", "services", "users", "audit", "ledger", "categories", "vendors"]);
type Report = (typeof REPORTS)[number];

/**
 * CSV exports. Row level security decides what each caller can see: vendors get only their own orders,
 * staff get everything, the ledger and platform summaries are staff-only.
 */
export async function GET(request: NextRequest, ctx: { params: Promise<{ report: string }> }) {
  const { report } = await ctx.params;
  if (!REPORTS.includes(report as Report)) return NextResponse.json({ error: "Unknown report" }, { status: 404 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  if (STAFF_ONLY.has(report)) {
    const { data: me } = await supabase.from("profiles").select("role, blocked_at").eq("id", user.id).single();
    if (!me || me.blocked_at || !["admin", "finance"].includes(me.role)) return NextResponse.json({ error: "Staff access required" }, { status: 403 });
  }

  const sp = request.nextUrl.searchParams;
  const range = resolveRange({ range: sp.get("range") ?? undefined, from: sp.get("from") ?? undefined, to: sp.get("to") ?? undefined });
  const start = `${range.from}T00:00:00+05:30`;
  const end = new Date(Date.parse(`${range.to}T00:00:00+05:30`) + 86400000).toISOString();
  const exportedAt = new Date().toISOString();

  let headers: string[] = [];
  let rows: (string | number | boolean | null)[][] = [];

  if (report === "orders") {
    const { data, error } = await supabase.from("orders")
      .select("ref_code, title, status, agreed_amount, created_at, accepted_at, completed_at, closed_at, is_demo, vendors(name), enquiries(ref_code)")
      .gte("created_at", start).lt("created_at", end).order("created_at", { ascending: false }).limit(10000);
    if (error) return NextResponse.json({ error: "Could not export" }, { status: 400 });
    headers = ["order_ref", "enquiry_ref", "vendor", "service", "status", "agreed_amount_inr", "created_at", "accepted_at", "completed_at", "closed_at", "sample_data"];
    rows = (data ?? []).map((o) => [o.ref_code, o.enquiries?.ref_code ?? null, o.vendors?.name ?? null, o.title, o.status, o.agreed_amount,
      o.created_at, o.accepted_at, o.completed_at, o.closed_at, o.is_demo]);
  } else if (report === "enquiries") {
    const { data, error } = await supabase.from("enquiries")
      .select("ref_code, status, source, locality, preferred_date, assist_opt_in, created_at, is_demo, categories(name), requested:vendors!enquiries_requested_vendor_id_fkey(name)")
      .gte("created_at", start).lt("created_at", end).order("created_at", { ascending: false }).limit(10000);
    if (error) return NextResponse.json({ error: "Could not export" }, { status: 400 });
    headers = ["enquiry_ref", "status", "category", "requested_vendor", "source", "locality", "preferred_date", "assist_opt_in", "created_at", "sample_data"];
    rows = (data ?? []).map((e) => [e.ref_code, e.status, e.categories?.name ?? null, e.requested?.name ?? null, e.source, e.locality,
      e.preferred_date, e.assist_opt_in, e.created_at, e.is_demo]);
  } else if (report === "customers") {
    const { data, error } = await supabase.from("customers").select("name, email, phone, consent_at, created_at, is_demo")
      .order("created_at", { ascending: false }).limit(10000);
    if (error) return NextResponse.json({ error: "Could not export" }, { status: 400 });
    headers = ["name", "email", "phone", "consent_at", "created_at", "sample_data"];
    rows = (data ?? []).map((c) => [c.name, c.email, c.phone, c.consent_at, c.created_at, c.is_demo]);
  } else if (report === "payments") {
    const { data, error } = await supabase.from("payments").select("amount, method, transaction_ref, status, created_at, is_demo, orders(ref_code, vendors(name))")
      .gte("created_at", start).lt("created_at", end).order("created_at", { ascending: false }).limit(10000);
    if (error) return NextResponse.json({ error: "Could not export" }, { status: 400 });
    headers = ["order_ref", "vendor", "amount_inr", "method", "transaction_ref", "status", "recorded_at", "sample_data"];
    rows = (data ?? []).map((p) => [p.orders?.ref_code ?? null, p.orders?.vendors?.name ?? null, p.amount, p.method, p.transaction_ref, p.status, p.created_at, p.is_demo]);
  } else if (report === "tickets") {
    const { data, error } = await supabase.from("support_tickets").select("ref_code, topic, status, name, email, phone, message, created_at, is_demo")
      .gte("created_at", start).lt("created_at", end).order("created_at", { ascending: false }).limit(10000);
    if (error) return NextResponse.json({ error: "Could not export" }, { status: 400 });
    headers = ["ticket_ref", "topic", "status", "name", "email", "phone", "message", "created_at", "sample_data"];
    rows = (data ?? []).map((t) => [t.ref_code, t.topic, t.status, t.name, t.email, t.phone, t.message, t.created_at, t.is_demo]);
  } else if (report === "reviews") {
    const { data, error } = await supabase.from("reviews").select("author_name, rating, body, status, created_at, is_demo, vendors(name)")
      .order("created_at", { ascending: false }).limit(10000);
    if (error) return NextResponse.json({ error: "Could not export" }, { status: 400 });
    headers = ["vendor", "author", "rating", "review", "moderation", "created_at", "sample_data"];
    rows = (data ?? []).map((r) => [r.vendors?.name ?? null, r.author_name, r.rating, r.body, r.status, r.created_at, r.is_demo]);
  } else if (report === "posts") {
    const { data, error } = await supabase.from("vendor_updates").select("title, body, moderation, moderation_note, created_at, vendors(name)")
      .order("created_at", { ascending: false }).limit(10000);
    if (error) return NextResponse.json({ error: "Could not export" }, { status: 400 });
    headers = ["vendor", "title", "body", "moderation", "moderation_note", "created_at"];
    rows = (data ?? []).map((u) => [u.vendors?.name ?? null, u.title, u.body, u.moderation, u.moderation_note, u.created_at]);
  } else if (report === "services") {
    const { data, error } = await supabase.from("services").select("title, description, price_type, price_amount, price_unit, active, moderation, created_at, vendors(name)")
      .order("created_at", { ascending: false }).limit(10000);
    if (error) return NextResponse.json({ error: "Could not export" }, { status: 400 });
    headers = ["vendor", "service", "description", "price_type", "price_inr", "unit", "active", "moderation", "created_at"];
    rows = (data ?? []).map((x) => [x.vendors?.name ?? null, x.title, x.description, x.price_type, x.price_amount, x.price_unit, x.active, x.moderation, x.created_at]);
  } else if (report === "users") {
    const { data, error } = await supabase.rpc("admin_list_users", { p_limit: 200, p_offset: 0 });
    if (error) return NextResponse.json({ error: "Staff access required" }, { status: 403 });
    headers = ["name", "email", "phone", "role", "view_only", "blocked_at", "blocked_reason", "joined", "last_sign_in", "enquiries", "vendor"];
    rows = (data ?? []).map((u) => [u.full_name, u.email, u.phone, u.role, u.read_only, u.blocked_at, u.blocked_reason, u.created_at, u.last_sign_in_at, Number(u.enquiries), u.vendor_name]);
  } else if (report === "audit") {
    const { data, error } = await supabase.from("audit_log").select("created_at, action, entity, entity_id, actor_id, data")
      .gte("created_at", start).lt("created_at", end).order("created_at", { ascending: false }).limit(10000);
    if (error) return NextResponse.json({ error: "Could not export" }, { status: 400 });
    headers = ["at", "action", "entity", "entity_id", "actor_id", "details"];
    rows = (data ?? []).map((a) => [a.created_at, a.action, a.entity, a.entity_id, a.actor_id, JSON.stringify(a.data)]);
  } else if (report === "ledger") {
    const { data, error } = await supabase.from("platform_ledger")
      .select("recognized_on, txn_type, amount, direct_cost, tax_amount, basis, reconciliation, note, is_demo, vendors(name), orders(ref_code)")
      .gte("recognized_on", range.from).lte("recognized_on", range.to).order("recognized_on", { ascending: false }).limit(10000);
    if (error) return NextResponse.json({ error: "Could not export" }, { status: 400 });
    headers = ["recognized_on", "type", "amount_inr", "direct_cost_inr", "tax_inr", "basis", "reconciliation", "vendor", "order_ref", "note", "sample_data"];
    rows = (data ?? []).map((l) => [l.recognized_on, l.txn_type, l.amount, l.direct_cost, l.tax_amount, l.basis, l.reconciliation,
      l.vendors?.name ?? null, l.orders?.ref_code ?? null, l.note, l.is_demo]);
  } else {
    const { data, error } = await supabase.rpc("admin_metrics", { p_from: range.from, p_to: range.to });
    if (error) return NextResponse.json({ error: "Staff access required" }, { status: 403 });
    const m = data as unknown as {
      by_category: { name: string; vendors: number; leads: number; accepted: number; completed: number }[];
      top_vendors: { name: string; locality: string; views: number; leads: number; accepted: number; completed: number; value: number }[];
    };
    if (report === "categories") {
      headers = ["category", "active_vendors", "leads", "accepted", "completed"];
      rows = m.by_category.map((c) => [c.name, c.vendors, c.leads, c.accepted, c.completed]);
    } else {
      headers = ["vendor", "locality", "profile_views", "leads", "accepted", "completed", "completed_order_value_inr"];
      rows = m.top_vendors.map((v) => [v.name, v.locality, v.views, v.leads, v.accepted, v.completed, v.value]);
    }
  }

  const preface = `# Tarkkash ${report} export, ${range.from} to ${range.to}, exported ${exportedAt}. Rows marked sample_data are illustrative.\r\n`;
  return new NextResponse(preface + toCsv(headers, rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="tarkaash-${report}-${range.from}-to-${range.to}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
