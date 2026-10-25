import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string; denied?: string }> }) {
  const sp = await searchParams;
  const demo = process.env.NEXT_PUBLIC_DEMO_MODE === "1";
  return <LoginForm next={sp.next} linkError={sp.error === "link"} demo={demo} demoPassword={demo ? process.env.NEXT_PUBLIC_DEMO_PASSWORD : undefined} />;
}
