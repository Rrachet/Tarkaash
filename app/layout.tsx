import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Tarkaash — Har Hunar Ko Ek Pehchaan", template: "%s · Tarkaash" },
  description: "Discover trusted local services and independent providers, with enquiries coordinated by Tarkaash.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
