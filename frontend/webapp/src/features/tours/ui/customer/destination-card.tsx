"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

import { directionOf } from "../../domain/content";
import type { DestinationCard as DestinationData } from "../../server/platform/catalog";
import { LocalizedText } from "../shared/localized-text";

import { TourImage } from "./common";

/** Destination tile (2-landing_page_tours.png "Popular Destinations"). */
export function DestinationCard({ destination, className }: { destination: DestinationData; className?: string }) {
  const t = useTranslations("TourApp.destinations");
  const rtl = directionOf(useLocale()) === "rtl";
  const Chevron = rtl ? ChevronLeft : ChevronRight;
  const name = destination.name?.value ?? destination.slug;
  return (
    <Link
      href={`/tours/destinations/${destination.slug}`}
      data-testid="destination-card"
      className={cn(
        "group relative block aspect-[4/5] overflow-hidden rounded-2xl bg-slate-200 shadow-sm focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 focus-visible:outline-none",
        className,
      )}
    >
      <TourImage src={destination.coverUrl} alt={destination.coverAlt ?? name} className="absolute inset-0 h-full w-full" imgClassName="transition duration-500 group-hover:scale-105" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-3 text-white">
        <div className="min-w-0">
          <p className="truncate text-base font-bold">
            <LocalizedText text={destination.name} badge={false} />
          </p>
          {destination.region ? (
            <p className="truncate text-xs text-white/85">
              <LocalizedText text={destination.region} badge={false} />
            </p>
          ) : null}
          {destination.tourCount > 0 ? <p className="text-[11px] text-white/80">{t("tourCount", { count: destination.tourCount })}</p> : null}
        </div>
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white text-slate-900" aria-hidden="true">
          <Chevron className="size-4" />
        </span>
      </div>
    </Link>
  );
}
