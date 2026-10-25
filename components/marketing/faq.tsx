import { ChevronDown } from "lucide-react";
import type { Faq } from "@/lib/content/seo";
import { SectionHeading } from "@/components/ui/misc";
import { JsonLd } from "@/components/seo/json-ld";
import { faqLd } from "@/lib/seo";

/** Visible FAQ (answer-first copy for AEO) plus matching FAQPage structured data. */
export function FaqSection({ faqs, title = "Frequently asked questions", eyebrow = "Good to know", className }: { faqs: Faq[]; title?: string; eyebrow?: string; className?: string }) {
  return (
    <section className={className ?? "container-page py-16 sm:py-20"} aria-labelledby="faq-title">
      <JsonLd data={faqLd(faqs)} />
      <SectionHeading eyebrow={eyebrow} title={<span id="faq-title">{title}</span>} />
      <div className="grid gap-3" data-stagger>
        {faqs.map((f, i) => (
          <details key={f.q} open={i === 0} className="group card overflow-hidden transition-shadow duration-300 open:shadow-[var(--shadow-lift)]">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 font-semibold text-ink sm:px-6 [&::-webkit-details-marker]:hidden">
              <h3 className="font-sans text-base font-semibold">{f.q}</h3>
              <ChevronDown className="size-5 shrink-0 text-gold-600 transition-transform duration-300 group-open:rotate-180" aria-hidden />
            </summary>
            <p className="px-5 pb-5 text-[15px] leading-relaxed text-slate sm:px-6">{f.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
