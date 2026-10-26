// End-to-end smoke test against a running app + the live Supabase project.
// Usage: DEMO_PASSWORD=... APP_URL=http://localhost:3000 node --env-file=.env.local scripts/smoke.mjs
// Read-only: signs in as seeded demo accounts and checks access rules and exports.
import { createServerClient } from "@supabase/ssr";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const password = process.env.DEMO_PASSWORD;
const app = process.env.APP_URL ?? "http://localhost:3000";
if (!url || !key || !password) throw new Error("Set NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY and DEMO_PASSWORD");

let failures = 0;
const check = (ok, label) => { console.log(`${ok ? "PASS" : "FAIL"} ${label}`); if (!ok) failures++; };

async function signIn(email) {
  const jar = new Map();
  const client = createServerClient(url, key, {
    cookies: {
      getAll: () => [...jar].map(([name, value]) => ({ name, value })),
      setAll: (list) => list.forEach(({ name, value }) => (value ? jar.set(name, value) : jar.delete(name))),
    },
  });
  const { error } = await client.auth.signInWithPassword({ email, password });
  const cookie = [...jar].map(([n, v]) => `${n}=${v}`).join("; ");
  return { client, error, cookie };
}

const today = new Date(Date.now() + 5.5 * 3600e3).toISOString().slice(0, 10);
const from = new Date(Date.now() - 29 * 864e5).toISOString().slice(0, 10);

const admin = await signIn("tarkaash.admin@example.com");
check(!admin.error, "admin can sign in");
const meera = await signIn("meera.baking@example.com");
check(!meera.error, "vendor (Meera) can sign in");
const wings = await signIn("wingsinair@example.com");
check(!wings.error, "vendor (Wings in Air) can sign in");
const priya = await signIn("priya.customer@example.com");
check(!priya.error, "customer (Priya) can sign in");

const { data: meeraVendor } = await meera.client.from("vendors").select("id").eq("slug", "meeras-home-baking").single();
const { data: meeraOrders } = await meera.client.from("orders").select("vendor_id").limit(1000);
check(meeraOrders?.length > 0 && meeraOrders.every((o) => o.vendor_id === meeraVendor.id), `vendor sees only own orders (${meeraOrders?.length})`);
const { data: crossOrders } = await wings.client.from("orders").select("id").eq("vendor_id", meeraVendor.id);
check(crossOrders?.length === 0, "other vendor sees none of Meera's orders");
const { error: crossMetrics } = await wings.client.rpc("vendor_metrics", { p_vendor: meeraVendor.id, p_from: from, p_to: today });
check(!!crossMetrics, "other vendor cannot read Meera's analytics");
const { data: vm, error: vmErr } = await meera.client.rpc("vendor_metrics", { p_vendor: meeraVendor.id, p_from: from, p_to: today });
check(!vmErr && vm.profile_views > 0, `vendor reads own analytics (${vm?.profile_views} views, ${vm?.enquiries} enquiries)`);

const { data: { user: priyaUser } } = await priya.client.auth.getUser();
const { data: priyaEnq } = await priya.client.from("enquiries").select("ref_code, user_id");
check(!!priyaEnq?.length && priyaEnq.every((e) => e.user_id === priyaUser.id), `customer sees only own enquiries (${priyaEnq?.length})`);

const { data: boost, error: boostErr } = await admin.client.rpc("boost_queue", { p_from: from, p_to: today });
check(!boostErr && boost.length > 0, `admin boost queue (${boost?.length} flags)`);
const { data: pnl } = await admin.client.rpc("commercial_summary", { p_from: from, p_to: today });
check(pnl && pnl.revenue < pnl.gmv, `P&L revenue ₹${pnl?.revenue} vs order value ₹${pnl?.gmv}`);

// Exports through the app with real session cookies
const res = await fetch(`${app}/api/export/ledger?range=30d`, { headers: { cookie: admin.cookie } });
const body = await res.text();
check(res.status === 200 && body.includes("recognized_on,type,amount_inr"), `admin can export ledger CSV (${body.split("\n").length - 2} rows)`);
const vres = await fetch(`${app}/api/export/ledger?range=30d`, { headers: { cookie: meera.cookie } });
check(vres.status === 403, `vendor is refused the ledger export (${vres.status})`);
const ures = await fetch(`${app}/api/export/users`, { headers: { cookie: meera.cookie } });
check(ures.status === 403, `vendor is refused the users export (${ures.status})`);
const ores = await fetch(`${app}/api/export/orders?range=30d`, { headers: { cookie: meera.cookie } });
const obody = await ores.text();
check(ores.status === 200 && !obody.includes("Wings in Air") && obody.includes("Meera"), "vendor order export contains only own orders");
const gres = await fetch(`${app}/admin`, { headers: { cookie: meera.cookie }, redirect: "manual" });
check(gres.status === 307 && gres.headers.get("location")?.includes("/vendor"), "vendor is redirected away from /admin");
const ares = await fetch(`${app}/admin`, { headers: { cookie: admin.cookie }, redirect: "manual" });
check(ares.status !== 307, "admin passes the /admin guard");

console.log(failures ? `\n${failures} check(s) failed` : "\nAll smoke checks passed");
process.exit(failures ? 1 : 0);
