import Image from "next/image";

// Placeholder until the customer frontend is built.
export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center gap-6 p-6 text-center">
      <Image src="/brand/tarkaash-logo.webp" alt="Tarkaash" width={384} height={119} priority />
      <p className="text-lg">Har Hunar Ko Ek Pehchaan</p>
      <p className="text-sm text-[var(--tk-slate)]">The platform is being set up. Please check back soon.</p>
    </main>
  );
}
