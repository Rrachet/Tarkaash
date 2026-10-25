"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { reviewSchema, fieldErrors } from "@/lib/validation";
import { friendlyError, fail, type ActionResult } from "@/lib/errors";

/** Review a completed order. Reviews are moderated before they appear publicly. */
export async function submitReview(input: { orderId: string; rating: number; body?: string }): Promise<ActionResult> {
  const parsed = reviewSchema.safeParse(input);
  if (!parsed.success) return fail("Please check the highlighted fields.", fieldErrors(parsed.error));
  const supabase = await createClient();
  const { error } = await supabase.rpc("submit_review", {
    p_order: parsed.data.orderId, p_rating: parsed.data.rating, p_body: (parsed.data.body ?? null) as string,
  });
  if (error) return fail(friendlyError(error));
  revalidatePath("/account");
  return { ok: true, data: undefined };
}

export async function updateCommPrefs(prefs: { email: boolean; sms: boolean; whatsapp: boolean }): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return fail("Please sign in.");
  const { error } = await supabase.from("customers").update({ comm_prefs: prefs }).eq("user_id", user.id);
  if (error) return fail(friendlyError(error));
  revalidatePath("/account");
  return { ok: true, data: undefined };
}
