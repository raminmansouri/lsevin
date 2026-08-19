import Link from "next/link";
import { BadgeCheck, Building2, CalendarClock, CreditCard, FileText, Images, MessageSquareText, Stethoscope, Users } from "lucide-react";
import { getPortalLocale } from "@core/i18n/server";
import { LocaleSwitcher } from "@core/ui/LocaleSwitcher";
import { landingCopy } from "../landing-copy";
import { translatePortalText } from "@core/i18n/translate";

const icons = [Building2, Stethoscope, Users, CalendarClock, FileText, MessageSquareText, Images, CreditCard];

export async function LandingPage({ searchParams = {} }: { searchParams?: Record<string, string | string[] | undefined> }) {
  const locale = await getPortalLocale();
  const copy = landingCopy[locale.locale];
  const authRequired = searchParams.auth === "required";
  return <main className="min-h-screen bg-[#f8fafc] text-slate-950">
    {authRequired ? <div className="border-b border-amber-200 bg-amber-50 px-5 py-3 text-center text-sm font-semibold text-amber-950">{translatePortalText(locale.locale, "Sign in through your LSevin account to continue.")}</div> : null}
    <section className="relative overflow-hidden bg-[linear-gradient(135deg,#083f30_0%,#065f46_48%,#0f766e_100%)] text-white">
      <div className="absolute end-5 top-5 z-10"><LocaleSwitcher currentLocale={locale.locale} label={copy.language} /></div>
      <div className="mx-auto max-w-7xl px-5 py-20 lg:py-28"><div className="max-w-4xl"><div className="mb-5 text-sm font-black text-[#eacb7f]">LSevin Providers Portal</div><h1 className="text-4xl font-black tracking-tight md:text-6xl">{copy.providerTitle}</h1><p className="mt-6 max-w-3xl text-lg leading-8 text-white/80">{copy.providerText}</p><div className="mt-8 flex flex-wrap gap-3"><Link href="/applications/new" className="rounded-lg bg-[#eacb7f] px-5 py-3 text-sm font-black text-[#083f30]">{copy.apply}</Link><Link href="/dashboard" className="rounded-lg border border-white/25 px-5 py-3 text-sm font-bold">{copy.openPortal}</Link></div><div className="mt-8 grid gap-3 sm:grid-cols-3">{copy.promises.map((item) => <div key={item} className="flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-sm"><BadgeCheck size={16} className="text-[#eacb7f]" />{item}</div>)}</div></div></div>
    </section>
    <section className="mx-auto max-w-7xl px-5 py-14"><h2 className="text-3xl font-black">{copy.stepsTitle}</h2><div className="mt-7 grid gap-4 md:grid-cols-3">{copy.steps.map((step, index) => <div key={step} className="rounded-2xl border bg-white p-5 shadow-sm"><div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-[#083f30] font-black text-white">{index + 1}</div><p className="font-bold leading-7">{step}</p></div>)}</div></section>
    <section className="mx-auto max-w-7xl px-5 pb-14"><h2 className="text-3xl font-black">{copy.capabilitiesTitle}</h2><div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{copy.capabilities.map((label, index) => { const Icon = icons[index]; return <div key={label} className="rounded-2xl border bg-white p-5 shadow-sm"><Icon className="mb-4 text-[#065f46]" size={22} /><div className="font-black">{label}</div></div>; })}</div></section>
    <section className="border-y bg-white"><div className="mx-auto max-w-7xl px-5 py-12"><h2 className="text-3xl font-black text-[#083f30]">{copy.financeTitle}</h2><p className="mt-4 max-w-4xl text-base leading-8 text-muted-foreground">{copy.financeText}</p></div></section>
  </main>;
}
