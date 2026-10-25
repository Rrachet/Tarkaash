import Image from "next/image";
import { sizedImage } from "@/lib/format";

export function PageHero({ eyebrow, title, children, image }: { eyebrow: string; title: React.ReactNode; children?: React.ReactNode; image?: string }) {
  return (
    <section className="relative overflow-hidden bg-teal-deep text-white">
      {image && <Image src={sizedImage(image, 1800, 700)!} alt="" fill unoptimized priority className="object-cover opacity-30" sizes="100vw" />}
      <div className="absolute inset-0 bg-gradient-to-r from-teal-deep via-teal-deep/90 to-teal-deep/40" />
      <div className="pattern-jaali absolute inset-0 opacity-25" />
      <div className="container-page relative py-16 sm:py-24">
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-tight sm:text-6xl">{title}</h1>
        {children && <div className="mt-5 max-w-2xl text-lg text-white/80">{children}</div>}
      </div>
    </section>
  );
}
