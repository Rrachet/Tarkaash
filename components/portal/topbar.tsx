import Link from "next/link";
import { Bell, ExternalLink, LogOut } from "lucide-react";
import { signOut } from "@/lib/actions/auth";
import { Avatar } from "@/components/ui/misc";

export function PortalTopbar({ title, name, subtitle, avatar, unread, notificationsHref, publicHref }: {
  title: string; name: string; subtitle: string; avatar?: string | null; unread: number; notificationsHref: string; publicHref?: string;
}) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-line bg-cream/90 px-4 pl-16 backdrop-blur sm:px-6 lg:pl-6">
      <p className="hidden font-display text-lg font-semibold text-ink sm:block">{title}</p>
      <div className="ml-auto flex items-center gap-2">
        {publicHref && (
          <Link href={publicHref} className="hidden h-10 items-center gap-1.5 rounded-full border border-line bg-white px-3 text-sm font-medium hover:border-teal/40 md:flex">
            <ExternalLink className="size-4" />View public profile
          </Link>
        )}
        <Link href={notificationsHref} aria-label={`Notifications${unread ? ` (${unread} unread)` : ""}`} className="relative flex size-10 items-center justify-center rounded-full hover:bg-white">
          <Bell className="size-5 text-ink" />
          {unread > 0 && <span className="absolute right-1 top-1 flex min-w-5 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white">{unread > 99 ? "99+" : unread}</span>}
        </Link>
        <div className="flex items-center gap-2.5 rounded-full bg-white py-1 pl-1 pr-3 shadow-sm">
          <Avatar src={avatar} name={name} size={32} />
          <div className="hidden leading-tight sm:block"><p className="text-sm font-semibold">{name}</p><p className="text-[11px] text-slate">{subtitle}</p></div>
        </div>
        <form action={signOut}>
          <button aria-label="Sign out" className="flex size-10 items-center justify-center rounded-full text-slate hover:bg-white hover:text-danger"><LogOut className="size-5" /></button>
        </form>
      </div>
    </header>
  );
}

export function PageTitle({ title, children, actions }: { title: string; children?: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-3xl font-semibold">{title}</h1>
        {children && <div className="mt-1 text-sm text-slate">{children}</div>}
      </div>
      {actions}
    </div>
  );
}
