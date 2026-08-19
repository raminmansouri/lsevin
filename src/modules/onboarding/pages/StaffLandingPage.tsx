import Link from "next/link";
import { BadgeCheck, CalendarClock, CreditCard, Images, MessageSquareText, Stethoscope } from "lucide-react";
import { getPortalLocale } from "@core/i18n/server";
import { LocaleSwitcher } from "@core/ui/LocaleSwitcher";
import { landingCopy } from "../landing-copy";

const icons = [BadgeCheck, CreditCard, CalendarClock, Stethoscope, MessageSquareText, Images];

export async function StaffLandingPage() {
  const locale = await getPortalLocale();
  const copy = landingCopy[locale.locale];
  return <main className="min-h-screen bg-[#f8fafc] text-slate-950">
    <section className="relative bg-[linear-gradient(135deg,#083f30_0%,#064e3b_48%,#0f766e_100%)] text-white"><div className="absolute end-5 top-5"><LocaleSwitcher currentLocale={locale.locale} label={copy.language} /></div><div className="mx-auto max-w-7xl px-5 py-20 lg:py-28"><div className="max-w-4xl"><div className="mb-5 text-sm font-black text-[#eacb7f]">LSevin Staff Portal</div><h1 className="text-4xl font-black md:text-6xl">{copy.staffTitle}</h1><p className="mt-6 max-w-3xl text-lg leading-8 text-white/80">{copy.staffText}</p><div className="mt-8 flex flex-wrap gap-3"><Link href="/applications/new/staff" className="rounded-lg bg-[#eacb7f] px-5 py-3 text-sm font-black text-[#083f30]">{copy.staffStart}</Link><Link href="/become-provider" className="rounded-lg border border-white/25 px-5 py-3 text-sm font-bold">{copy.clinicPath}</Link></div></div></div></section>
    <section className="mx-auto max-w-7xl px-5 py-14"><h2 className="text-3xl font-black">{copy.staffStepsTitle}</h2><div className="mt-7 grid gap-4 md:grid-cols-4">{copy.staffSteps.map((step, index) => <div key={step} className="rounded-2xl border bg-white p-5 shadow-sm"><div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-[#083f30] font-black text-white">{index + 1}</div><p className="font-bold leading-7">{step}</p></div>)}</div></section>
    <section className="mx-auto max-w-7xl px-5 pb-16"><h2 className="text-3xl font-black">{copy.staffToolsTitle}</h2><div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{copy.staffTools.map((label, index) => { const Icon = icons[index]; return <div key={label} className="rounded-2xl border bg-white p-5 shadow-sm"><Icon className="mb-4 text-[#065f46]" size={22} /><div className="font-black">{label}</div></div>; })}</div></section>
  </main>;
}
