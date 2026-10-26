"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { env } from "@/lib/env";
import { fail, type ActionResult } from "@/lib/errors";
import { fieldErrors } from "@/lib/validation";
import { homeFor, safeNext, type AppRole } from "@/lib/routes";
import { headers } from "next/headers";
import { DEMO_ACCOUNTS, isDemoKey } from "@/lib/demo";

const emailSchema = z.email("Please enter a valid email address.");
const passwordSchema = z.string().min(10, "Use at least 10 characters.").max(72);

/** Signed in but suspended: end the session straight away. */
async function rejectIfBlocked(): Promise<string | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from("profiles").select("blocked_at").eq("id", user.id).single();
  if (!data?.blocked_at) return null;
  await supabase.auth.signOut();
  return "This account has been suspended. Contact Tarkaash support if you think this is a mistake.";
}

async function landingFor(next?: string | null): Promise<string> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return "/login";
  const { data } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  return safeNext(next, homeFor((data?.role ?? "customer") as AppRole));
}

export async function signIn(input: { email: string; password: string; next?: string }): Promise<ActionResult<{ redirectTo: string }>> {
  const parsed = z.object({ email: emailSchema, password: z.string().min(1, "Enter your password.") }).safeParse(input);
  if (!parsed.success) return fail("Please check the highlighted fields.", fieldErrors(parsed.error));
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return fail(error.code === "email_not_confirmed" ? "Please confirm your email first. Check your inbox." : "Email or password is incorrect.");
  const blocked = await rejectIfBlocked();
  if (blocked) return fail(blocked);
  return { ok: true, data: { redirectTo: await landingFor(input.next) } };
}

// Best-effort per-instance throttle for one-click demo sign-in (Supabase Auth adds its own limits).
const demoHits = new Map<string, { n: number; at: number }>();
function demoThrottled(ip: string): boolean {
  const now = Date.now();
  const h = demoHits.get(ip);
  if (!h || now - h.at > 60_000) { demoHits.set(ip, { n: 1, at: now }); return false; }
  h.n += 1;
  return h.n > 10;
}

/** One-click demo sign-in. The shared demo password stays on the server (DEMO_PASSWORD). */
export async function demoSignIn(key: string): Promise<ActionResult<{ redirectTo: string }>> {
  if (process.env.NEXT_PUBLIC_DEMO_MODE !== "1" || !process.env.DEMO_PASSWORD) return fail("Demo sign-in is turned off.");
  if (!isDemoKey(key)) return fail("Unknown demo account.");
  const h = await headers();
  const ip = (h.get("x-forwarded-for") ?? "").split(",")[0]!.trim() || "local";
  if (demoThrottled(ip)) return fail("Too many attempts. Please wait a minute and try again.");
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email: DEMO_ACCOUNTS[key], password: process.env.DEMO_PASSWORD });
  if (error) return fail("Demo sign-in is unavailable right now.");
  const blocked = await rejectIfBlocked();
  if (blocked) return fail(blocked);
  return { ok: true, data: { redirectTo: await landingFor() } };
}

export async function signUp(input: { name: string; email: string; password: string; phone?: string; next?: string }): Promise<ActionResult<{ needsConfirmation: boolean; redirectTo: string }>> {
  const parsed = z.object({
    name: z.string().trim().min(2, "Please enter your name.").max(120),
    email: emailSchema,
    password: passwordSchema,
    phone: z.string().optional(),
  }).safeParse(input);
  if (!parsed.success) return fail("Please check the highlighted fields.", fieldErrors(parsed.error));
  const supabase = await createClient();
  const next = safeNext(input.next, "/account");
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.name, phone: parsed.data.phone ?? null },
      emailRedirectTo: `${env.siteUrl}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });
  if (error) {
    if (error.code === "user_already_exists") return fail("An account with this email already exists. Try signing in.");
    if (error.code === "weak_password") return fail("Please choose a stronger password.");
    if (error.status === 429) return fail("Too many attempts. Please wait a minute and try again.");
    return fail("We could not create your account. Please try again.");
  }
  return { ok: true, data: { needsConfirmation: !data.session, redirectTo: next } };
}

/** Passwordless sign-in: emails a one-time code and magic link. */
export async function sendSignInCode(input: { email: string; next?: string }): Promise<ActionResult> {
  const parsed = emailSchema.safeParse(input.email);
  if (!parsed.success) return fail("Please enter a valid email address.");
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data,
    options: { shouldCreateUser: false, emailRedirectTo: `${env.siteUrl}/auth/callback?next=${encodeURIComponent(safeNext(input.next, "/"))}` },
  });
  // Do not reveal whether the account exists.
  if (error && error.status === 429) return fail("Too many attempts. Please wait a minute and try again.");
  return { ok: true, data: undefined };
}

export async function verifySignInCode(input: { email: string; code: string; next?: string }): Promise<ActionResult<{ redirectTo: string }>> {
  const parsed = z.object({ email: emailSchema, code: z.string().regex(/^\d{6,8}$/, "Enter the code from your email.") }).safeParse(input);
  if (!parsed.success) return fail("Please check the highlighted fields.", fieldErrors(parsed.error));
  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ email: parsed.data.email, token: parsed.data.code, type: "email" });
  if (error) return fail("That code is invalid or has expired.");
  const blocked = await rejectIfBlocked();
  if (blocked) return fail(blocked);
  return { ok: true, data: { redirectTo: await landingFor(input.next) } };
}

export async function requestPasswordReset(input: { email: string }): Promise<ActionResult> {
  const parsed = emailSchema.safeParse(input.email);
  if (!parsed.success) return fail("Please enter a valid email address.");
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data, {
    redirectTo: `${env.siteUrl}/auth/callback?next=/reset-password/update`,
  });
  if (error && error.status === 429) return fail("Too many attempts. Please wait a minute and try again.");
  return { ok: true, data: undefined };
}

export async function updatePassword(input: { password: string }): Promise<ActionResult<{ redirectTo: string }>> {
  const parsed = passwordSchema.safeParse(input.password);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Choose a stronger password.");
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data });
  if (error) return fail("Your reset link has expired. Please request a new one.");
  return { ok: true, data: { redirectTo: await landingFor(null) } };
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
