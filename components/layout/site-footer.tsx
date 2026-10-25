import Link from "next/link";
import { Logo } from "@/components/ui/misc";
import { getCategories } from "@/lib/data/public";

export async function SiteFooter() {
  const categories = await getCategories();
  return (
    <footer className="relative mt-24 overflow-hidden bg-teal-deep text-white/80">
      <div className="pattern-jaali absolute inset-0 opacity-40" aria-hidden />
      <div className="container-page relative grid gap-10 py-14 md:grid-cols-[1.4fr_1fr_1fr_1fr]" data-stagger="fade">
        <div>
          <Logo className="h-16" />
          <p className="mt-4 max-w-sm text-sm leading-relaxed">
            Tarkaash helps you discover trusted local services and independent providers, with every enquiry coordinated by our team.
          </p>
          <p className="mt-4 font-display text-lg text-gold">Real People · Real Skills · Real Community</p>
        </div>
        <FooterCol title="Explore" links={categories.slice(0, 6).map((c) => ({ href: `/services/${c.slug}`, label: c.name }))} />
        <FooterCol title="Tarkaash" links={[
          { href: "/how-it-works", label: "How it works" }, { href: "/about", label: "About us" },
          { href: "/contact", label: "Contact" }, { href: "/list-your-service", label: "List your service" },
        ]} />
        <FooterCol title="Account" links={[
          { href: "/login", label: "Sign in" }, { href: "/signup", label: "Create account" }, { href: "/vendor", label: "Vendor portal" },
          { href: "/privacy", label: "Privacy" }, { href: "/terms", label: "Terms" },
        ]} />
      </div>
      <div className="relative border-t border-white/10">
        <div className="container-page flex flex-col gap-2 py-5 text-xs text-white/60 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Tarkaash. Har Hunar Ko Ek Pehchaan.</p>
          <p>Demo environment. Prices, reviews, metrics and fees shown are illustrative.</p>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return (
    <div>
      <h3 className="font-sans text-sm font-semibold uppercase tracking-widest text-gold">{title}</h3>
      <ul className="mt-4 space-y-2.5 text-sm">
        {links.map((l) => (
          <li key={l.href}><Link href={l.href} className="link-underline pb-0.5 transition-colors hover:text-white">{l.label}</Link></li>
        ))}
      </ul>
    </div>
  );
}
