import Link from "next/link";
import { Logo } from "@/components/ui/misc";
import { buttonClass } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main id="main" className="flex min-h-screen flex-col items-center justify-center bg-teal-deep px-6 text-center text-white">
      <Logo className="h-24" />
      <p className="mt-10 font-display text-7xl font-semibold text-gold">404</p>
      <h1 className="mt-2 text-3xl font-semibold">This page wandered off</h1>
      <p className="mt-2 max-w-md text-white/75">The page you&apos;re looking for doesn&apos;t exist or is no longer available.</p>
      <div className="mt-8 flex gap-3">
        <Link href="/" className={buttonClass("gold", "lg")}>Go home</Link>
        <Link href="/services" className={buttonClass("light", "lg")}>Explore services</Link>
      </div>
    </main>
  );
}
