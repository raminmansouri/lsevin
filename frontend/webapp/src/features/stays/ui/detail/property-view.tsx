"use client";

import { useEffect, useState } from "react";
import {
  Accessibility,
  BadgeCheck,
  BedDouble,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Coffee,
  HeartPulse,
  Images,
  MapPin,
  Maximize2,
  Share2,
  ShieldCheck,
  Users,
  X,
  Zap,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { directionOf } from "@/features/tours/domain/content";
import { LocalizedText } from "@/features/tours/ui/shared/localized-text";
import { TourMap } from "@/features/tours/ui/shared/tour-map";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

import { checkInInstant, freeCancellationUntil } from "../../domain/cancellation";
import type { StaySearch } from "../../domain/search";
import { recordStayViewAction } from "../../server/actions/customer";
import type { MediaItem, PropertyDetail, ReviewItem, RoomOffer } from "../../types";
import { Money, RatingBadge, StarRating, StayImage, useNumber, useStayDate } from "../common";
import { WishlistButton } from "../property-card";
import { StaySearchForm, type CityOption } from "../search/search-form";

export function PropertyView({
  property,
  rooms,
  reviews,
  search,
  dateError,
  saved,
  cities,
  preview = false,
}: {
  property: PropertyDetail;
  rooms: RoomOffer[];
  reviews: ReviewItem[];
  search: StaySearch;
  dateError: string | null;
  saved: boolean;
  cities: CityOption[];
  preview?: boolean;
}) {
  const t = useTranslations("StayApp.detail");
  const tKinds = useTranslations("StayApp.kinds");
  const tSearch = useTranslations("StayApp.search");
  const tNav = useTranslations("StayApp.nav");
  const tCardT = useTranslations("StayApp.card");
  const name = property.name?.value ?? property.slug;
  const hasDates = Boolean(search.checkIn && search.checkOut) && !dateError;

  useEffect(() => {
    if (!preview) void recordStayViewAction({ propertyId: property.id }).catch(() => undefined);
  }, [property.id, preview]);

  const cheapest = rooms
    .flatMap((r) => r.plans)
    .filter((p) => p.quote && !p.unavailableReason)
    .sort((a, b) => a.quote!.total - b.quote!.total)[0];

  return (
    <div className="pb-24 md:pb-6" data-testid="stay-detail">
      <nav aria-label={t("breadcrumbs")} className="px-4 pt-3 text-xs text-slate-500 sm:px-6" data-testid="stay-breadcrumbs">
        <ol className="flex flex-wrap items-center gap-1">
          <li>
            <Link href="/stays" className="hover:underline">
              {tNav("stays")}
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link href={`/stays/city/${property.city.slug}`} className="hover:underline">
              {property.city.name}
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="truncate text-slate-700">
            {name}
          </li>
        </ol>
      </nav>
      <Gallery media={property.media.filter((m) => !m.roomTypeId)} title={name} saved={saved} propertyId={property.id} />

      <div className="grid gap-8 px-4 pt-4 sm:px-6 lg:grid-cols-[1fr_340px]">
        <div className="min-w-0 space-y-8">
          <header>
            <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-800">{tKinds(property.kind)}</span>
              <StarRating count={property.starRating} />
              <RatingBadge value={property.ratingAvg} count={property.reviewCount} />
            </div>
            <h1 className="mt-2 text-2xl leading-tight font-extrabold text-slate-900 md:text-3xl" data-testid="stay-title">
              {name}
            </h1>
            <p className="mt-1 flex items-center gap-1 text-sm text-slate-600">
              <MapPin className="size-4" aria-hidden="true" />
              <Link href={`/stays/city/${property.city.slug}`} className="hover:underline">
                {property.city.name}
              </Link>
              {property.address && property.location && !property.location.approximate ? <span>· {property.address.value}</span> : null}
            </p>
            {property.summary ? <LocalizedText text={{ ...property.summary, dir: directionOf(property.summary.locale) }} className="mt-3 text-base leading-7 text-slate-700" /> : null}
            <ul className="mt-4 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
              <Fact icon={Clock} label={t("checkIn")} value={t("checkInFrom", { time: property.checkInTime })} />
              <Fact icon={Clock} label={t("checkOut")} value={t("checkOutUntil", { time: property.checkOutTime })} />
              <Fact icon={property.confirmationMode === "instant" ? Zap : BadgeCheck} label={t("confirmation")} value={property.confirmationMode === "instant" ? tCard("instant") : tCard("request")} />
              {property.medicalFriendly ? <Fact icon={HeartPulse} label={t("accessibility")} value={t("medicalFriendly")} /> : null}
            </ul>
          </header>

          <section id="rooms" aria-labelledby="stay-rooms-title" className="scroll-mt-20">
            <h2 id="stay-rooms-title" className="text-xl font-bold">
              {t("rooms")}
            </h2>
            <div className="mt-3 rounded-2xl bg-white p-3 ring-1 ring-slate-200" data-testid="stay-detail-search">
              <StaySearchForm cities={cities} initial={search} variant="compact" target={{ path: `/stays/p/${property.slug}` }} />
            </div>
            {dateError ? (
              <p role="alert" className="mt-2 text-sm font-medium text-red-700" data-testid="stay-detail-date-error">
                {tSearch(`errors.${dateError}` as "errors.too_many_nights", { max: 30 })}
              </p>
            ) : null}
            {!hasDates ? (
              <div className="mt-3 rounded-2xl bg-amber-50 p-4 text-sm text-amber-900 ring-1 ring-amber-200" data-testid="stay-detail-no-dates">
                <p className="font-semibold">{t("selectDatesTitle")}</p>
                <p className="mt-0.5">{t("selectDatesText")}</p>
              </div>
            ) : null}
            {rooms.length === 0 ? (
              <p className="mt-4 text-sm text-slate-600">{t("noRooms")}</p>
            ) : hasDates && !cheapest ? (
              <p className="mt-4 rounded-2xl bg-white p-4 text-sm font-medium text-slate-700 ring-1 ring-slate-200" data-testid="stay-detail-none-available">
                {t("roomsAvailableNone")}
              </p>
            ) : null}
            <ul className="mt-4 space-y-4" data-testid="stay-rooms">
              {rooms.map((room) => (
                <RoomCard key={room.roomTypeId} room={room} property={property} search={search} hasDates={hasDates} preview={preview} />
              ))}
            </ul>
          </section>

          {property.description ? (
            <section aria-labelledby="stay-about">
              <h2 id="stay-about" className="text-xl font-bold">
                {t("about")}
              </h2>
              <LocalizedText text={{ ...property.description, dir: directionOf(property.description.locale) }} className="mt-2 text-sm leading-7 text-slate-700" />
            </section>
          ) : null}

          {property.amenities.length ? (
            <section aria-labelledby="stay-amenities">
              <h2 id="stay-amenities" className="text-xl font-bold">
                {t("amenities")}
              </h2>
              <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3" data-testid="stay-amenities">
                {property.amenities.map((a) => (
                  <li key={a.code} className="flex items-center gap-2 text-sm text-slate-700">
                    <Check className="size-4 text-emerald-700" aria-hidden="true" />
                    {a.label}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section aria-labelledby="stay-location">
            <h2 id="stay-location" className="text-xl font-bold">
              {t("location")}
            </h2>
            {property.location ? (
              <div className="mt-3">
                <TourMap
                  points={[{ id: property.id, lat: property.location.latitude, lng: property.location.longitude, label: name, kind: "destination", exact: !property.location.approximate, radiusM: property.location.radiusM || undefined }]}
                  labels={{ region: t("map"), unavailable: t("map"), approximate: t("approximateLocation") }}
                  height={260}
                />
                {property.location.approximate ? <p className="mt-2 text-xs text-slate-600">{t("approximateLocation")}</p> : null}
              </div>
            ) : (
              <p className="mt-2 text-sm text-slate-600">{t("approximateLocation")}</p>
            )}
            {property.nearby.length ? (
              <div className="mt-4">
                <h3 className="font-semibold">{t("nearby")}</h3>
                <ul className="mt-2 divide-y divide-slate-100 rounded-2xl bg-white ring-1 ring-slate-200" data-testid="stay-nearby">
                  {property.nearby.map((n, i) => (
                    <li key={i} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
                      <span>
                        <span className="text-xs text-slate-500">{t(`nearbyKinds.${n.kind}` as never)} · </span>
                        {n.name}
                      </span>
                      <Distance meters={n.distanceM} />
                    </li>
                  ))}
                </ul>
                <p className="mt-1 text-xs text-slate-500">{t("medicalNote")}</p>
              </div>
            ) : null}
          </section>

          <Policies property={property} />

          <Reviews property={property} reviews={reviews} />
        </div>

        <aside className="hidden lg:block">
          <div className="sticky top-20 space-y-3 rounded-2xl bg-white p-4 ring-1 ring-slate-200">
            {cheapest?.quote ? (
              <>
                <p className="text-xs text-slate-600">{tRoom("totalFor", { nights: cheapest.quote.nights })}</p>
                <Money amount={cheapest.quote.total} currency={property.currency} className="text-2xl font-extrabold" />
              </>
            ) : property.fromNightly != null ? (
              <p className="flex flex-wrap items-baseline gap-1.5">
                <span className="text-xs text-slate-600">{t("fromPrice")}</span>
                <Money amount={property.fromNightly} currency={property.currency} className="text-2xl font-extrabold" />
                <span className="text-xs text-slate-600">{t("perNight")}</span>
              </p>
            ) : null}
            <a href="#rooms" className="flex min-h-12 items-center justify-center rounded-full bg-orange-500 text-base font-bold text-white hover:bg-orange-600">
              {hasDates ? t("chooseRoom") : t("selectDates")}
            </a>
            {property.provider.name ? <p className="text-xs text-slate-500">{t("provider", { name: property.provider.name })}</p> : null}
          </div>
        </aside>
      </div>

      <div className="fixed inset-x-0 bottom-[calc(3.5rem+env(safe-area-inset-bottom))] z-30 border-t border-slate-200 bg-white/95 px-4 py-2 backdrop-blur md:bottom-0 lg:hidden" data-testid="stay-sticky-bar">
        <div className="mx-auto flex max-w-xl items-center justify-between gap-3">
          <div className="min-w-0">
            {cheapest?.quote ? (
              <>
                <Money amount={cheapest.quote.total} currency={property.currency} className="text-lg font-extrabold" />
                <p className="text-[11px] text-slate-600">{tRoom("totalFor", { nights: cheapest.quote.nights })}</p>
              </>
            ) : property.fromNightly != null ? (
              <p className="flex flex-wrap items-baseline gap-1">
                <span className="text-xs text-slate-600">{t("fromPrice")}</span>
                <Money amount={property.fromNightly} currency={property.currency} className="text-lg font-extrabold" />
                <span className="text-[11px] text-slate-600">{t("perNight")}</span>
              </p>
            ) : null}
          </div>
          <a href="#rooms" className="inline-flex min-h-11 shrink-0 items-center rounded-full bg-orange-500 px-5 text-sm font-bold text-white" data-testid="stay-sticky-cta">
            {hasDates ? t("chooseRoom") : t("selectDates")}
          </a>
        </div>
      </div>
    </div>
  );

  function tCard(key: "instant" | "request") {
    return tCardT(key);
  }
  function tRoom(key: "totalFor", values: { nights: number }) {
    return t(`room.${key}`, values);
  }
}

function Fact({ icon: Icon, label, value }: { icon: typeof Clock; label: string; value: string }) {
  return (
    <li className="rounded-2xl bg-white p-3 ring-1 ring-slate-200">
      <Icon className="size-4 text-emerald-700" aria-hidden="true" />
      <p className="mt-1 text-xs text-slate-500">{label}</p>
      <p className="text-sm font-semibold text-slate-900">{value}</p>
    </li>
  );
}

function Distance({ meters }: { meters: number }) {
  const t = useTranslations("StayApp.detail");
  const num = useNumber();
  return <span className="shrink-0 text-xs text-slate-600">{meters < 1000 ? t("distance", { distance: meters }) : t("distanceKm", { distance: num(meters / 1000, { maximumFractionDigits: 1 }) })}</span>;
}

function Gallery({ media, title, saved, propertyId }: { media: MediaItem[]; title: string; saved: boolean; propertyId: string }) {
  const t = useTranslations("StayApp.detail");
  const locale = useLocale();
  const [open, setOpen] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const rtl = directionOf(locale) === "rtl";
  const Prev = rtl ? ChevronRight : ChevronLeft;
  const Next = rtl ? ChevronLeft : ChevronRight;
  const share = async () => {
    const url = window.location.href.split("?")[0];
    try {
      if (navigator.share) await navigator.share({ title, url });
      else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      /* user cancelled */
    }
  };
  return (
    <div className="relative px-0 sm:px-6 sm:pt-4" data-testid="stay-gallery">
      <div className="grid gap-1 overflow-hidden sm:grid-cols-4 sm:grid-rows-2 sm:rounded-3xl">
        {(media.length ? media.slice(0, 5) : [null]).map((m, i) => (
          <button
            key={m?.id ?? "empty"}
            type="button"
            disabled={!m}
            onClick={() => setOpen(i)}
            className={cn("relative block overflow-hidden focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:outline-none", i === 0 ? "aspect-[4/3] sm:col-span-2 sm:row-span-2 sm:aspect-auto" : "hidden aspect-[4/3] sm:block")}
            aria-label={t("gallery", { n: i + 1, count: media.length })}
          >
            <StayImage src={m?.url} alt={m?.alt ?? title} className="h-full w-full" priority={i === 0} sizes={i === 0 ? "(min-width: 640px) 50vw, 100vw" : "25vw"} />
          </button>
        ))}
      </div>
      <div className="absolute end-3 top-3 flex gap-2 sm:end-9 sm:top-7">
        <button type="button" onClick={share} aria-label={t("share")} className="flex size-10 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow hover:bg-white">
          {copied ? <Check className="size-5 text-emerald-700" aria-hidden="true" /> : <Share2 className="size-5" aria-hidden="true" />}
        </button>
        <WishlistButton propertyId={propertyId} initialSaved={saved} />
      </div>
      {copied ? (
        <span role="status" className="sr-only">
          {t("copied")}
        </span>
      ) : null}
      {media.length > 1 ? (
        <button type="button" onClick={() => setOpen(0)} className="absolute end-3 bottom-3 inline-flex min-h-9 items-center gap-1.5 rounded-full bg-white/95 px-3 text-xs font-semibold shadow sm:end-9" data-testid="stay-gallery-all">
          <Images className="size-4" aria-hidden="true" />
          {t("showAllPhotos", { count: media.length })}
        </button>
      ) : null}
      <Dialog open={open != null} onOpenChange={(v) => !v && setOpen(null)}>
        <DialogContent className="max-w-4xl bg-black p-0 text-white sm:rounded-2xl" data-testid="stay-lightbox">
          <DialogTitle className="sr-only">{title}</DialogTitle>
          <DialogDescription className="sr-only">{open != null ? t("gallery", { n: open + 1, count: media.length }) : ""}</DialogDescription>
          {open != null && media[open] ? (
            <figure
              className="relative"
              onKeyDown={(e) => {
                if (e.key === "ArrowRight") setOpen((o) => (o == null ? o : rtl ? Math.max(0, o - 1) : Math.min(media.length - 1, o + 1)));
                if (e.key === "ArrowLeft") setOpen((o) => (o == null ? o : rtl ? Math.min(media.length - 1, o + 1) : Math.max(0, o - 1)));
              }}
            >
              <StayImage src={media[open].url} alt={media[open].alt} className="max-h-[80dvh] w-full object-contain" sizes="100vw" priority />
              <figcaption className="flex items-center justify-between gap-2 p-3 text-xs text-white/80">
                <span>{t("gallery", { n: open + 1, count: media.length })}</span>
                {media[open].credit ? <span>{media[open].credit}</span> : null}
              </figcaption>
              <button type="button" aria-label={t("prevPhoto")} disabled={open === 0} onClick={() => setOpen(open - 1)} className="absolute start-2 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 disabled:opacity-30">
                <Prev className="size-6" aria-hidden="true" />
              </button>
              <button type="button" aria-label={t("nextPhoto")} disabled={open >= media.length - 1} onClick={() => setOpen(open + 1)} className="absolute end-2 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 disabled:opacity-30">
                <Next className="size-6" aria-hidden="true" />
              </button>
              <button type="button" aria-label={t("closeGallery")} onClick={() => setOpen(null)} className="absolute end-2 top-2 flex size-10 items-center justify-center rounded-full bg-black/50">
                <X className="size-5" aria-hidden="true" />
              </button>
            </figure>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function RoomCard({ room, property, search, hasDates, preview }: { room: RoomOffer; property: PropertyDetail; search: StaySearch; hasDates: boolean; preview: boolean }) {
  const t = useTranslations("StayApp.detail.room");
  const tDetail = useTranslations("StayApp.detail");
  const tBeds = useTranslations("StayApp.beds");
  const tMeals = useTranslations("StayApp.meals");
  const fmtDate = useStayDate();
  const cover = room.media[0];
  return (
    <li className="overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200" data-testid="stay-room" data-room-code={room.code}>
      <div className="grid gap-0 sm:grid-cols-[220px_1fr]">
        <StayImage src={cover?.url ?? property.media[0]?.url} alt={cover?.alt ?? room.name} className="aspect-[4/3] h-full w-full sm:aspect-auto" sizes="(min-width: 640px) 220px, 100vw" />
        <div className="p-4">
          <h3 className="text-lg font-bold">{room.name}</h3>
          <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
            <li className="inline-flex items-center gap-1">
              <Users className="size-3.5" aria-hidden="true" />
              {t("sleeps", { count: room.maxOccupancy })}
            </li>
            {room.beds.map((b, i) => (
              <li key={i} className="inline-flex items-center gap-1">
                <BedDouble className="size-3.5" aria-hidden="true" />
                {tBeds(b.type as "double", { count: b.count })}
              </li>
            ))}
            {room.sizeM2 ? (
              <li className="inline-flex items-center gap-1">
                <Maximize2 className="size-3.5" aria-hidden="true" />
                {t("size", { size: room.sizeM2 })}
              </li>
            ) : null}
            {room.bedrooms ? <li>{t("bedrooms", { count: room.bedrooms })}</li> : null}
            {room.bathrooms ? <li>{t("bathrooms", { count: room.bathrooms })}</li> : null}
          </ul>
          {!room.fitsParty ? <p className="mt-2 text-xs font-semibold text-amber-800">{t("doesNotFit")}</p> : null}
          {hasDates && room.unitsLeft != null && room.unitsLeft > 0 && room.unitsLeft <= 3 ? (
            <p className="mt-2 text-xs font-semibold text-orange-700" data-testid="stay-room-units-left">
              {t("unitsLeft", { count: room.unitsLeft })}
            </p>
          ) : null}
          <ul className="mt-3 divide-y divide-slate-100 rounded-xl ring-1 ring-slate-200">
            {room.plans.map((plan) => {
              const freeUntil =
                hasDates && property.policy && search.checkIn
                  ? freeCancellationUntil(property.policy.rules, plan.refundable, checkInInstant(search.checkIn, property.checkInTime, property.timezone))
                  : null;
              const bookHref = `/stays/p/${property.slug}/book?${new URLSearchParams({
                room: room.roomTypeId,
                plan: plan.ratePlanId,
                in: search.checkIn ?? "",
                out: search.checkOut ?? "",
                adults: String(search.adults),
                rooms: String(search.rooms),
                ...(search.childAges.length ? { ages: search.childAges.join(",") } : {}),
              }).toString()}`;
              return (
                <li key={plan.ratePlanId} className="flex flex-wrap items-center justify-between gap-3 p-3" data-testid="stay-rate-plan" data-plan-code={plan.code}>
                  <div className="min-w-0 space-y-1 text-sm">
                    {plan.name ? <p className="font-semibold">{plan.name}</p> : null}
                    <p className="inline-flex items-center gap-1 text-slate-700">
                      <Coffee className="size-4 text-slate-500" aria-hidden="true" />
                      {tMeals(plan.mealPlan)}
                    </p>
                    <p className={cn("inline-flex items-center gap-1 text-xs", plan.refundable ? "text-emerald-800" : "text-slate-600")}>
                      <ShieldCheck className="size-4" aria-hidden="true" />
                      {plan.refundable ? (freeUntil ? t("freeCancelUntil", { date: fmtDate(freeUntil.toISOString().slice(0, 10)) }) : t("refundable")) : t("nonRefundable")}
                    </p>
                    {plan.longStay ? <p className="text-xs text-emerald-800">{t("longStay", { percent: plan.longStay.percent, nights: plan.longStay.nights })}</p> : null}
                    {plan.minNights > 1 ? <p className="text-xs text-slate-500">{t("minNights", { count: plan.minNights })}</p> : null}
                  </div>
                  <div className="text-end">
                    {plan.quote ? (
                      <>
                        <Money amount={plan.quote.total} currency={plan.quote.currency} className="text-lg font-extrabold" testId="stay-plan-total" />
                        <p className="text-[11px] text-slate-600">{t("totalFor", { nights: plan.quote.nights })}</p>
                      </>
                    ) : (
                      <p className="flex flex-wrap items-baseline justify-end gap-1 text-xs text-slate-600">
                        <span>{tDetail("fromPrice")}</span>
                        <Money amount={plan.nightlyFrom} currency={property.currency} className="text-base font-bold text-slate-900" />
                        <span>{tDetail("perNight")}</span>
                      </p>
                    )}
                    {hasDates && plan.unavailableReason ? (
                      <p className="mt-1 text-xs font-semibold text-red-700" data-testid="stay-plan-unavailable">
                        {t(`unavailable.${plan.unavailableReason}` as never)}
                      </p>
                    ) : hasDates && plan.quote && !preview ? (
                      <Link
                        href={bookHref}
                        className="mt-2 inline-flex min-h-11 items-center rounded-full bg-orange-500 px-5 text-sm font-bold text-white hover:bg-orange-600 focus-visible:ring-4 focus-visible:ring-orange-200 focus-visible:outline-none"
                        data-testid="stay-reserve"
                      >
                        {t("reserve")}
                      </Link>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </li>
  );

}

function Policies({ property }: { property: PropertyDetail }) {
  const t = useTranslations("StayApp.detail");
  const rules = property.rules;
  return (
    <section aria-labelledby="stay-policies" data-testid="stay-policies">
      <h2 id="stay-policies" className="text-xl font-bold">
        {t("policies")}
      </h2>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
          <h3 className="font-semibold">{t("cancellation")}</h3>
          {property.policy && property.policy.rules.length ? (
            <ul className="mt-2 space-y-1.5 text-sm text-slate-700" data-testid="stay-cancellation-rules">
              {property.policy.rules.map((r) => (
                <li key={r.hoursBefore}>{t("cancellationRule", { percent: r.refundPercent, hours: r.hoursBefore })}</li>
              ))}
              <li className="text-slate-500">{t("cancellationLate")}</li>
            </ul>
          ) : (
            <p className="mt-2 text-sm text-slate-700">{t("cancellationNone")}</p>
          )}
          {property.policy?.noShowRefundPercent ? <p className="mt-1 text-sm text-slate-700">{t("noShow", { percent: property.policy.noShowRefundPercent })}</p> : null}
          <p className="mt-2 text-xs text-slate-500">{t("nonRefundableNote")}</p>
          {property.policy?.text ? <LocalizedText text={{ ...property.policy.text, dir: directionOf(property.policy.text.locale) }} className="mt-2 text-sm text-slate-700" /> : null}
          <p className="mt-3 text-sm text-slate-700">
            {property.confirmationMode === "instant" ? t("instantText") : t("requestText", { hours: property.requestTimeoutHours })}
          </p>
        </div>
        <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
          <h3 className="font-semibold">{t("rules.title")}</h3>
          <ul className="mt-2 space-y-1.5 text-sm text-slate-700">
            <li>{t("checkIn")}: {t("checkInFrom", { time: property.checkInTime })}</li>
            <li>{t("checkOut")}: {t("checkOutUntil", { time: property.checkOutTime })}</li>
            <li>{rules.pets ? t("rules.pets") : t("rules.noPets")}</li>
            <li>{rules.smoking ? t("rules.smoking") : t("rules.noSmoking")}</li>
            <li>{rules.parties ? t("rules.parties") : t("rules.noParties")}</li>
            {rules.familiesOnly ? <li>{t("rules.familiesOnly")}</li> : null}
            {rules.idRequired ? <li>{t("rules.idRequired")}</li> : null}
            {rules.childFreeUnderAge > 0 ? <li>{t("rules.childrenFree", { age: rules.childFreeUnderAge })}</li> : null}
          </ul>
          {property.houseRules ? <LocalizedText text={{ ...property.houseRules, dir: directionOf(property.houseRules.locale) }} className="mt-2 text-sm text-slate-700" /> : null}
        </div>
        {property.accessibility.stepFree || property.accessibility.accessibleBathroom ? (
          <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200 md:col-span-2" data-testid="stay-accessibility">
            <h3 className="flex items-center gap-2 font-semibold">
              <Accessibility className="size-5 text-emerald-700" aria-hidden="true" />
              {t("accessibility")}
            </h3>
            <ul className="mt-2 space-y-1 text-sm text-slate-700">
              {property.accessibility.stepFree ? <li>{t("stepFree")}</li> : null}
              {property.accessibility.accessibleBathroom ? <li>{t("accessibleBathroom")}</li> : null}
            </ul>
            <p className={cn("mt-2 text-xs", property.accessibility.verified ? "text-emerald-800" : "text-amber-800")}>
              {property.accessibility.verified ? t("accessibilityVerified") : t("accessibilityUnverified")}
            </p>
          </div>
        ) : null}
      </div>
    </section>
  );
}

function Reviews({ property, reviews }: { property: PropertyDetail; reviews: ReviewItem[] }) {
  const t = useTranslations("StayApp.detail");
  const num = useNumber();
  const fmt = (v: number | null) => (v == null ? "—" : num(v, { minimumFractionDigits: 1, maximumFractionDigits: 1 }));
  return (
    <section aria-labelledby="stay-reviews" data-testid="stay-reviews">
      <h2 id="stay-reviews" className="text-xl font-bold">
        {t("reviews")}
      </h2>
      {property.reviewCount === 0 ? (
        <p className="mt-2 text-sm text-slate-600">{t("noReviews")}</p>
      ) : (
        <>
          <div className="mt-3 flex flex-wrap items-center gap-4">
            <RatingBadge value={property.ratingAvg} count={property.reviewCount} />
            <span className="text-sm text-slate-600">{t("reviewsSummary", { count: property.reviewCount })}</span>
          </div>
          <dl className="mt-3 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
            {(["cleanliness", "location", "staff", "value"] as const).map((k) => (
              <div key={k} className="rounded-xl bg-white p-3 ring-1 ring-slate-200">
                <dt className="text-xs text-slate-500">{t(`scores.${k}`)}</dt>
                <dd className="text-base font-bold">{fmt(property.ratingBreakdown[k])}</dd>
              </div>
            ))}
          </dl>
          <ul className="mt-4 space-y-3">
            {reviews.map((r) => (
              <li key={r.id} className="rounded-2xl bg-white p-4 ring-1 ring-slate-200" data-testid="stay-review">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold">{r.authorName ?? "—"}</span>
                  <span className="rounded-md bg-emerald-700 px-1.5 py-0.5 text-xs font-bold text-white">{num(r.rating)}</span>
                </div>
                {r.body ? (
                  <p className="mt-2 text-sm leading-6 whitespace-pre-line text-slate-700" dir="auto">
                    {r.body}
                  </p>
                ) : null}
                {r.providerReply ? (
                  <div className="mt-3 rounded-xl bg-slate-50 p-3 text-sm">
                    <p className="text-xs font-semibold text-slate-600">{t("providerReply")}</p>
                    <p className="mt-1 whitespace-pre-line text-slate-700" dir="auto">
                      {r.providerReply}
                    </p>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
