import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/** Liveness + database reachability (public data only). */
export async function GET() {
  const started = Date.now();
  try {
    const supabase = await createClient();
    const { count, error } = await supabase.from("categories").select("id", { count: "exact", head: true });
    if (error) throw error;
    return NextResponse.json({ status: "ok", database: "ok", categories: count, latency_ms: Date.now() - started });
  } catch {
    return NextResponse.json({ status: "degraded", database: "unreachable" }, { status: 503 });
  }
}
