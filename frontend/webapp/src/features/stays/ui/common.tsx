"use client";

import Image from "next/image";
import { useLinkStatus } from "next/link";
import { Loader2, Star } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { resolveMediaUrl } from "@/features/service-providers/lib/media-url";
import { formatIsoDate } from "@/features/tours/domain/calendar";
import { useToursPrefs } from "@/features/tours/ui/customer/prefs-context";
import { Bdi } from "@/features/tours/ui/shared/bidi";
import { formatClock, formatNumber, intlLocale } from "@/features/tours/ui/shared/format";
import { Price } from "@/features/tours/ui/shared/price";
import { cn } from "@/lib/utils";

import { driveMinutes, preferWalking, walkMinutes } from "../domain/geo";

/** A charged amount, with the visitor's chosen display currency as an approximation next to it. */
export function Money({ amount, currency, className, testId }: { amount: number | null | undefined; currency: string; className?: string; testId?: string }) {
  const { currency: display } = useToursPrefs();
  return <Price amount={amount} currency={currency} displayCurrency={display} className={className} approxClassName="text-xs font-normal text-slate-500" testId={testId} />;
}

/** Formats an ISO date in the visitor's calendar (Persian / Gregorian / Hijri). */
export function useStayDate() {
  const locale = useLocale();
  const { calendar } = useToursPrefs();
  return (iso: string | null | undefined, style: "full" | "long" | "medium" | "short" = "medium") =>
    iso ? formatIsoDate(iso, { locale: intlLocale(locale), calendar, style }) : "";
}

/** Short "Mon 20 Aban" style for compact date chips. */
export function useShortDate() {
  const locale = useLocale();
  const { calendar } = useToursPrefs();
  return (iso: string) =>
    new Intl.DateTimeFormat(intlLocale(locale), { calendar, weekday: "short", day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(`${iso}T12:00:00Z`));
}

/** "14:00" in the UI language's digits and clock style. */
export function useClock() {
  const locale = useLocale();
  return (hhmm: string) => formatClock(hhmm.slice(0, 5), locale);
}

export function useNumber() {
  const locale = useLocale();
  return (v: number, opts?: Intl.NumberFormatOptions) => formatNumber(v, locale, opts);
}

export function StarRating({ count, className }: { count: number | null; className?: string }) {
  const t = useTranslations("StayApp.card");
  if (!count) return null;
  return (
    <span className={cn("inline-flex items-center gap-0.5 text-amber-500", className)} role="img" aria-label={t("stars", { count })} data-testid="star-rating">
      {Array.from({ length: count }, (_, i) => (
        <Star key={i} className="size-3.5 fill-current" aria-hidden="true" />
      ))}
    </span>
  );
}

export function RatingBadge({ value, count, className }: { value: number | null; count: number; className?: string }) {
  const t = useTranslations("StayApp.card");
  const num = useNumber();
  if (value == null || count === 0) {
    return <span className={cn("text-xs text-slate-500", className)}>{t("reviews", { count: 0 })}</span>;
  }
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-sm", className)} data-testid="rating-badge">
      <span className="inline-flex items-center gap-0.5 rounded-md bg-emerald-700 px-1.5 py-0.5 text-xs font-bold text-white" aria-label={t("rating", { value: num(value, { maximumFractionDigits: 1 }) })}>
        <Star className="size-3 fill-current" aria-hidden="true" />
        {num(value, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
      </span>
      <span className="text-xs text-slate-600">{t("reviews", { count })}</span>
    </span>
  );
}

/**
 * "650 m · about 8 min walk" / "4.2 km · about 14 min by car". Distances are
 * straight-line, times are estimates (domain/geo.ts) and always say "about".
 */
export function useDistance() {
  const t = useTranslations("StayApp.distance");
  const num = useNumber();
  const length = (m: number) => (m < 1000 ? t("meters", { distance: Math.round(m / 10) * 10 }) : t("km", { distance: num(m / 1000, { maximumFractionDigits: 1 }) }));
  const travel = (m: number) => (preferWalking(m) ? t("walk", { minutes: walkMinutes(m) }) : t("drive", { minutes: driveMinutes(m) }));
  return { length, travel };
}

/** Cover image with a meaningful fallback (never a broken image icon). */
export function StayImage({
  src,
  alt,
  className,
  priority,
  fit = "cover",
  sizes = "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw",
}: {
  src: string | null | undefined;
  alt: string;
  /** Sizes the box (width/height/aspect, rounding); the photo fills it. */
  className?: string;
  priority?: boolean;
  fit?: "cover" | "contain";
  sizes?: string;
}) {
  const t = useTranslations("StayApp.card");
  if (!src) {
    return (
      <div className={cn("flex items-center justify-center bg-gradient-to-br from-emerald-50 to-amber-50 text-xs text-slate-500", className)} role="img" aria-label={alt}>
        {t("noPhoto")}
      </div>
    );
  }
  const url = resolveMediaUrl(src);
  const objectFit = fit === "contain" ? "object-contain" : "object-cover";
  // Our own images (/images/…) and the Lsevin files host are resized and served as AVIF/WebP
  // by next/image (next.config images.remotePatterns); any other address is shown as is.
  if (!isOptimizable(url)) {
    return (
      <span className={cn("relative block overflow-hidden bg-slate-100", className)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt={alt} loading={priority ? "eager" : "lazy"} fetchPriority={priority ? "high" : "auto"} decoding="async" className={cn("absolute inset-0 h-full w-full", objectFit)} />
      </span>
    );
  }
  return (
    <span className={cn("relative block overflow-hidden bg-slate-100", className)}>
      <Image src={url} alt={alt} fill sizes={sizes} priority={priority} fetchPriority={priority ? "high" : undefined} quality={70} className={objectFit} />
    </span>
  );
}

const FILES_BASE = (process.env.NEXT_PUBLIC_FILES_URL ?? "").replace(/\/+$/, "");

function isOptimizable(url: string): boolean {
  if (url.startsWith("/") && !url.startsWith("//")) return true;
  if (!FILES_BASE || !url.startsWith(`${FILES_BASE}/`)) return false;
  try {
    return new URL(url).pathname.startsWith("/files/");
  } catch {
    return false;
  }
}

/**
 * Instant feedback for a tapped link while the next page renders on the server. Must be
 * rendered inside the <Link>. `overlay` covers the nearest positioned ancestor (a card).
 */
export function LinkPending({ overlay = false, className }: { overlay?: boolean; className?: string }) {
  const { pending } = useLinkStatus();
  if (!pending) return null;
  if (overlay) {
    return (
      <span className={cn("pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-white/50", className)} role="status" data-testid="link-pending">
        <span className="flex size-10 items-center justify-center rounded-full bg-white shadow-md">
          <Loader2 className="size-5 animate-spin text-emerald-700" aria-hidden="true" />
        </span>
      </span>
    );
  }
  return <Loader2 className={cn("size-4 animate-spin", className)} role="status" aria-hidden="true" data-testid="link-pending" />;
}

export { Bdi };
