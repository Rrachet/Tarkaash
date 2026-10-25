import type { Metadata } from "next";
export const metadata: Metadata = { title: "Terms" };
export default function TermsPage() {
  return (
    <article className="container-page max-w-3xl py-16">
      <p className="eyebrow">Draft — pending legal review</p>
      <h1 className="mt-3 text-4xl font-semibold">Terms of use</h1>
      <div className="mt-8 space-y-6 leading-relaxed text-ink/85 [&_h2]:mt-8 [&_h2]:text-2xl [&_h2]:font-semibold">
        <p>Tarkaash is a coordination platform connecting customers with independent local providers. Providers are independent businesses responsible for the services they deliver.</p>
        <h2>Enquiries and pricing</h2>
        <p>Prices shown are indicative until confirmed by the provider. Availability is not guaranteed until an order is accepted.</p>
        <h2>Fees</h2>
        <p>Any Tarkaash fee (such as Tarkaash Assist) is shown before you submit and is optional unless stated. Fees and commission terms are subject to final approval.</p>
        <h2>Verification</h2>
        <p>A verification badge means Tarkaash completed defined checks; it is not a guarantee of quality or outcome.</p>
        <h2>Reviews</h2>
        <p>Reviews can be left only for completed Tarkaash orders and are moderated.</p>
        <p className="text-sm text-slate">This draft is provided for the client demo and must be approved before launch.</p>
      </div>
    </article>
  );
}
