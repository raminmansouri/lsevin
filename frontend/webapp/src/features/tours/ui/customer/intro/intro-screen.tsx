"use client";

import { useState, useTransition } from "react";
import { ArrowLeft, ArrowRight, CalendarDays, CheckCircle2, Languages, ShieldCheck } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { Link, useRouter } from "@/i18n/navigation";

import { directionOf } from "../../../domain/content";
import { completeIntroAction } from "../../../server/actions/customer";
import { PARENT_APP_PATH } from "../shell/tours-shell";

/** Licensed background photo; CC BY-SA requires the visible credit below (public/images/tours/CREDITS.json). */
const BACKGROUND = {
  src: "/images/tours/shiraz-nasir-al-mulk.webp",
  srcSmall: "/images/tours/shiraz-nasir-al-mulk-sm.webp",
  credit: "Ayyoubsabawiki · CC BY-SA 4.0",
  source: "https://commons.wikimedia.org/wiki/File:Nasir-al_molk_-1.jpg",
};

/**
 * Full-screen welcome (C-003): localized hero over a real photograph, a
 * visible Explore CTA — a plain button, so no swipe gesture is required.
 * Completion is persisted server-side + by cookie before navigating (C-004).
 */
export function IntroScreen({ next }: { next: string }) {
  const t = useTranslations("TourApp");
  const locale = useLocale();
  const router = useRouter();
  const [pending, start] = useTransition();
  const [failed, setFailed] = useState(false);
  const rtl = directionOf(locale) === "rtl";
  const Arrow = rtl ? ArrowLeft : ArrowRight;
  const Back = rtl ? ArrowRight : ArrowLeft;

  function proceed() {
    start(async () => {
      const res = await completeIntroAction().catch(() => null);
      // Even if persisting failed, never trap the visitor on the intro.
      if (!res?.ok) setFailed(true);
      router.replace(next);
    });
  }

  return (
    <section className="relative flex min-h-dvh flex-col overflow-hidden bg-emerald-950 text-white" aria-labelledby="intro-title" data-testid="tours-intro">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={BACKGROUND.src}
        srcSet={`${BACKGROUND.srcSmall} 720w, ${BACKGROUND.src} 1600w`}
        sizes="100vw"
        alt={t("intro.photoAlt")}
        fetchPriority="high"
        decoding="async"
        className="absolute inset-0 h-full w-full object-cover"
        data-testid="tours-intro-background"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/20 to-black/90" />
      <div className="relative mx-auto flex w-full max-w-xl flex-1 flex-col px-6 pt-6 pb-[calc(2rem+env(safe-area-inset-bottom))]">
        <Link
          href={PARENT_APP_PATH}
          className="inline-flex min-h-11 items-center gap-1.5 self-start rounded-full bg-black/30 px-3 text-sm font-medium backdrop-blur hover:bg-black/40 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
          data-testid="back-to-lsevin"
        >
          <Back className="size-4" aria-hidden="true" />
          {t("nav.backToLsevin")}
        </Link>
        <div className="mt-auto">
          <p className="text-xs font-semibold tracking-[0.2em] text-emerald-200 uppercase">{t("intro.eyebrow")}</p>
          <h1 id="intro-title" className="mt-3 text-4xl leading-tight font-extrabold sm:text-5xl">
            {t("intro.title")}
          </h1>
          <p className="mt-3 max-w-md text-base leading-7 text-white/90">{t("intro.subtitle")}</p>
          <ul className="mt-6 space-y-3 text-sm text-white/90">
            <li className="flex items-start gap-2">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-emerald-300" aria-hidden="true" />
              {t("intro.point1")}
            </li>
            <li className="flex items-start gap-2">
              <CalendarDays className="mt-0.5 size-4 shrink-0 text-emerald-300" aria-hidden="true" />
              {t("intro.point2")}
            </li>
            <li className="flex items-start gap-2">
              <Languages className="mt-0.5 size-4 shrink-0 text-emerald-300" aria-hidden="true" />
              {t("intro.point3")}
            </li>
          </ul>
          <button
            type="button"
            onClick={proceed}
            disabled={pending}
            data-testid="intro-continue"
            className="mt-8 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-orange-500 px-6 text-base font-bold text-white shadow-lg hover:bg-orange-600 focus-visible:ring-4 focus-visible:ring-orange-200 focus-visible:outline-none disabled:opacity-80 sm:w-auto"
          >
            {pending ? t("intro.continuing") : t("intro.cta")}
            {pending ? <CheckCircle2 className="size-5 animate-pulse" aria-hidden="true" /> : <Arrow className="size-5" aria-hidden="true" />}
          </button>
          {failed ? <span className="sr-only" role="status" /> : null}
          <p className="mt-6 text-[11px] text-white/60" data-testid="tours-intro-credit">
            {t("intro.photoPlace")} ·{" "}
            <a href={BACKGROUND.source} target="_blank" rel="noopener noreferrer" className="underline-offset-2 hover:underline">
              {BACKGROUND.credit}
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}
