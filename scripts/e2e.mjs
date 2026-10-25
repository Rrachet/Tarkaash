// Full end-to-end flow through the real UI.
// Usage: DEMO_PASSWORD=... APP_URL=http://localhost:3000 node scripts/e2e.mjs
// Creates one real enquiry/order named "E2E Test Customer" (clean up afterwards if needed).
import { createRequire } from "node:module";
const { chromium } = createRequire(import.meta.url)("playwright"); // uses the locally installed Playwright

const APP = process.env.APP_URL ?? "http://localhost:3000";
const PW = process.env.DEMO_PASSWORD;
const SHOTS = process.env.SHOTS_DIR;
if (!PW) throw new Error("Set DEMO_PASSWORD");

let step = 0;
const log = (m) => console.log(`${String(++step).padStart(2, "0")} ✓ ${m}`);
const browser = await chromium.launch();

async function session(width = 1280) {
  const ctx = await browser.newContext({ viewport: { width, height: 900 } });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => console.log("   page error:", e.message));
  return { ctx, page };
}
async function signIn(page, email) {
  await page.goto(`${APP}/login`, { waitUntil: "networkidle" });
  await page.fill("input[name=email]", email);
  await page.fill("input[name=password]", PW);
  await page.click("button[type=submit]");
  await page.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 60000 });
}
const shot = async (page, name) => SHOTS && page.screenshot({ path: `${SHOTS}/e2e-${name}.png`, fullPage: false });

// 1. Guest customer on mobile: search → profile → enquiry
const guest = await session(390);
await guest.page.goto(`${APP}/services?q=cake`, { waitUntil: "networkidle" });
await guest.page.getByRole("link", { name: /Meera's Home Baking/ }).first().click();
await guest.page.waitForURL(/\/vendors\/meeras-home-baking/);
log("Guest searched 'cake' and opened Meera's profile (mobile)");
await guest.page.getByRole("button", { name: /Enquire/ }).first().click();
const selected = await guest.page.locator("select[name=service]").inputValue();
if (!selected) throw new Error("service not pre-selected");
const prefill = await guest.page.locator("textarea[name=request]").inputValue();
if (!prefill.startsWith("I'd like to enquire about")) throw new Error("request not pre-filled");
log("Selecting a service pre-filled the enquiry form");
await guest.page.getByRole("button", { name: /Send enquiry/ }).click();
await guest.page.getByText("Please check the highlighted fields").waitFor();
log("Empty submit shows validation errors");
await guest.page.fill("input[name=name]", "E2E Test Customer");
await guest.page.fill("input[name=phone]", "9000012345");
await guest.page.fill("textarea[name=request]", prefill + `Chocolate, 1.5 kg, 'Happy Birthday Riya'. (run ${Date.now().toString(36)})`);
const d = new Date(Date.now() + 4 * 864e5).toISOString().slice(0, 10);
await guest.page.fill("input[name=preferred_date]", d);
await guest.page.check("input[name=consent]");
await guest.page.getByRole("button", { name: /Send enquiry/ }).click();
await guest.page.getByText("Enquiry sent to Tarkaash").waitFor({ timeout: 30000 });
const ref = (await guest.page.locator("p.font-mono").first().innerText()).trim();
await shot(guest.page, "1-confirmation");
log(`Enquiry submitted — reference ${ref}`);
await guest.ctx.close();

// 2. Admin assigns from the queue
const admin = await session();
await signIn(admin.page, "tarkaash.admin@example.com");
await admin.page.goto(`${APP}/admin/enquiries?tab=all&q=${ref}`, { waitUntil: "networkidle" });
await admin.page.getByText(ref).first().click();
await admin.page.waitForURL(/\/admin\/enquiries\//);
log("Admin found the enquiry in the queue");
const chosen = await admin.page.locator("select[name=vendor] option:checked").innerText();
if (!chosen.includes("Meera")) throw new Error("requested vendor not pre-selected");
await admin.page.getByRole("button", { name: /Assign & notify/ }).click();
await admin.page.getByText("Orders", { exact: true }).waitFor({ timeout: 30000 });
const orderLink = admin.page.locator("a[href^='/admin/orders/']").first();
const orderRef = (await orderLink.innerText()).trim();
const orderPath = await orderLink.getAttribute("href");
await shot(admin.page, "2-assigned");
log(`Assigned to Meera — order ${orderRef}`);

// 3. Vendor works the order
const vendor = await session();
await signIn(vendor.page, "meera.baking@example.com");
const vendorOrder = `${APP}${orderPath.replace("/admin/", "/vendor/")}`;
await vendor.page.goto(vendorOrder, { waitUntil: "networkidle" });
await vendor.page.getByText("Contact details are shared once you accept").waitFor();
log("Vendor sees the order; contact hidden before acceptance");
const click = async (name) => { await vendor.page.getByRole("button", { name }).first().click(); await vendor.page.waitForTimeout(1500); await vendor.page.waitForLoadState("networkidle"); };
await click(/Accept enquiry/);
await vendor.page.getByRole("button", { name: /Show contact details/ }).click();
await vendor.page.getByText("9000012345").waitFor();
log("Accepted — customer contact revealed (audited)");
await click(/Start work/);
await vendor.page.getByRole("button", { name: /Edit price/ }).click();
await vendor.page.fill("input[name=agreedAmount]", "1350");
await vendor.page.getByRole("button", { name: /^Save$/ }).click();
await vendor.page.waitForTimeout(1500);
await click(/Mark service delivered/);
log("Agreed ₹1,350, started and delivered");
await vendor.page.getByRole("button", { name: /Record payment/ }).click();
await vendor.page.selectOption("select[name=method]", "upi");
await vendor.page.getByRole("button", { name: /^Record payment$/ }).last().click();
await vendor.page.getByText("Add the transaction reference").waitFor();
await vendor.page.fill("input[name=reference]", "UPI-E2E-0001");
await vendor.page.getByRole("button", { name: /^Record payment$/ }).last().click();
await vendor.page.waitForTimeout(2000);
log("UPI payment needed a reference, then recorded");
await click(/Submit to Tarkaash/);
await vendor.page.getByText("Submitted — Tarkaash will verify").waitFor();
await shot(vendor.page, "3-submitted");
log("Submitted to Tarkaash");

// Cross-vendor isolation
const other = await session();
await signIn(other.page, "rohan.kitchen@example.com");
await other.page.goto(vendorOrder, { waitUntil: "networkidle" });
const notFound = await other.page.getByText(/wandered off|not found/i).count();
if (!notFound) throw new Error("another vendor could open the order!");
log("Another vendor (Rohan) cannot open Meera's order");
await other.ctx.close();

// 4. Admin closes
await admin.page.goto(`${APP}${orderPath}`, { waitUntil: "networkidle" });
await admin.page.getByRole("button", { name: /Verify & close/ }).click();
await admin.page.waitForTimeout(2000);
await admin.page.reload({ waitUntil: "networkidle" });
await admin.page.getByText("Closed").first().waitFor();
await shot(admin.page, "4-closed");
log("Admin verified and closed the order");
await admin.page.goto(`${APP}/admin/commercial?range=7d`, { waitUntil: "networkidle" });
await admin.page.getByText(orderRef).first().waitFor();
log("Commission for the order appears in the ledger");

await vendor.ctx.close(); await admin.ctx.close(); await browser.close();
console.log(`\nE2E passed: ${ref} → ${orderRef}`);
