import Image from "next/image";
import Link from "next/link";
import { Users, TrendingUp, ShieldCheck, HeartHandshake } from "lucide-react";
import { Logo } from "@/components/ui/misc";
import { HOME_IMAGES } from "@/lib/content/site";
import { sizedImage } from "@/lib/format";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1fr_1.05fr]">
      <aside className="relative hidden overflow-hidden bg-teal-deep text-white lg:block">
        <Image src={sizedImage(HOME_IMAGES.vendorLogin, 1200, 1600)!} alt="" fill unoptimized priority className="animate-kenburns object-cover opacity-35" sizes="50vw" />
        <div className="absolute inset-0 bg-gradient-to-b from-teal-deep/80 via-teal-deep/70 to-teal-deep" />
        <div className="pattern-jaali absolute inset-0 opacity-25" />
        <div className="relative flex h-full flex-col p-12">
          <Logo className="h-20" />
          <div className="hero-seq mt-auto max-w-md">
            <p className="eyebrow">Tarkaash platform</p>
            <h2 style={{ "--d": "120ms" } as React.CSSProperties} className="mt-3 text-5xl font-semibold leading-tight">Grow your business <span className="text-shine">with Tarkaash</span></h2>
            <p style={{ "--d": "240ms" } as React.CSSProperties} className="mt-4 text-white/80">Be part of a trusted community that connects your skills and services with real people and real opportunities.</p>
            <ul style={{ "--d": "360ms" } as React.CSSProperties} className="mt-8 grid grid-cols-2 gap-4 text-sm">
              {[
                { i: Users, t: "More customers" }, { i: TrendingUp, t: "Higher visibility" },
                { i: ShieldCheck, t: "Secure & transparent" }, { i: HeartHandshake, t: "Support local" },
              ].map(({ i: I, t }) => (
                <li key={t} className="flex items-center gap-3"><span className="flex size-10 items-center justify-center rounded-xl bg-gold text-teal-deep"><I className="size-5" /></span>{t}</li>
              ))}
            </ul>
            <div style={{ "--d": "480ms" } as React.CSSProperties} className="mt-10 border-t border-white/15 pt-6">
              <p className="font-display text-2xl text-gold">Har Hunar Ko Ek Pehchaan</p>
              <p className="mt-1 text-sm text-white/70">Every skill and small business deserves a bigger stage — one neighbourhood at a time.</p>
            </div>
          </div>
        </div>
      </aside>
      <main id="main" className="flex flex-col bg-cream">
        <div className="flex items-center justify-between bg-teal-deep px-5 py-3 lg:hidden">
          <Logo className="h-12" />
        </div>
        <div className="flex flex-1 items-center justify-center px-5 py-10 sm:px-10">
          <div className="w-full max-w-md">{children}</div>
        </div>
        <p className="pb-6 text-center text-xs text-slate"><Link href="/" className="hover:text-teal">← Back to Tarkaash</Link> · <Link href="/privacy" className="hover:text-teal">Privacy</Link></p>
      </main>
    </div>
  );
}
