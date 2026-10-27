import { PRIVATE_ROBOTS } from "@/lib/seo";
import type { Metadata } from "next";
import Link from "next/link";
import { BadgeCheck, Plus, Clock } from "lucide-react";
import { requireVendor } from "@/lib/auth";
import { getVendorShell } from "@/lib/data/vendor";
import { PortalSidebar, type NavItem } from "@/components/portal/sidebar";
import { PortalTopbar } from "@/components/portal/topbar";
import { Avatar, Logo } from "@/components/ui/misc";

export const metadata: Metadata = { title: { default: "Vendor portal", template: "%s | Vendor portal | Tarkkash" }, robots: PRIVATE_ROBOTS };

export default async function VendorLayout({ children }: { children: React.ReactNode }) {
  const viewer = await requireVendor();
  const { vendor, unread, needsResponse } = await getVendorShell(viewer.vendorId);
  const items: NavItem[] = [
    { href: "/vendor", label: "Dashboard", icon: "dashboard", exact: true },
    { href: "/vendor/orders", label: "Orders & bookings", icon: "orders", badge: needsResponse },
    { href: "/vendor/services", label: "Services", icon: "services" },
    { href: "/vendor/profile", label: "My profile", icon: "profile" },
    { href: "/vendor/reviews", label: "Customer reviews", icon: "reviews" },
    { href: "/vendor/followers", label: "Followers & updates", icon: "followers" },
    { href: "/vendor/payouts", label: "Payouts & earnings", icon: "payouts" },
    { href: "/vendor/notifications", label: "Notifications", icon: "bell", badge: unread },
  ];
  return (
    <div className="min-h-screen bg-cream">
      <PortalSidebar items={items}
        header={
          <div className="px-5 pb-5 pt-6">
            <Logo className="h-14" />
            <div className="mt-6 flex flex-col items-center rounded-2xl bg-white/5 p-4 text-center ring-1 ring-white/10">
              <Avatar src={vendor?.avatar_url} name={vendor?.name} size={72} className="ring-2 ring-gold" />
              <p className="mt-3 font-display text-lg font-semibold leading-tight">{vendor?.name}</p>
              <p className="mt-0.5 text-xs text-white/60">Vendor ID · {vendor?.id.slice(0, 8).toUpperCase()}</p>
              {vendor?.verification === "verified" ? (
                <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-mint px-2.5 py-0.5 text-xs font-semibold text-teal-deep"><BadgeCheck className="size-3.5" />Verified vendor</span>
              ) : vendor?.status !== "active" ? (
                <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-gold-pale px-2.5 py-0.5 text-xs font-semibold text-[#7a5210]"><Clock className="size-3.5" />Pending approval</span>
              ) : null}
            </div>
          </div>
        }
        footer={<Link href="/vendor/services?new=1" className="flex h-11 items-center justify-center gap-2 rounded-full bg-gold text-sm font-semibold text-teal-deep hover:bg-gold-600 hover:text-white"><Plus className="size-4" />List new service</Link>}
      />
      <div className="lg:pl-72">
        <PortalTopbar title="Vendor portal" name={vendor?.name ?? "Vendor"} subtitle="Vendor account" avatar={vendor?.avatar_url} unread={unread}
          notificationsHref="/vendor/notifications" publicHref={vendor?.status === "active" ? `/vendors/${vendor.slug}` : undefined} />
        <main id="main" className="px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
