import Link from "next/link";
import { Search, User, LayoutDashboard } from "lucide-react";
import { getViewer } from "@/lib/auth";
import { homeFor } from "@/lib/routes";
import { Logo } from "@/components/ui/misc";
import { ButtonLink } from "@/components/ui/button";
import { MobileMenu } from "./mobile-menu";
import { NavLinks } from "./nav-links";
import { HeaderShell } from "./header-shell";

export const NAV = [
  { href: "/", label: "Home" },
  { href: "/services", label: "Explore Services" },
  { href: "/how-it-works", label: "How It Works" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export async function SiteHeader() {
  const viewer = await getViewer();
  const portal = viewer && viewer.role !== "customer" ? homeFor(viewer.role) : null;
  return (
    <HeaderShell className="site-header sticky top-0 z-40 bg-teal-deep/95 text-white shadow-[0_1px_0_rgb(255_255_255/0.06)] backdrop-blur supports-[backdrop-filter]:bg-teal-deep/85">
      <div className="container-page flex h-[76px] items-center gap-6">
        <Logo className="header-logo h-[54px] sm:h-[62px]" priority />
        <NavLinks items={NAV} />
        <div className="ml-auto flex items-center gap-2">
          <Link href="/services" aria-label="Search services" className="hidden size-11 items-center justify-center rounded-full text-white/85 hover:bg-white/10 sm:flex">
            <Search className="size-5" />
          </Link>
          {viewer ? (
            <Link href={portal ?? "/account"} className="hidden h-11 items-center gap-2 rounded-full px-3 text-sm font-medium text-white/90 hover:bg-white/10 md:flex">
              {portal ? <LayoutDashboard className="size-4 text-gold" /> : <User className="size-4 text-gold" />}
              {portal ? (viewer.role === "vendor" ? "Vendor portal" : "Admin") : (viewer.name?.split(" ")[0] ?? "Account")}
            </Link>
          ) : (
            <Link href="/login" className="hidden h-11 items-center rounded-full px-4 text-sm font-medium text-white/90 hover:bg-white/10 md:flex">Sign in</Link>
          )}
          <ButtonLink href="/list-your-service" variant="gold" size="sm" className="btn-sheen hidden sm:inline-flex">List Your Service</ButtonLink>
          <MobileMenu items={NAV} signedIn={!!viewer} portal={portal} />
        </div>
      </div>
    </HeaderShell>
  );
}
