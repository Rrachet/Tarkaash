import type { Metadata, Viewport } from "next";
import { Fraunces, Inter } from "next/font/google";
import { ToastProvider } from "@/components/ui/toast";
import "./globals.css";

const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces", display: "swap", axes: ["SOFT", "opsz"] });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: { default: "Tarkaash — Good services. Closer to home.", template: "%s · Tarkaash" },
  description: "Discover trusted local services and independent providers in your community, with every enquiry coordinated by Tarkaash. Har Hunar Ko Ek Pehchaan.",
  openGraph: {
    title: "Tarkaash — Har Hunar Ko Ek Pehchaan",
    description: "Discover trusted local services and independent providers, coordinated by Tarkaash.",
    images: ["/brand/tarkaash-logo-color.png"],
    type: "website",
  },
};

export const viewport: Viewport = { themeColor: "#003B3C" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${inter.variable}`}>
      <body className="min-h-screen">
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:rounded-full focus:bg-gold focus:px-4 focus:py-2 focus:text-teal-deep">
          Skip to content
        </a>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
