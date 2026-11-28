"use client";

import { useState, useTransition } from "react";
import { ArrowLeft, ArrowRight, BadgeCheck, BedDouble, CalendarCheck2, CheckCircle2, HeartPulse, Home, Hotel, Landmark, ReceiptText } from "lucide-react";
import { useTranslations } from "next-intl";

import { Link, useRouter } from "@/i18n/navigation";

import { completeStaysIntroAction } from "../../server/actions/customer";
import { PARENT_APP_PATH } from "../shell/stays-shell";
import { responsiveImg } from "@/lib/media/responsive-img";

/** Licensed background (public/images/stays/CREDITS.json); the visible credit below is required by CC BY 2.0. */
const BACKGROUND = {
  src: "/images/stays/yazd-traditional-courtyard.webp",
  srcSmall: "/images/stays/yazd-traditional-courtyard-sm.webp",
  credit: "Julia Maudlin · CC BY 2.0",
  source: "https://commons.wikimedia.org/wiki/File:Traditional_Hotel,_Yazd,_Iran_(14473821732).jpg",
};

export type IntroCity = { slug: string; name: string; count: number };

/**
 * First-visit welcome for stays (same contract as the tours intro): a real
 * photograph, the promise in three lines and one plain button — no swipe needed.
 * Completion is saved (account + cookie) before navigating; a failed save never
 * traps the visitor. Below the fold it carries crawlable content and links to
 * destination pages, because /stays sends first-time visitors (and crawlers) here.
 */
export function StaysIntro({ next, cities }: { next: string; cities: IntroCity[] }) {
  const t = useTranslations("StayApp.intro");
  const tNav = useTranslations("StayApp.nav");
  const tHome = useTranslations("StayApp.home");
  const router = useRouter();
  const [pending, start] = useTransition();
  const [failed, setFailed] = useState(false);
  const Arrow = ArrowRight; // mirrored in RTL by globals.css
  const Back = ArrowLeft; // mirrored in RTL by globals.css

  function proceed() {
    start(async () => {
      const res = await completeStaysIntroAction().catch(() => null);
      if (!res?.ok) setFailed(true);
      router.replace(next);
    });
  }

  const what = [
    { icon: Hotel, text: t("what1") },
    { icon: Landmark, text: t("what2") },
    { icon: Home, text: t("what3") },
    { icon: HeartPulse, text: t("what4") },
  ];

  return (
    <>
      <section className="relative flex min-h-dvh flex-col overflow-hidden bg-emerald-950 text-white" aria-labelledby="stays-intro-title" data-testid="stays-intro">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          // Through the optimizer: phones used to pick the 1200 px original (175 KB).
          {...responsiveImg(BACKGROUND.src, "100vw")}
          alt={t("photoAlt")}
          fetchPriority="high"
          decoding="async"
          width={1200}
          height={1691}
          className="absolute inset-0 h-full w-full object-cover"
          data-testid="stays-intro-background"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/10 to-black/90" />
        <div className="relative mx-auto flex w-full max-w-xl flex-1 flex-col px-6 pt-6 pb-[calc(2rem+env(safe-area-inset-bottom))]">
          <Link
            href={PARENT_APP_PATH}
            prefetch={false}
            className="inline-flex min-h-11 items-center gap-1.5 self-start rounded-full bg-black/30 px-3 text-sm font-medium backdrop-blur hover:bg-black/40 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
          >
            <Back className="size-4" aria-hidden="true" />
            {tNav("backToLsevin")}
          </Link>
          <div className="mt-auto">
            <p className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-[0.2em] text-amber-200 uppercase">
              <BedDouble className="size-4" aria-hidden="true" />
              {t("eyebrow")}
            </p>
            <h1 id="stays-intro-title" className="mt-3 text-4xl leading-tight font-extrabold sm:text-5xl">
              {t("title")}
            </h1>
            <p className="mt-3 max-w-md text-base leading-7 text-white/90">{t("subtitle")}</p>
            <ul className="mt-6 space-y-3 text-sm text-white/90">
              <li className="flex items-start gap-2">
                <ReceiptText className="mt-0.5 size-4 shrink-0 text-amber-300" aria-hidden="true" />
                {t("point1")}
              </li>
              <li className="flex items-start gap-2">
                <CalendarCheck2 className="mt-0.5 size-4 shrink-0 text-amber-300" aria-hidden="true" />
                {t("point2")}
              </li>
              <li className="flex items-start gap-2">
                <BadgeCheck className="mt-0.5 size-4 shrink-0 text-amber-300" aria-hidden="true" />
                {t("point3")}
              </li>
            </ul>
            <button
              type="button"
              onClick={proceed}
              disabled={pending}
              data-testid="stays-intro-continue"
              className="mt-8 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-orange-500 px-6 text-base font-bold text-white shadow-lg hover:bg-orange-600 focus-visible:ring-4 focus-visible:ring-orange-200 focus-visible:outline-none disabled:opacity-80 sm:w-auto"
            >
              {pending ? t("continuing") : t("cta")}
              {pending ? <CheckCircle2 className="size-5 animate-pulse" aria-hidden="true" /> : <Arrow className="size-5" aria-hidden="true" />}
            </button>
            {failed ? <span className="sr-only" role="status" /> : null}
            <p className="mt-6 text-[11px] text-white/60" data-testid="stays-intro-credit">
              {t("photoPlace")} ·{" "}
              <a href={BACKGROUND.source} target="_blank" rel="noopener noreferrer" className="underline-offset-2 hover:underline">
                {BACKGROUND.credit}
              </a>
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-6 py-10" aria-labelledby="stays-intro-what">
        <h2 id="stays-intro-what" className="text-xl font-bold text-slate-900">
          {t("whatTitle")}
        </h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {what.map(({ icon: Icon, text }) => (
            <li key={text} className="flex items-start gap-3 rounded-2xl bg-white p-4 text-sm leading-6 text-slate-700 ring-1 ring-slate-200">
              <Icon className="mt-0.5 size-5 shrink-0 text-emerald-700" aria-hidden="true" />
              {text}
            </li>
          ))}
        </ul>
        {cities.length ? (
          <>
            <h2 className="mt-8 text-xl font-bold text-slate-900">{t("popular")}</h2>
            <ul className="mt-4 flex flex-wrap gap-2" data-testid="stays-intro-cities">
              {cities.map((c) => (
                <li key={c.slug}>
                  <Link
                    href={`/stays/city/${c.slug}`}
                    className="inline-flex min-h-11 items-center gap-2 rounded-full bg-white px-4 text-sm font-medium text-emerald-900 ring-1 ring-slate-200 hover:bg-emerald-50 focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:outline-none"
                  >
                    {c.name}
                    <span className="text-xs text-slate-500">{tHome("propertyCount", { count: c.count })}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        ) : null}
      </section>
    </>
  );
}
