import type { Metadata, Viewport } from "next";
import { Fraunces, Inter } from "next/font/google";
import { ToastProvider } from "@/components/ui/toast";
import { RevealObserver, MOTION_BOOT_SCRIPT } from "@/components/motion/reveal-observer";
import { NavProgress } from "@/components/motion/nav-progress";
import "./globals.css";
import { BRAND, SITE_DESCRIPTION, SITE_KEYWORDS } from "@/lib/content/seo";
import { indexingAllowed, organizationLd, siteUrl, websiteLd } from "@/lib/seo";
import { JsonLd } from "@/components/seo/json-ld";

const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces", display: "swap", axes: ["SOFT", "opsz"] });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: { default: "Tarkaash | Trusted Local Services in Hyderabad", template: "%s | Tarkaash" },
  description: SITE_DESCRIPTION,
  keywords: SITE_KEYWORDS,
  applicationName: BRAND.name,
  category: "Local services",
  openGraph: {
    title: "Tarkaash | Har Hunar Ko Ek Pehchaan",
    description: SITE_DESCRIPTION,
    siteName: BRAND.name,
    locale: "en_IN",
    type: "website",
    url: "/",
  },
  twitter: { card: "summary_large_image", title: "Tarkaash | Trusted local services in Hyderabad", description: SITE_DESCRIPTION },
  robots: indexingAllowed()
    ? { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 } }
    : { index: false, follow: false, googleBot: { index: false, follow: false } },
  verification: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION ? { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION } : undefined,
  other: {
    "geo.region": "IN-TG",
    "geo.placename": BRAND.city,
    "geo.position": `${BRAND.geo.lat};${BRAND.geo.lng}`,
    ICBM: `${BRAND.geo.lat}, ${BRAND.geo.lng}`,
  },
};

export const viewport: Viewport = { themeColor: "#003B3C" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN" className={`${fraunces.variable} ${inter.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: MOTION_BOOT_SCRIPT }} />
        <JsonLd data={[organizationLd(), websiteLd()]} />
      </head>
      <body className="min-h-screen">
        <NavProgress />
        <RevealObserver />
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:rounded-full focus:bg-gold focus:px-4 focus:py-2 focus:text-teal-deep">
          Skip to content
        </a>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
