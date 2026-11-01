import type { Metadata } from "next";
import { PRIVATE_ROBOTS } from "@/lib/seo";
import Image from "next/image";
import Link from "next/link";
import { Users, BarChart3, ShieldCheck, Sprout } from "lucide-react";
import { Logo } from "@/components/ui/misc";

export const metadata: Metadata = { robots: PRIVATE_ROBOTS };

const BENEFITS = [
  { icon: Users, title: "More customers", body: "Tarkkash sends you enquiries from people nearby who already know what they need." },
  { icon: BarChart3, title: "Higher visibility", body: "Your own page with services, prices, photos and reviews, found on search." },
  { icon: ShieldCheck, title: "Secure & transparent", body: "Every order is tracked from enquiry to payment, with a clear record for both sides." },
  { icon: Sprout, title: "Support local", body: "Built for home bakers, kitchens, tutors and small teams across Hyderabad." },
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1.08fr_1fr]">
      <aside className="relative hidden overflow-hidden bg-teal-deep text-white lg:flex">
        {/* Photo sits on the right half and melts into the teal on the left */}
        <div className="absolute right-0 top-0 h-[74%] w-[56%]">
          <Image src="/images/auth/vendor-baker.webp" alt="" fill priority sizes="30vw" className="object-cover object-top" />
          <div className="absolute inset-0 bg-gradient-to-r from-teal-deep via-teal-deep/40 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-teal-deep via-teal-deep/80 to-transparent" />
        </div>
        <div className="absolute bottom-0 right-0 h-[32%] w-[44%] opacity-90">
          <Image src="/images/auth/archer.webp" alt="" fill sizes="20vw" className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-teal-deep via-teal-deep/30 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-b from-teal-deep via-teal-deep/20 to-transparent" />
        </div>
        <div className="pattern-jaali pointer-events-none absolute inset-0 opacity-15" />

        <div className="relative flex w-full flex-col p-10 xl:p-12">
          <Logo className="h-20" priority />

          <div className="hero-seq mt-8 max-w-[25rem]">
            <p className="flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.2em] text-gold">
              <span className="h-0.5 w-8 bg-gold" aria-hidden /> Vendor portal
            </p>
            <h2 style={{ "--d": "100ms" } as React.CSSProperties} className="mt-4 text-5xl font-semibold leading-[1.05] xl:text-[3.4rem]">
              Grow your business with Tarkkash
            </h2>
            <p style={{ "--d": "200ms" } as React.CSSProperties} className="mt-4 text-lg leading-relaxed text-white/85">
              Be part of a trusted community that connects your skills and services with real people and real opportunities.
            </p>
            <ul style={{ "--d": "300ms" } as React.CSSProperties} className="mt-8 space-y-5">
              {BENEFITS.map(({ icon: I, title, body }) => (
                <li key={title} className="flex gap-4">
                  <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-white/10 text-gold ring-1 ring-white/15">
                    <I className="size-5" />
                  </span>
                  <span>
                    <span className="block font-semibold">{title}</span>
                    <span className="block text-sm leading-relaxed text-white/75">{body}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-auto max-w-[27rem] pt-10">
            <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.2em] text-gold">
              <span className="h-0.5 w-8 bg-gold" aria-hidden /> Our vision
            </p>
            <p className="mt-2 font-display text-3xl font-semibold">Har Hunar Ko Ek Pehchaan</p>
            <p className="mt-2 text-sm leading-relaxed text-white/75">
              Every skill, service and small business can create value in someone&apos;s life. Tarkkash builds a more connected,
              supportive community, one neighbourhood at a time.
            </p>
          </div>
        </div>
      </aside>

      <main id="main" className="flex min-w-0 flex-col bg-cream">
        <div className="flex flex-1 items-center justify-center px-4 py-8 sm:px-8 lg:py-12">
          <div className="w-full max-w-[34rem] rounded-[1.75rem] border border-line bg-white px-6 py-8 shadow-[0_20px_60px_-30px_rgb(0_59_60/0.35)] sm:px-10 sm:py-10">
            <div className="flex justify-center"><Logo className="h-20 sm:h-24" /></div>
            <div className="mt-6">{children}</div>
          </div>
        </div>
        <p className="pb-6 text-center text-xs text-slate"><Link href="/" className="hover:text-teal">← Back to Tarkkash</Link> · <Link href="/privacy" className="hover:text-teal">Privacy</Link></p>
      </main>
    </div>
  );
}
