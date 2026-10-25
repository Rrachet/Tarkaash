import type { Metadata } from "next";
import { Mail, MessageCircle, MapPin, Briefcase, Store, Headset, Lightbulb, Handshake, MessageSquare } from "lucide-react";
import { PageHero } from "@/components/marketing/page-hero";
import { ContactForm } from "@/components/forms/contact-form";
import { getPublicSettings } from "@/lib/data/public";
import { HOME_IMAGES } from "@/lib/content/site";

export const metadata: Metadata = { title: "Contact", description: "Get in touch with Tarkaash for support, listings and partnerships." };

const TOPICS = [
  { topic: "listing", icon: Store, t: "List my service", d: "I want to create a vendor listing on Tarkaash." },
  { topic: "support", icon: Headset, t: "Customer support", d: "I need help with an enquiry or booking." },
  { topic: "feature", icon: Lightbulb, t: "Feature suggestion", d: "I have an idea to make Tarkaash better." },
  { topic: "partnership", icon: Handshake, t: "Partnership / collaboration", d: "I want to explore a partnership." },
  { topic: "general", icon: MessageSquare, t: "General enquiry", d: "Any other question or feedback." },
];

export default async function ContactPage({ searchParams }: { searchParams: Promise<{ topic?: string; message?: string }> }) {
  const [{ contact }, sp] = await Promise.all([getPublicSettings(), searchParams]);
  const channels = [
    { icon: Mail, t: "Email us", v: contact.email, d: "We usually respond within 24 hours" },
    { icon: MessageCircle, t: "Chat on WhatsApp", v: contact.phone, d: "Quick questions and support" },
    { icon: MapPin, t: "Our location", v: contact.address ?? "Hyderabad, Telangana", d: "Community-first, starting in Hyderabad" },
    { icon: Briefcase, t: "Partnerships", v: "Use the form below", d: "Collaborations and community tie-ups" },
  ];
  return (
    <>
      <PageHero eyebrow="Contact us" title={<>Let&apos;s build a stronger local community together</>} image={HOME_IMAGES.contact}>
        Have a question, suggestion or partnership idea? We&apos;d love to hear from you.
      </PageHero>
      <section className="container-page -mt-10 relative z-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4" data-stagger>
        {channels.map((c) => (
          <div key={c.t} className="group card p-6 text-center transition duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-lift)]">
            <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-gold-pale text-teal transition duration-500 group-hover:scale-110 group-hover:bg-teal-deep group-hover:text-gold"><c.icon className="size-6" /></span>
            <p className="mt-3 font-semibold">{c.t}</p>
            <p className="mt-1 text-sm font-medium text-teal">{contact.confirmed || c.t === "Our location" || c.t === "Partnerships" ? c.v : "Details coming soon — please use the form"}</p>
            <p className="mt-1 text-xs text-slate">{c.d}</p>
          </div>
        ))}
      </section>
      <section className="container-page grid gap-8 py-16 lg:grid-cols-[1.3fr_1fr]">
        <div data-reveal="left" className="card p-6 sm:p-8">
          <h2 className="text-3xl font-semibold">Send us a message</h2>
          <p className="mt-1 text-slate">Fill in the details and the right Tarkaash team will get back to you.</p>
          <ContactForm initialTopic={sp.topic} initialMessage={sp.message} />
        </div>
        <div data-reveal="right" className="card p-6 sm:p-8">
          <h2 className="text-2xl font-semibold">Common topics</h2>
          <ul className="mt-4 divide-y divide-line">
            {TOPICS.map((t) => (
              <li key={t.topic}>
                <a href={`/contact?topic=${t.topic}#contact-form`} className="flex items-center gap-4 py-4 transition hover:translate-x-1">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-gold-pale text-teal"><t.icon className="size-5" /></span>
                  <span className="flex-1"><span className="block font-semibold">{t.t}</span><span className="block text-sm text-slate">{t.d}</span></span>
                  <span className="text-slate">›</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
