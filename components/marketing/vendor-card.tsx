import Image from "next/image";
import Link from "next/link";
import { MapPin, BadgeCheck, Star } from "lucide-react";
import type { VendorCardData } from "@/lib/data/public";
import { formatINR, sizedImage } from "@/lib/format";
import { CategoryIcon } from "@/components/ui/category-icon";
import { cn } from "@/lib/cn";

export function VendorCard({ v, className, priority }: { v: VendorCardData; className?: string; priority?: boolean }) {
  const img = sizedImage(v.cover_url ?? v.avatar_url, 640, 420);
  return (
    <Link href={`/vendors/${v.slug}`}
      className={cn("group card flex flex-col overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-lift)]", className)}>
      <div className="relative aspect-[16/10] overflow-hidden bg-cream-200">
        {img ? (
          <Image src={img} alt="" fill unoptimized priority={priority} sizes="(max-width:768px) 100vw, 33vw"
            className="object-cover transition-transform duration-700 group-hover:scale-105" />
        ) : (
          <div className="pattern-jaali flex h-full items-center justify-center bg-teal-deep">
            {v.category && <CategoryIcon icon={v.category.icon} className="size-10 text-gold" />}
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/45 to-transparent" />
        {v.category && (
          <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-2.5 py-1 text-xs font-semibold text-ink shadow-sm">
            <CategoryIcon icon={v.category.icon} className="size-3.5 text-gold-600" />{v.category.name}
          </span>
        )}
        {v.rating && (
          <span className="absolute bottom-3 left-3 inline-flex items-center gap-1 rounded-full bg-black/55 px-2 py-0.5 text-xs font-semibold text-white backdrop-blur">
            <Star className="size-3.5 fill-gold text-gold" aria-hidden />{v.rating.avg.toFixed(1)}
            <span className="font-normal text-white/80">({v.rating.count})</span>
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-display text-lg font-semibold leading-snug text-ink group-hover:text-teal">{v.name}</h3>
        {v.tagline && <p className="mt-0.5 line-clamp-1 text-sm text-slate">{v.tagline}</p>}
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs">
          {v.verification === "verified" ? (
            <span className="inline-flex items-center gap-1 font-semibold text-teal"><BadgeCheck className="size-4 text-teal" aria-hidden />Profile details checked</span>
          ) : (
            <span className="text-slate">Tarkaash-listed provider</span>
          )}
          {v.locality && <span className="inline-flex items-center gap-1 text-slate"><MapPin className="size-3.5" aria-hidden />{v.locality}</span>}
        </div>
        <div className="mt-auto flex items-center justify-between border-t border-line pt-3 mt-4">
          <span className="text-sm text-slate">{v.fromPrice !== null ? <>From <strong className="text-ink">{formatINR(v.fromPrice)}</strong></> : "Request a quote"}</span>
          <span className="text-sm font-semibold text-teal">View profile →</span>
        </div>
      </div>
    </Link>
  );
}
