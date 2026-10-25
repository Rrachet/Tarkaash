import type { Metadata } from "next";
import Image from "next/image";
import { FlaskConical, Target, HeartHandshake, Users, ArrowRight, Brain, LineChart, Lightbulb, Settings2, FileText, BarChart3 } from "lucide-react";
import { PageHero } from "@/components/marketing/page-hero";
import { ButtonLink } from "@/components/ui/button";
import { FOUNDERS, HOME_IMAGES } from "@/lib/content/site";
import { sizedImage } from "@/lib/format";
import { ABOUT_FACTS, HOME_FAQS } from "@/lib/content/seo";
import { FaqSection } from "@/components/marketing/faq";
import { pageMeta } from "@/lib/seo";

export const metadata: Metadata = pageMeta({
  title: "About Tarkaash | Founders and Vision",
  description: "Tarkaash is a Hyderabad local services platform founded by Dr. Ankita Mishra and Shailesh Srivastava to help independent entrepreneurs and home businesses get discovered. Har Hunar Ko Ek Pehchaan.",
  path: "/about",
  keywords: ["Tarkaash founders", "support local businesses Hyderabad", "home business platform India"],
});

const STRENGTH_ICONS = [[Brain, LineChart, Lightbulb], [Settings2, FileText, BarChart3]];

export default function AboutPage() {
  return (
    <>
      <PageHero eyebrow="Our story" title={<>Meet the Founders</>} image={HOME_IMAGES.aboutHero}>
        <p className="font-display text-2xl text-white">Two different journeys. A shared belief that every skill and service deserves a bigger stage.</p>
        <p className="mt-3">Tarkaash was founded to help independent entrepreneurs get discovered and to make it easy for customers to find trusted local services, all in one place.</p>
      </PageHero>

      <section className="container-page -mt-10 relative z-10">
        <div className="card grid grid-cols-2 divide-line md:grid-cols-4 md:divide-x" data-stagger="zoom">
          {[
            { i: FlaskConical, t: "Research-backed approach" }, { i: Target, t: "Execution-focused mindset" },
            { i: HeartHandshake, t: "Customer-centric platform" }, { i: Users, t: "Real people, real opportunities" },
          ].map(({ i: I, t }) => (
            <div key={t} className="group flex flex-col items-center gap-3 p-6 text-center">
              <span className="flex size-12 items-center justify-center rounded-full bg-gold-pale text-teal transition duration-500 group-hover:scale-110 group-hover:bg-teal-deep group-hover:text-gold"><I className="size-6" /></span>
              <p className="text-sm font-semibold">{t}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container-page pt-16 sm:pt-20" aria-labelledby="glance-title">
        <div data-reveal className="card p-6 sm:p-8">
          <h2 id="glance-title" className="text-2xl font-semibold sm:text-3xl">Tarkaash at a glance</h2>
          <dl className="mt-6 grid gap-x-10 gap-y-5 sm:grid-cols-2">
            {ABOUT_FACTS.map((f) => (
              <div key={f.k} className="border-l-2 border-gold pl-4">
                <dt className="text-xs font-semibold uppercase tracking-wider text-slate">{f.k}</dt>
                <dd className="mt-1 text-[15px] text-ink">{f.v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="container-page space-y-10 py-16 sm:py-24">
        {FOUNDERS.map((f, idx) => (
          <article key={f.name} data-reveal={idx % 2 ? "right" : "left"} className={`group card grid items-stretch overflow-hidden ${idx % 2 ? "md:grid-cols-[1fr_320px]" : "md:grid-cols-[320px_1fr]"}`}>
            <div className={`relative min-h-80 bg-cream-200 ${idx % 2 ? "md:order-2" : ""}`}>
              <Image src={f.photo} alt={`${f.name}, ${f.role}`} fill className="object-cover object-top transition-transform duration-[1.4s] ease-out group-hover:scale-105" sizes="320px" />
            </div>
            <div className={`p-7 sm:p-10 ${idx % 2 ? "md:order-1" : ""}`}>
              <h2 className="text-3xl font-semibold">{f.name}</h2>
              <p className="mt-1 flex items-center gap-3 font-semibold text-gold-600"><span className="h-0.5 w-8 rounded bg-gold" />{f.role}</p>
              <p className="mt-3 font-medium text-teal">{f.title}</p>
              <p className="mt-4 leading-relaxed text-ink/85">{f.bio}</p>
              <ul className="mt-6 flex flex-wrap gap-3">
                {f.strengths.map((s, i) => {
                  const I = STRENGTH_ICONS[idx]![i]!;
                  return <li key={s} className="flex items-center gap-2 rounded-full bg-cream px-3 py-1.5 text-sm font-medium"><I className="size-4 text-gold-600" />{s}</li>;
                })}
              </ul>
            </div>
          </article>
        ))}
      </section>

      <section className="container-page">
        <div data-reveal="zoom" className="relative overflow-hidden rounded-[2rem] bg-teal-deep px-6 py-14 text-white sm:px-14">
          <Image src={sizedImage(HOME_IMAGES.vision, 1600, 700)!} alt="" fill unoptimized className="animate-kenburns object-cover opacity-25" sizes="100vw" />
          <div className="absolute inset-0 bg-gradient-to-r from-teal-deep to-teal-deep/50" />
          <div className="relative max-w-2xl">
            <p className="eyebrow">Our vision</p>
            <h2 className="mt-3 text-4xl font-semibold sm:text-5xl">Har Hunar Ko Ek Pehchaan</h2>
            <p className="mt-4 text-lg text-white/85">We believe every skill, service and small business has the potential to create value in someone&apos;s life. Tarkaash is our way of building a more connected, supportive and opportunity-rich community, one neighbourhood at a time.</p>
            <ButtonLink href="/list-your-service" variant="gold" size="lg" className="mt-8">Be part of the journey <ArrowRight className="size-4" /></ButtonLink>
          </div>
        </div>
      </section>
      <FaqSection faqs={HOME_FAQS.slice(0, 4)} />
    </>
  );
}
