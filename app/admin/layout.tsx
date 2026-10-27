import { PRIVATE_ROBOTS } from "@/lib/seo";
import type { Metadata } from "next";
import { requireRole } from "@/lib/auth";
import { getAdminCounts } from "@/lib/data/admin";
import { PortalSidebar, type NavItem } from "@/components/portal/sidebar";
import { PortalTopbar } from "@/components/portal/topbar";
import { Logo } from "@/components/ui/misc";

export const metadata: Metadata = { title: { default: "Admin", template: "%s | Tarkkash admin" }, robots: PRIVATE_ROBOTS };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const viewer = await requireRole(["admin", "finance"], "/admin");
  const c = await getAdminCounts();
  const items: NavItem[] = [
    { href: "/admin", label: "Analytics", icon: "analytics", exact: true },
    { href: "/admin/enquiries", label: "Enquiry queue", icon: "inbox", badge: c.unassigned },
    { href: "/admin/orders", label: "Orders", icon: "orders", badge: c.submitted },
    { href: "/admin/vendors", label: "Vendors", icon: "vendors", badge: c.pendingVendors },
    { href: "/admin/boost", label: "Boost queue", icon: "boost" },
    { href: "/admin/commercial", label: "Commercial & P&L", icon: "commercial" },
    { href: "/admin/moderation", label: "Content approval", icon: "moderation", badge: c.pendingContent },
    { href: "/admin/reviews", label: "Review moderation", icon: "reviews", badge: c.pendingReviews },
    { href: "/admin/users", label: "Users & access", icon: "users" },
    { href: "/admin/support", label: "Support tickets", icon: "tickets", badge: c.openTickets },
    { href: "/admin/settings", label: "Settings", icon: "settings" },
    { href: "/admin/data", label: "Data & exports", icon: "data" },
    { href: "/admin/audit", label: "Audit log", icon: "audit" },
  ];
  return (
    <div className="min-h-screen bg-cream">
      <PortalSidebar items={items} header={
        <div className="px-5 pb-6 pt-6">
          <Logo className="h-14" />
          <p className="mt-4 inline-flex rounded-full bg-gold/15 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-gold">{viewer.role === "finance" ? "Finance" : "Admin"} console{viewer.readOnly ? " · view only" : ""}</p>
        </div>
      } />
      <div className="lg:pl-72">
        <PortalTopbar title="Tarkkash admin" name={viewer.name ?? "Admin"} subtitle={viewer.role === "finance" ? "Finance" : "Tarkkash admin"} unread={c.unread} notificationsHref="/admin/notifications" />
        {viewer.readOnly && (
          <div role="status" className="border-b border-gold/40 bg-gold-pale px-4 py-2.5 text-sm text-[#7a5210] sm:px-6 lg:px-8">
            <strong>View-only demo account.</strong> You can explore everything, but changes are disabled. Sign in with a real admin account to make changes.
          </div>
        )}
        <main id="main" className="px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
