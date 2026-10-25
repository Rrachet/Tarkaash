import Image from "next/image";
import { sizedImage } from "@/lib/format";
import { PointerGlow } from "@/components/motion/pointer-glow";

export function PageHero({ eyebrow, title, children, image }: { eyebrow: string; title: React.ReactNode; children?: React.ReactNode; image?: string }) {
  return (
    <PointerGlow as="section" className="relative overflow-hidden bg-teal-deep text-white">
      {image && <Image src={sizedImage(image, 1800, 700)!} alt="" fill unoptimized priority className="animate-kenburns object-cover opacity-30" sizes="100vw" />}
      <div className="absolute inset-0 bg-gradient-to-r from-teal-deep via-teal-deep/90 to-teal-deep/40" />
      <div className="pattern-jaali absolute inset-0 opacity-25" />
      <div className="absolute -right-32 -top-32 size-[420px] animate-drift rounded-full bg-gold/10 blur-3xl" aria-hidden />
      <div className="hero-seq container-page relative py-16 sm:py-24">
        <p className="eyebrow">{eyebrow}</p>
        <h1 style={{ "--d": "150ms" } as React.CSSProperties} className="mt-4 max-w-3xl text-4xl font-semibold leading-tight sm:text-6xl">{title}</h1>
        {children && <div style={{ "--d": "300ms" } as React.CSSProperties} className="mt-5 max-w-2xl text-lg text-white/80">{children}</div>}
      </div>
    </PointerGlow>
  );
}
