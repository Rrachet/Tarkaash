import type { Metadata } from "next";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageTitle } from "@/components/portal/topbar";
import { formatDateTime } from "@/lib/format";

export const metadata: Metadata = { title: "Audit log" };

export default async function AuditPage() {
  await requireRole(["admin", "finance"], "/admin");
  const supabase = await createClient();
  const { data } = await supabase.from("audit_log").select("id, action, entity, entity_id, data, created_at, actor_id").order("created_at", { ascending: false }).limit(200);
  const actorIds = [...new Set((data ?? []).map((d) => d.actor_id).filter(Boolean))] as string[];
  const { data: actors } = actorIds.length ? await supabase.from("profiles").select("id, full_name, role").in("id", actorIds) : { data: [] };
  const name = new Map((actors ?? []).map((a) => [a.id, `${a.full_name ?? "User"} (${a.role})`]));
  return (
    <>
      <PageTitle title="Audit log">Assignments, status changes, payments, verification, settings and contact access — with who and when.</PageTitle>
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-cream text-left text-xs uppercase tracking-wider text-slate"><tr><th className="px-5 py-3">When</th><th className="px-5 py-3">Who</th><th className="px-5 py-3">Action</th><th className="px-5 py-3">Record</th><th className="px-5 py-3">Details</th></tr></thead>
          <tbody className="divide-y divide-line">
            {(data ?? []).map((a) => (
              <tr key={a.id}>
                <td className="whitespace-nowrap px-5 py-2.5 text-slate">{formatDateTime(a.created_at)}</td>
                <td className="px-5 py-2.5">{a.actor_id ? name.get(a.actor_id) ?? "User" : "System"}</td>
                <td className="px-5 py-2.5 font-mono text-xs font-semibold text-teal">{a.action}</td>
                <td className="px-5 py-2.5 text-xs">{a.entity} · <span className="font-mono">{a.entity_id?.slice(0, 8)}</span></td>
                <td className="max-w-md truncate px-5 py-2.5 font-mono text-xs text-slate">{JSON.stringify(a.data)}</td>
              </tr>
            ))}
            {!data?.length && <tr><td colSpan={5} className="px-5 py-10 text-center text-slate">No audited actions yet. Actions taken in the admin and vendor portals appear here.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
