"use client";

import { useState, useTransition } from "react";
import { Accessibility, BadgeCheck, Heart, HeartPulse, MapPin, Zap } from "lucide-react";
import { useTranslations } from "next-intl";

import { useToursPrefs } from "@/features/tours/ui/customer/prefs-context";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

import { toggleStayWishlistAction } from "../server/actions/customer";
import type { PropertyCard as Card } from "../types";

import { Money, RatingBadge, StarRating, StayImage } from "./common";

export function WishlistButton({ propertyId, initialSaved, className }: { propertyId: string; initialSaved: boolean; className?: string }) {
  const t = useTranslations("StayApp.card");
  const { signedIn } = useToursPrefs();
  const pathname = usePathname();
  const [saved, setSaved] = useState(initialSaved);
  const [pending, start] = useTransition();
  if (!signedIn) {
    return (
      <Link
        href={`/sign-in?redirectTo=${encodeURIComponent(pathname)}`}
        aria-label={t("saveSignIn")}
        className={cn("flex size-10 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow hover:bg-white focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:outline-none", className)}
      >
        <Heart className="size-5" aria-hidden="true" />
      </Link>
    );
  }
  return (
    <button
      type="button"
      aria-pressed={saved}
      aria-label={saved ? t("saved") : t("save")}
      disabled={pending}
      data-testid="stay-wishlist-toggle"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        const next = !saved;
        setSaved(next);
        start(async () => {
          const r = await toggleStayWishlistAction({ propertyId, saved: next }).catch(() => null);
          if (!r?.ok) setSaved(!next);
        });
      }}
      className={cn(
        "flex size-10 items-center justify-center rounded-full bg-white/90 shadow hover:bg-white focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:outline-none",
        saved ? "text-rose-600" : "text-slate-700",
        className,
      )}
    >
      <Heart className={cn("size-5", saved && "fill-current")} aria-hidden="true" />
    </button>
  );
}

/**
 * One stay in a list (H02/H03). With dates: the complete total for the stay
 * (all nights, rooms, taxes, fees). Without dates: "from … per night", never
 * presented as a quote. Low-stock text only appears when it is real (≤ 3 left).
 */
export function PropertyCardView({
  card,
  saved,
  query,
  priority,
  headingLevel = 3,
}: {
  card: Card;
  saved: boolean;
  query?: string;
  priority?: boolean;
  headingLevel?: 2 | 3;
}) {
  const t = useTranslations("StayApp.card");
  const tKinds = useTranslations("StayApp.kinds");
  const H = headingLevel === 2 ? "h2" : "h3";
  const href = `/stays/${card.slug}${query ? `?${query}` : ""}`;
  const unavailable = card.available === false;
  return (
    <article className={cn("group relative flex flex-col overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200 transition hover:shadow-md", unavailable && "opacity-80")} data-testid="stay-card" data-slug={card.slug}>
      <div className="relative aspect-[4/3]">
        <StayImage src={card.coverUrl} alt={card.coverAlt} className="h-full w-full" priority={priority} />
        <WishlistButton propertyId={card.id} initialSaved={saved} className="absolute end-2 top-2 z-10" />
        {card.freeCancellation ? (
          <span className="absolute start-2 top-2 rounded-full bg-white/95 px-2 py-1 text-[11px] font-semibold text-emerald-800 shadow-sm">{t("freeCancellation")}</span>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-3">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span>{tKinds(card.kind)}</span>
          <StarRating count={card.starRating} />
        </div>
        <H className="text-base leading-6 font-bold text-slate-900">
          <Link href={href} className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-emerald-600 focus-visible:after:rounded-2xl" data-testid="stay-card-link">
            {card.name}
          </Link>
        </H>
        <p className="flex items-center gap-1 text-xs text-slate-600">
          <MapPin className="size-3.5" aria-hidden="true" />
          {card.city.name}
        </p>
        <RatingBadge value={card.ratingAvg} count={card.reviewCount} />
        <ul className="flex flex-wrap gap-1.5 text-[11px] text-slate-700">
          <li className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5">
            {card.instant ? <Zap className="size-3 text-amber-600" aria-hidden="true" /> : <BadgeCheck className="size-3 text-slate-500" aria-hidden="true" />}
            {card.instant ? t("instant") : t("request")}
          </li>
          {card.accessible ? (
            <li className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5">
              <Accessibility className="size-3" aria-hidden="true" />
              {t("accessible")}
            </li>
          ) : null}
          {card.medicalFriendly ? (
            <li className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5">
              <HeartPulse className="size-3 text-rose-600" aria-hidden="true" />
              {t("medical")}
            </li>
          ) : null}
        </ul>
        <div className="mt-auto pt-2" data-testid="stay-card-price">
          {unavailable ? (
            <p className="text-sm font-semibold text-red-700">{t("soldOut")}</p>
          ) : card.total != null && card.nights ? (
            <>
              <div className="flex flex-wrap items-baseline gap-x-1.5">
                <Money amount={card.total} currency={card.currency} className="text-lg font-extrabold text-slate-900" testId="stay-card-total" />
                <span className="text-xs text-slate-600">{t("total", { nights: card.nights })}</span>
              </div>
              <p className="text-[11px] text-slate-500">{t("taxesIncluded")}</p>
              {card.unitsLeft != null && card.unitsLeft > 0 && card.unitsLeft <= 3 ? (
                <p className="text-xs font-semibold text-orange-700">{t("unitsLeft", { count: card.unitsLeft })}</p>
              ) : null}
            </>
          ) : card.fromNightly != null ? (
            <div className="flex flex-wrap items-baseline gap-x-1.5">
              <span className="text-xs text-slate-600">{t("from")}</span>
              <Money amount={card.fromNightly} currency={card.currency} className="text-lg font-extrabold text-slate-900" testId="stay-card-from" />
              <span className="text-xs text-slate-600">{t("perNight")}</span>
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}
