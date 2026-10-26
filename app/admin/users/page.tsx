import type { Metadata } from "next";
import Link from "next/link";
import { Search, Download } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { getUsers } from "@/lib/data/admin";
import { PageTitle } from "@/components/portal/topbar";
import { EmptyState } from "@/components/ui/misc";
import { Badge } from "@/components/ui/badge";
import { UserActions } from "@/components/admin/control-actions";
import { formatDate, timeAgo } from "@/lib/format";
import { cn } from "@/lib/cn";

export const metadata: Metadata = { title: "Users & access" };
const EXPORT_URL = "/api/export/users";

const ROLE_TABS = [
  { key: "", label: "Everyone" }, { key: "customer", label: "Customers" }, { key: "vendor", label: "Vendors" },
  { key: "admin", label: "Admins" }, { key: "finance", label: "Finance" }, { key: "blocked", label: "Blocked" },
];

export default async function UsersPage({ searchParams }: { searchParams: Promise<{ q?: string; role?: string; page?: string }> }) {
  const viewer = await requireRole(["admin", "finance"], "/admin");
  const sp = await searchParams;
  const tab = ROLE_TABS.find((t) => t.key === (sp.role ?? ""))?.key ?? "";
  const { users, total, page } = await getUsers({ q: sp.q, role: tab === "blocked" ? undefined : tab, blocked: tab === "blocked" ? "1" : undefined, page: Number(sp.page) || 1 });
  const readOnly = viewer.readOnly || viewer.role !== "admin";
  const qs = (p: Record<string, string | number | undefined>) => {
    const u = new URLSearchParams();
    Object.entries({ q: sp.q, role: tab, ...p }).forEach(([k, v]) => v && u.set(k, String(v)));
    return `/admin/users?${u.toString()}`;
  };

  return (
    <>
      <PageTitle title="Users & access" actions={<a href={EXPORT_URL} download className="inline-flex h-10 items-center gap-1.5 rounded-full border border-line bg-white px-4 text-sm font-semibold hover:border-teal/40"><Download className="size-4" />Export CSV</a>}>
        Every account on Tarkaash. Change roles, block people who misuse the platform, or erase personal data on request. Every action is recorded in the audit log.
      </PageTitle>

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-1.5">
          {ROLE_TABS.map((t) => (
            <Link key={t.key} href={qs({ role: t.key, page: undefined })}
              className={cn("rounded-full px-3 py-1.5 text-xs font-semibold", tab === t.key ? "bg-ink text-white" : "bg-cream-200 text-ink hover:bg-line")}>{t.label}</Link>
          ))}
        </div>
        <form className="relative ml-auto" action="/admin/users">
          {tab && <input type="hidden" name="role" value={tab} />}
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate" aria-hidden />
          <input name="q" defaultValue={sp.q} placeholder="Search name, email or phone" aria-label="Search users"
            className="h-10 w-72 rounded-full border border-line bg-white pl-9 pr-4 text-sm" />
        </form>
      </div>

      {!users.length ? <EmptyState title="No accounts match">Try another search or filter.</EmptyState> : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="bg-cream text-left text-xs uppercase tracking-wider text-slate">
              <tr><th className="px-4 py-3">Person</th><th className="px-4 py-3">Role</th><th className="px-4 py-3">Joined</th><th className="px-4 py-3">Last sign in</th><th className="px-4 py-3">Enquiries</th><th className="px-4 py-3">Actions</th></tr>
            </thead>
            <tbody className="divide-y divide-line">
              {users.map((u) => (
                <tr key={u.id} className={u.blocked_at ? "bg-danger-soft/40" : undefined}>
                  <td className="px-4 py-3">
                    <p className="font-semibold">{u.full_name ?? "No name"}</p>
                    <p className="text-xs text-slate">{u.email ?? "No email"}{u.phone ? ` · ${u.phone}` : ""}</p>
                    {u.vendor_name && <p className="text-xs text-teal">Vendor: {u.vendor_name}</p>}
                    {u.blocked_at && <p className="mt-1 text-xs font-semibold text-danger">Blocked {timeAgo(u.blocked_at)}{u.blocked_reason ? `: ${u.blocked_reason}` : ""}</p>}
                  </td>
                  <td className="px-4 py-3"><Badge tone={u.role === "admin" ? "teal" : u.role === "vendor" ? "gold" : u.role === "finance" ? "mint" : "neutral"}>{u.role}{u.read_only ? " (view only)" : ""}</Badge></td>
                  <td className="px-4 py-3 text-slate">{formatDate(u.created_at)}</td>
                  <td className="px-4 py-3 text-slate">{u.last_sign_in_at ? timeAgo(u.last_sign_in_at) : "Never"}</td>
                  <td className="px-4 py-3">{Number(u.enquiries)}</td>
                  <td className="px-4 py-3"><UserActions user={{ id: u.id, role: u.role, blocked: !!u.blocked_at, name: u.full_name ?? u.email ?? "this user" }} isSelf={u.id === viewer.id} readOnly={readOnly} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {total > 50 && (
        <div className="mt-4 flex items-center justify-between text-sm text-slate">
          <span>Showing {(page - 1) * 50 + 1} to {Math.min(page * 50, total)} of {total}</span>
          <div className="flex gap-2">
            {page > 1 && <Link href={qs({ page: page - 1 })} className="rounded-full border border-line bg-white px-3 py-1.5 font-semibold">Previous</Link>}
            {page * 50 < total && <Link href={qs({ page: page + 1 })} className="rounded-full border border-line bg-white px-3 py-1.5 font-semibold">Next</Link>}
          </div>
        </div>
      )}
    </>
  );
}
