"use client";

import { useEffect, useRef, useState } from "react";
import { ImageOff } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { cn } from "@/lib/utils";

import { calendarDisplayName, formatInstant, formatIsoDate, type CalendarId } from "../../domain/calendar";
import { intlLocale } from "../shared/format";
import { Price } from "../shared/price";

import { useToursPrefs } from "./prefs-context";

/** A price in the charged currency, plus the approximate display-currency amount when the visitor picked one. */
export function TourPrice(props: { amount: number | null | undefined; currency: string; className?: string; testId?: string; decimals?: number }) {
  const t = useTranslations("TourApp.price");
  const prefs = useToursPrefs();
  return (
    <Price
      {...props}
      displayCurrency={prefs.currency}
      formatApprox={(amount) => t("approx", { amount })}
    />
  );
}

/** "From 12,000,000 IRR per person" with the qualifier on every card (C-019). */
export function FromPrice({
  amount,
  currency,
  basis,
  regular,
  className,
}: {
  amount: number | null;
  currency: string;
  basis: "per_person" | "per_group" | null;
  regular?: number | null;
  className?: string;
}) {
  const t = useTranslations("TourApp.price");
  if (amount == null) return null;
  return (
    <div className={cn("flex flex-wrap items-baseline gap-x-1.5 text-sm", className)} data-testid="from-price">
      <span className="text-slate-500">{t("fromLabel")}</span>
      <TourPrice amount={amount} currency={currency} className="text-base font-bold text-emerald-800" />
      {basis ? <span className="text-xs text-slate-500">{basis === "per_group" ? t("perGroup") : t("perPerson")}</span> : null}
      {regular != null && regular > amount ? (
        <span className="text-xs text-slate-400 line-through">
          <span className="sr-only">{t("regularLabel")} </span>
          <TourPrice amount={regular} currency={currency} />
        </span>
      ) : null}
    </div>
  );
}

/** Formatter for canonical dates / instants in the visitor's display calendar. */
export function useTourDateFormat() {
  const locale = useLocale();
  const prefs = useToursPrefs();
  return {
    calendar: prefs.calendar,
    date: (iso: string, style: "full" | "long" | "medium" | "short" = "medium", calendar?: CalendarId) =>
      formatIsoDate(iso, { locale: intlLocale(locale), calendar: calendar ?? prefs.calendar, style }),
    instant: (instant: string, timeZone: string, withZone = true, calendar?: CalendarId) =>
      formatInstant(instant, { locale: intlLocale(locale), calendar: calendar ?? prefs.calendar, timeZone, withZone }),
    calendarName: (calendar?: CalendarId) => calendarDisplayName(calendar ?? prefs.calendar, intlLocale(locale)),
  };
}

/** A canonical date in the visitor's display calendar, with the calendar named when asked (C-114). */
export function TourDate({
  iso,
  calendar,
  style = "medium",
  showCalendar,
  className,
}: {
  iso: string;
  calendar?: CalendarId;
  style?: "full" | "long" | "medium" | "short";
  showCalendar?: boolean;
  className?: string;
}) {
  const locale = useLocale();
  const prefs = useToursPrefs();
  const cal = calendar ?? prefs.calendar;
  return (
    <span className={className} suppressHydrationWarning>
      {formatIsoDate(iso, { locale: intlLocale(locale), calendar: cal, style })}
      {showCalendar ? <span className="text-slate-500"> ({calendarDisplayName(cal, intlLocale(locale))})</span> : null}
    </span>
  );
}

/** An absolute instant shown in the tour's own timezone and the visitor's calendar (S-062, S-066). */
export function TourInstant({
  instant,
  timeZone,
  calendar,
  withZone = true,
  className,
}: {
  instant: string;
  timeZone: string;
  calendar?: CalendarId;
  withZone?: boolean;
  className?: string;
}) {
  const locale = useLocale();
  const prefs = useToursPrefs();
  return (
    <span className={className} suppressHydrationWarning>
      {formatInstant(instant, { locale: intlLocale(locale), calendar: calendar ?? prefs.calendar, timeZone, withZone })}
    </span>
  );
}

/** Lazy image with a neutral fallback; provider media may live on any host, so no next/image loader. */
export function TourImage({
  src,
  alt,
  className,
  imgClassName,
  eager,
}: {
  src: string | null | undefined;
  alt: string;
  className?: string;
  imgClassName?: string;
  eager?: boolean;
}) {
  const t = useTranslations("TourApp.card");
  const [failed, setFailed] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  // A server-rendered <img> can fail before hydration attaches onError; the browser then never
  // re-fires the event and the broken-image icon stays. Re-check once mounted.
  useEffect(() => {
    const img = imgRef.current;
    if (img && img.complete && img.naturalWidth === 0) setFailed(true);
  }, [src]);
  if (!src || failed) {
    if (alt === "") return <div className={cn("bg-gradient-to-br from-emerald-800 via-emerald-700 to-sky-700", className)} aria-hidden="true" />;
    return (
      <div className={cn("flex items-center justify-center bg-gradient-to-br from-emerald-100 to-sky-100 text-emerald-700/60", className)} role="img" aria-label={alt || t("imageMissing")}>
        <ImageOff className="size-8" aria-hidden="true" />
      </div>
    );
  }
  return (
    <div className={cn("overflow-hidden bg-slate-200", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        loading={eager ? "eager" : "lazy"}
        decoding="async"
        onError={() => setFailed(true)}
        className={cn("h-full w-full object-cover", imgClassName)}
      />
    </div>
  );
}
