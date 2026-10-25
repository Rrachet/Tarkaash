import type { Metadata } from "next";
import Image from "next/image";
import { Users, TrendingUp, ShieldCheck, LayoutDashboard, CheckCircle2, Clock } from "lucide-react";
import { getViewer } from "@/lib/auth";
import { getCategories } from "@/lib/data/public";
import { createClient } from "@/lib/supabase/server";
import { ButtonLink } from "@/components/ui/button";
import { VendorApplicationForm } from "@/components/forms/vendor-application-form";
import { HOME_IMAGES } from "@/lib/content/site";
import { sizedImage } from "@/lib/format";

export const metadata: Metadata = { title: "List your service", description: "Grow your local business with Tarkaash." };

export default async function ListYourServicePage() {
  const [viewer, categories] = await Promise.all([getViewer(), getCategories()]);
  let existing: { name: string; status: string } | null = null;
  if (viewer?.vendorIds.length) {
    const supabase = await createClient();
    const { data } = await supabase.from("vendors").select("name, status").eq("id", viewer.vendorIds[0]!).maybeSingle();
    existing = data;
  }
  return (
    <>
      <section className="relative overflow-hidden bg-teal-deep text-white">
        <div className="pattern-jaali absolute inset-0 opacity-25" />
        <div className="container-page relative grid items-center gap-10 py-16 lg:grid-cols-2 lg:py-20">
          <div>
            <p className="eyebrow">Vendor portal</p>
            <h1 className="mt-4 text-4xl font-semibold leading-tight sm:text-6xl">Grow your business <span className="text-gold">with Tarkaash</span></h1>
            <p className="mt-5 max-w-xl text-lg text-white/80">Join a trusted community that connects your skills with real customers nearby. No upfront listing fee during the pilot.</p>
            <ul className="mt-8 grid gap-4 sm:grid-cols-2">
              {[
                { i: Users, t: "More customers", d: "Reach new and local customers" }, { i: TrendingUp, t: "Higher visibility", d: "Get discovered on Tarkaash" },
                { i: ShieldCheck, t: "Secure & transparent", d: "Clear orders and payment records" }, { i: LayoutDashboard, t: "Your dashboard", d: "Views, enquiries and earnings" },
              ].map(({ i: I, t, d }) => (
                <li key={t} className="flex gap-3"><span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gold text-teal-deep"><I className="size-5" /></span><div><p className="font-semibold">{t}</p><p className="text-sm text-white/70">{d}</p></div></li>
              ))}
            </ul>
          </div>
          <div className="relative hidden aspect-[4/3.6] overflow-hidden rounded-[2rem] lg:block">
            <Image src={sizedImage(HOME_IMAGES.vendorLogin, 1000, 900)!} alt="Local entrepreneurs at work" fill unoptimized className="object-cover" sizes="50vw" />
          </div>
        </div>
      </section>

      <section className="container-page grid gap-10 py-16 lg:grid-cols-[1fr_1.2fr]">
        <div>
          <h2 className="text-3xl font-semibold">How onboarding works</h2>
          <ol className="mt-6 space-y-5">
            {["Create your account and tell us about your business.", "Tarkaash reviews your details and verifies identity, area and any licence your category needs.", "Add services, prices and photos from your vendor portal.", "Go live — Tarkaash starts sending you coordinated enquiries."].map((s, i) => (
              <li key={s} className="flex gap-4"><span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-teal font-bold text-white">{i + 1}</span><p className="pt-1.5">{s}</p></li>
            ))}
          </ol>
        </div>
        <div className="card p-6 sm:p-8">
          {existing ? (
            <div className="text-center">
              {existing.status === "active" ? <CheckCircle2 className="mx-auto size-12 text-success" /> : <Clock className="mx-auto size-12 text-gold-600" />}
              <h2 className="mt-4 text-2xl font-semibold">{existing.name}</h2>
              <p className="mt-2 text-slate">{existing.status === "active" ? "Your listing is live." : "Your application is with the Tarkaash team. We'll be in touch soon."}</p>
              <ButtonLink href="/vendor" className="mt-6">Open vendor portal</ButtonLink>
            </div>
          ) : viewer ? (
            <>
              <h2 className="text-2xl font-semibold">Tell us about your business</h2>
              <p className="mt-1 text-sm text-slate">Takes about 2 minutes. You can add services and photos after approval.</p>
              <VendorApplicationForm categories={categories.map((c) => ({ id: c.id, name: c.name }))} />
            </>
          ) : (
            <div className="text-center">
              <h2 className="text-2xl font-semibold">Start your application</h2>
              <p className="mt-2 text-slate">Create a free account first so you can track your application and manage your listing.</p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <ButtonLink href="/signup?next=/list-your-service" variant="gold" size="lg">Create account</ButtonLink>
                <ButtonLink href="/login?next=/list-your-service" variant="outline" size="lg">I already have one</ButtonLink>
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
