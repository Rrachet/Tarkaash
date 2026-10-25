import type { Metadata } from "next";
export const metadata: Metadata = { title: "Privacy notice" };
export default function PrivacyPage() {
  return (
    <article className="container-page max-w-3xl py-16">
      <p className="eyebrow">Draft — pending legal review</p>
      <h1 className="mt-3 text-4xl font-semibold">Privacy notice</h1>
      <div className="mt-8 space-y-6 leading-relaxed text-ink/85 [&_h2]:mt-8 [&_h2]:text-2xl [&_h2]:font-semibold">
        <p>Tarkaash (“we”) coordinates enquiries between customers and independent local providers. This notice explains what we collect and why.</p>
        <h2>What we collect</h2>
        <p>When you send an enquiry or message we collect your name, phone and/or email, locality, the service requested, preferred dates and any details you provide. We also record anonymous usage events (such as profile views) to improve the service.</p>
        <h2>How we use it</h2>
        <p>To coordinate your enquiry, assign it to a provider, follow up, and keep a traceable record. Your contact details are shared only with the provider who accepts your order. We never sell personal data.</p>
        <h2>Retention</h2>
        <p>Enquiry and order records are kept for as long as needed to provide the service and meet legal obligations. You can ask us to delete your personal data at any time via the contact page.</p>
        <h2>Your choices</h2>
        <p>You can update communication preferences from your account and request access, correction or deletion of your data.</p>
        <p className="text-sm text-slate">This draft is provided for the client demo and must be approved before launch.</p>
      </div>
    </article>
  );
}
