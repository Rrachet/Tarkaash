"use client";

import { useEffect } from "react";
import Link from "next/link";
import { buttonClass } from "@/components/ui/button";
import { KMark } from "@/components/brand/k-mark";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  return (
    <main id="main" className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
      <KMark size={56} className="mb-5 rounded-2xl" />
      <p className="eyebrow">Something went wrong</p>
      <h1 className="mt-3 text-3xl font-semibold">We couldn&apos;t load this page</h1>
      <p className="mt-2 max-w-md text-slate">Please try again. If the problem continues, contact Tarkaash support{error.digest ? ` (ref ${error.digest})` : ""}.</p>
      <div className="mt-6 flex gap-3">
        <button onClick={reset} className={buttonClass("primary", "md")}>Try again</button>
        <Link href="/" className={buttonClass("outline", "md")}>Go home</Link>
      </div>
    </main>
  );
}
