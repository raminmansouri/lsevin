"use client";

import { Clock, Images, MapPin, Star, Tag, Zap } from "lucide-react";
import type { ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

import type { TourCard as TourCardData } from "../../server/platform/catalog";
import { formatNumber } from "../shared/format";
import { FallbackBadge, LocalizedText } from "../shared/localized-text";

import { FromPrice, TourImage } from "./common";
import { WishlistButton } from "./wishlist-button";

export function durationLabel(t: (key: string, values?: Record<string, number>) => string, card: { durationDays: number; durationMinutes: number | null }) {
  if (card.durationDays <= 1 && card.durationMinutes) {
    const hours = Math.max(1, Math.round(card.durationMinutes / 60));
    return t("hours", { count: hours });
  }
  return t("days", { count: card.durationDays });
}

/**
 * Tour card used on Home, Explore, Wishlist and Related (recent_visits.png):
 * image with photo count and wishlist heart, title, destination, rating only
 * when verified reviews exist, data-backed badges, and "from … per person".
 */
export function TourCard({
  card,
  saved,
  layout = "vertical",
  className,
  distanceKm,
  testId = "tour-card",
  rank,
  stat,
  categoryLabel,
  eager = false,
}: {
  card: TourCardData;
  saved?: boolean;
  layout?: "vertical" | "wide";
  className?: string;
  distanceKm?: number | null;
  testId?: string;
  /** Position in a ranking (1 = top), shown as a numbered seal on the photo. */
  rank?: number;
  /** A ranking figure (e.g. "1,240 views") shown on the photo in place of the photo count. */
  stat?: ReactNode;
  /** Category name, shown with the duration. */
  categoryLabel?: string | null;
  /** First card(s) of a list that opens on screen: its photo is the page's LCP. */
  eager?: boolean;
}) {
  const t = useTranslations("TourApp");
  const locale = useLocale();
  const title = card.title?.value ?? card.slug;
  const unavailable = card.availability !== "available";

  return (
    <article
      data-testid={testId}
      data-tour-slug={card.slug}
      data-availability={card.availability}
      className={cn(
        "group relative flex overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md focus-within:ring-2 focus-within:ring-emerald-600",
        layout === "wide" ? "flex-row" : "flex-col",
        className,
      )}
    >
      <div className={cn("relative shrink-0", layout === "wide" ? "w-36 sm:w-44" : "aspect-[4/3] w-full")}>
        <TourImage
          src={card.coverUrl}
          alt={card.coverAlt ?? title}
          className="h-full w-full"
          eager={eager}
          sizes={layout === "wide" ? "176px" : "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"}
        />
        <div className="absolute inset-x-2 top-2 flex items-start justify-between gap-2">
          <div className="flex flex-wrap gap-1">
            {card.badges.map((b) => (
              <span
                key={b}
                data-testid={`badge-${b}`}
                className={cn(
                  "rounded-full px-2 py-0.5 text-[11px] font-semibold shadow-sm",
                  b === "discount" ? "bg-orange-500 text-white" : b === "sponsored" ? "bg-slate-800/80 text-white" : "bg-white/90 text-emerald-800",
                )}
              >
                {t(`card.badge.${b}`)}
              </span>
            ))}
          </div>
          <WishlistButton tourId={card.id} initialSaved={saved} title={title} className="relative z-10" />
        </div>
        {rank != null ? (
          <span
            data-testid="card-rank"
            aria-label={t("home.rankings.rank", { rank })}
            className="pointer-events-none absolute -bottom-4 end-3 z-10 flex size-9 items-center justify-center rounded-full bg-emerald-800 text-sm font-black text-white shadow-md ring-2 ring-white"
          >
            {formatNumber(rank, locale)}
          </span>
        ) : null}
        {stat != null ? (
          <span data-testid="card-stat" className="absolute bottom-2 start-2 inline-flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-[11px] font-semibold text-white">
            {stat}
          </span>
        ) : card.imageCount > 1 ? (
          <span className="absolute bottom-2 start-2 inline-flex items-center gap-1 rounded-full bg-black/55 px-2 py-0.5 text-[11px] font-medium text-white">
            <Images className="size-3" aria-hidden="true" />
            {t("card.photos", { count: card.imageCount })}
          </span>
        ) : null}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1.5 p-3">
        <h3 className={cn("line-clamp-2 text-[15px] font-bold leading-6 text-slate-900", rank != null && "pe-9")}>
          <Link
            href={`/tours/${card.slug}`}
            className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none"
            data-testid="tour-card-link"
          >
            <LocalizedText text={card.title} badge={false} />
          </Link>
        </h3>
        {card.title?.isFallback ? <FallbackBadge locale={card.title.locale} className="relative z-10 self-start" /> : null}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600">
          {card.destination?.name ? (
            <span className="inline-flex items-center gap-1">
              <MapPin className="size-3.5" aria-hidden="true" />
              <LocalizedText text={card.destination.name} badge={false} />
            </span>
          ) : null}
          {categoryLabel ? (
            <span className="inline-flex items-center gap-1" data-testid="card-category">
              <Tag className="size-3.5" aria-hidden="true" />
              {categoryLabel}
            </span>
          ) : null}
          <span className="inline-flex items-center gap-1">
            <Clock className="size-3.5" aria-hidden="true" />
            {durationLabel((k, v) => t(`card.${k}`, v), card)}
          </span>
          {distanceKm != null ? <span>{t("explore.distance", { km: formatNumber(Math.round(distanceKm), locale) })}</span> : null}
        </div>
        {card.ratingAvg != null && card.reviewCount > 0 ? (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-700" data-testid="card-rating">
            <Star className="size-3.5 fill-amber-400 text-amber-400" aria-hidden="true" />
            {t("card.rating", { rating: formatNumber(card.ratingAvg, locale, { maximumFractionDigits: 1 }), count: card.reviewCount })}
          </span>
        ) : null}
        <div className="mt-auto space-y-1 pt-1">
          {card.availability === "available" && card.nextDeparture ? (
            card.nextDeparture.remaining <= 5 ? (
              <p className="text-xs font-semibold text-orange-600">{t("card.seatsLeft", { count: card.nextDeparture.remaining })}</p>
            ) : null
          ) : (
            <p className="text-xs font-medium text-slate-500" data-testid="card-unavailable">
              {card.availability === "sold_out" ? t("card.soldOut") : card.availability === "no_departures" ? t("card.noDepartures") : t("card.unavailable")}
            </p>
          )}
          <FromPrice amount={card.fromPrice} currency={card.currency} basis={card.fromPriceBasis} regular={card.badges.includes("discount") ? card.regularFromPrice : null} className={cn(unavailable && "opacity-70")} />
          {card.instantConfirmation ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700">
              <Zap className="size-3" aria-hidden="true" />
              {t("card.instant")}
            </span>
          ) : null}
        </div>
      </div>
    </article>
  );
}
