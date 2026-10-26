import type { Metadata } from "next";
import Link from "next/link";
import { Download, ArrowRight, Inbox, ClipboardList, MessageSquare, Star, Users, Wallet, Store, Package, Megaphone, ImageIcon, UserRound, BarChart3, History, Receipt } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { getDataCounts } from "@/lib/data/admin";
import { PageTitle } from "@/components/portal/topbar";
import { formatNumber } from "@/lib/format";

export const metadata: Metadata = { title: "Data & exports" };

export default async function DataCentre() {
  await requireRole(["admin", "finance"], "/admin");
  const c = await getDataCounts();
  const today = new Date();
  const yearAgo = new Date(today.getTime() - 365 * 86400000);
  const year = `from=${yearAgo.toISOString().slice(0, 10)}&to=${today.toISOString().slice(0, 10)}`;
  const groups: { title: string; items: { label: string; count: number; icon: typeof Inbox; href?: string; csv?: string; note: string }[] }[] = [
    { title: "Customer requests", items: [
      { label: "Enquiries", count: c.enquiries, icon: Inbox, href: "/admin/enquiries?tab=all", csv: `enquiries?${year}`, note: "Every enquiry from the site, with reference IDs" },
      { label: "Contact messages", count: c.support_tickets, icon: MessageSquare, href: "/admin/support", csv: `tickets?${year}`, note: "Contact form, vendor applications and support" },
      { label: "Reviews", count: c.reviews, icon: Star, href: "/admin/reviews", csv: "reviews", note: "All reviews including pending and rejected" },
    ] },
    { title: "Orders and money", items: [
      { label: "Orders", count: c.orders, icon: ClipboardList, href: "/admin/orders", csv: `orders?${year}`, note: "Every order and its lifecycle" },
      { label: "Payments", count: c.payments, icon: Wallet, csv: `payments?${year}`, note: "Payments recorded by vendors" },
      { label: "Ledger", count: c.platform_ledger, icon: Receipt, href: "/admin/commercial", csv: `ledger?${year}`, note: "Commission and fees booked by Tarkaash" },
      { label: "Costs", count: c.cost_entries, icon: Receipt, href: "/admin/commercial", note: "Direct and operating costs" },
    ] },
    { title: "People", items: [
      { label: "Accounts", count: c.profiles, icon: UserRound, href: "/admin/users", csv: "users", note: "Everyone who signed up, with role and status" },
      { label: "Customers", count: c.customers, icon: Users, csv: "customers", note: "Customer contact records (includes guests)" },
    ] },
    { title: "Vendor content", items: [
      { label: "Vendors", count: c.vendors, icon: Store, href: "/admin/vendors", csv: `vendors?${year}`, note: "Vendor performance summary for the year" },
      { label: "Services", count: c.services, icon: Package, href: "/admin/moderation?kind=service&status=all", csv: "services", note: "Every service with approval status" },
      { label: "Posts", count: c.vendor_updates, icon: Megaphone, href: "/admin/moderation?kind=update&status=all", csv: "posts", note: "Vendor updates and offers" },
      { label: "Photos", count: c.vendor_media, icon: ImageIcon, href: "/admin/moderation?kind=media&status=all", note: "Gallery images" },
    ] },
    { title: "System", items: [
      { label: "Analytics events", count: c.analytics_events, icon: BarChart3, href: "/admin", note: "Profile views, searches and enquiries" },
      { label: "Audit log", count: c.audit_log, icon: History, href: "/admin/audit", csv: `audit?${year}`, note: "Who did what and when; cannot be edited" },
      { label: "Notifications", count: c.notifications, icon: MessageSquare, href: "/admin/notifications", note: "In-app messages to admins and vendors" },
    ] },
  ];
  return (
    <>
      <PageTitle title="Data & exports">
        Everything entered on Tarkaash is stored in one secure database. Open any area or download it as a spreadsheet (CSV). Exports are staff only.
      </PageTitle>
      <div className="space-y-8">
        {groups.map((g) => (
          <section key={g.title}>
            <h2 className="mb-3 font-sans text-sm font-semibold uppercase tracking-widest text-gold-600">{g.title}</h2>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" data-stagger>
              {g.items.map((it) => (
                <div key={it.label} className="card flex flex-col p-4">
                  <div className="flex items-center gap-2.5">
                    <span className="flex size-9 items-center justify-center rounded-xl bg-teal/10 text-teal"><it.icon className="size-4" /></span>
                    <p className="font-semibold">{it.label}</p>
                  </div>
                  <p className="mt-3 font-display text-3xl font-semibold">{formatNumber(it.count)}</p>
                  <p className="mt-1 text-xs text-slate">{it.note}</p>
                  <div className="mt-auto flex flex-wrap gap-2 pt-4">
                    {it.href && <Link href={it.href} className="inline-flex items-center gap-1 text-sm font-semibold text-teal hover:underline">Open <ArrowRight className="size-3.5" /></Link>}
                    {it.csv && <a href={`/api/export/${it.csv}`} className="ml-auto inline-flex items-center gap-1 text-sm font-semibold text-gold-600 hover:underline"><Download className="size-3.5" />CSV</a>}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
