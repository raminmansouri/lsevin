"use client";

import { useEffect, useState, useTransition } from "react";
import Image from "next/image";
import { BadgeCheck, ChevronLeft, Headphones, Heart, HeartPulse, History, Luggage, MapPin, MapPinned } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

import { LAST_EXPLORE_KEY, parseStaySearch, type PropertyKind, type StaySearch } from "../../domain/search";
import { clearStayRecentViewsAction } from "../../server/actions/customer";
import type { CitySummary, PropertyCard } from "../../types";
import { StayImage } from "../common";
import { PropertyCardView } from "../property-card";
import { StaySearchForm, type CityOption } from "../search/search-form";
import { DisplaySettings } from "../shell/stays-shell";

import { TYPE_CREDITS } from "./type-credits";
import { listSeparator } from "../../domain/locales";

/**
 * "Browse by type" photos: licensed Wikimedia Commons pictures of real Iranian stays where one
 * exists (credits in public/images/stays/CREDITS.json and under the grid), resized to 800×600
 * WebP and served through next/image at the tile's width.
 */
const TYPES: { kind: PropertyKind; image: string }[] = [
  { kind: "hotel", image: "/images/stays/type-hotel.webp" },
  { kind: "traditional", image: "/images/stays/type-traditional.webp" },
  { kind: "hotel_apartment", image: "/images/stays/type-hotel-apartment.webp" },
  { kind: "villa", image: "/images/stays/type-villa.webp" },
  { kind: "cottage", image: "/images/stays/type-cottage.webp" },
  { kind: "ecolodge", image: "/images/stays/type-ecolodge.webp" },
];

export function StaysHome({
  cities,
  cityOptions,
  featured,
  recent,
  savedIds,
  kindCounts = {},
}: {
  cities: CitySummary[];
  cityOptions: CityOption[];
  featured: PropertyCard[];
  recent: PropertyCard[];
  savedIds: string[];
  kindCounts?: Record<string, number>;
}) {
  const t = useTranslations("StayApp.home");
  const locale = useLocale();
  const tKinds = useTranslations("StayApp.kinds");
  const tNav = useTranslations("StayApp.nav");
  const titleWords = t("heroTitle").split(" ");
  const saved = new Set(savedIds);
  const [recentItems, setRecent] = useState(recent);
  const [, start] = useTransition();
  // The guest's last search (this tab): the form starts from it and one tap reopens the results.
  const [last, setLast] = useState<{ href: string; search: StaySearch } | null>(null);
  useEffect(() => {
    try {
      const href = sessionStorage.getItem(LAST_EXPLORE_KEY);
      if (href && href.startsWith("/stays/")) setLast({ href, search: parseStaySearch(new URLSearchParams(href.split("?")[1] ?? "")) });
    } catch {
      // storage unavailable: start empty
    }
  }, []);
  const lastCity = last?.search.city ? cityOptions.find((c) => c.slug === last.search.city)?.name : null;
  // Types with stays first (most first); a type without any yet is shown as "coming soon", not as a dead end.
  const types = TYPES.map((x, order) => ({ ...x, order, count: kindCounts[x.kind] ?? 0 })).sort((a, b) => Number(b.count > 0) - Number(a.count > 0) || b.count - a.count || a.order - b.order);

  return (
    <div className="space-y-10 pb-6">
      <section
        className="relative isolate overflow-hidden px-4 pt-6 pb-12 text-white sm:px-8 md:pb-16 xl:mx-6 xl:mt-2 xl:rounded-[2.5rem]"
        aria-labelledby="stays-home-title"
      >
        <Image
          src="/images/stays/yazd-traditional-courtyard.webp"
          alt=""
          fill
          priority
          sizes="100vw"
          className="-z-20 object-cover"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(4,33,26,0.55)_0%,rgba(4,33,26,0.72)_45%,rgba(4,33,26,0.96)_100%)]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-10 top-16 bottom-0 -z-10 hidden rounded-t-[999px] border border-b-0 border-[#eacb7f]/35 md:block"
        />

        <div className="flex items-center justify-between gap-3">
          <span className="text-[11px] font-semibold tracking-[0.35em] text-[#eacb7f]" dir="ltr">
            L SEVIN STAYS
          </span>
          <div className="flex items-center gap-2">
            <Link
              href="/stays/bookings"
              className="flex h-11 items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 text-sm font-medium text-[#f4ead0] backdrop-blur-md transition hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-[#eacb7f] focus-visible:outline-none"
            >
              <Luggage className="size-4" aria-hidden="true" />
              <span className="hidden sm:inline">{tNav("bookings")}</span>
            </Link>
            <Link
              href="/stays/wishlist"
              aria-label={tNav("wishlist")}
              className="flex h-11 items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 text-sm font-medium text-[#f4ead0] backdrop-blur-md transition hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-[#eacb7f] focus-visible:outline-none"
            >
              <Heart className="size-4" aria-hidden="true" />
              <span className="hidden sm:inline">{tNav("wishlist")}</span>
              {savedIds.length ? (
                <span className="grid h-5 min-w-5 place-items-center rounded-full bg-[#eacb7f] px-1.5 text-[11px] font-bold text-[#083f30]">
                  {savedIds.length.toLocaleString(locale)}
                </span>
              ) : null}
            </Link>
            <DisplaySettings variant="glass" />
          </div>
        </div>

        <div className="mx-auto mt-10 max-w-3xl text-center md:mt-16">
          <h1 id="stays-home-title" className="font-display text-[46px] leading-[1.05] text-balance md:text-[72px]">
            {titleWords[0]}{" "}
            <span className="text-[#eacb7f]">{titleWords.slice(1).join(" ")}</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-[#d9e4df] md:text-base">{t("heroSubtitle")}</p>
        </div>

        <div className="mx-auto mt-8 max-w-5xl text-slate-900 md:mt-10">
          <StaySearchForm key={last?.href ?? "new"} cities={cityOptions} initial={last?.search} variant="luxe" />
        </div>

        <div className="mx-auto mt-5 flex max-w-5xl flex-wrap items-center justify-center gap-2">
          {last ? (
            <Link
              href={last.href}
              className="inline-flex min-h-10 items-center gap-2 rounded-full bg-[#eacb7f] px-4 text-sm font-semibold text-[#083f30] transition hover:bg-[#f2d996]"
              data-testid="stays-continue-search"
            >
              <History className="size-4" aria-hidden="true" />
              {lastCity ? t("continueSearchIn", { city: lastCity }) : t("continueSearch")}
            </Link>
          ) : null}
          {cityOptions.slice(0, 5).map((c) => (
            <Link
              key={c.slug}
              href={`/stays/explore?city=${encodeURIComponent(c.slug)}`}
              className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-4 text-sm text-[#f4ead0] backdrop-blur-md transition hover:border-[#eacb7f]/60 hover:text-[#eacb7f]"
            >
              <MapPin className="size-3.5" aria-hidden="true" />
              {c.name}
            </Link>
          ))}
        </div>
      </section>

      <section className="px-4 sm:px-6" aria-labelledby="stays-types" data-testid="stays-types">
        <h2 id="stays-types" className="text-lg font-bold">
          {t("browseByType")}
        </h2>
        <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {types.map(({ kind, image, count }, i) => {
            const body = (
              <>
                <Image
                  src={image}
                  alt={t(`typeAlt.${kind}` as never)}
                  fill
                  sizes="(min-width: 1024px) 16vw, (min-width: 640px) 33vw, 50vw"
                  priority={i < 2}
                  className={cn("object-cover transition duration-300", count ? "group-hover:scale-105" : "grayscale-[60%]")}
                />
                <span className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" aria-hidden="true" />
                <span className="absolute inset-x-3 bottom-2.5 flex items-end justify-between gap-2 text-white">
                  <span className="min-w-0">
                    <span className="block truncate text-base font-extrabold drop-shadow">{tKinds(kind)}</span>
                    <span className="block text-xs text-white/90">{count ? t("propertyCount", { count }) : t("comingSoon")}</span>
                  </span>
                  {count ? <ChevronLeft className="size-5 shrink-0 opacity-90" aria-hidden="true" /> : null}
                </span>
              </>
            );
            const tile = "group relative block aspect-[4/3] overflow-hidden rounded-2xl bg-slate-200";
            return (
              <li key={kind}>
                {count ? (
                  <Link href={`/stays/explore?type=${kind}`} className={cn(tile, "focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 focus-visible:outline-none")} data-testid={`stays-type-${kind}`}>
                    {body}
                  </Link>
                ) : (
                  <div className={tile} data-testid={`stays-type-${kind}`} aria-disabled="true">
                    {body}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
        <p className="mt-2 text-[11px] leading-5 text-slate-500" data-testid="stays-types-credits">
          {t("photoCredits")}{" "}
          {TYPE_CREDITS.map((c, i) => (
            <span key={c.kind}>
              {i ? listSeparator(locale) : null}
              <a href={c.source} target="_blank" rel="noopener noreferrer nofollow" className="underline-offset-2 hover:underline" dir="ltr">
                {c.author} ({c.license})
              </a>
            </span>
          ))}
        </p>
      </section>

      {recentItems.length ? (
        <section className="px-4 sm:px-6" aria-labelledby="stays-recent" data-testid="stays-recent">
          <div className="flex items-center justify-between">
            <h2 id="stays-recent" className="text-lg font-bold">
              {t("recent")}
            </h2>
            <button
              type="button"
              className="min-h-11 rounded-full px-3 text-sm text-slate-600 hover:bg-slate-100"
              onClick={() => {
                setRecent([]);
                start(async () => void (await clearStayRecentViewsAction().catch(() => null)));
              }}
              data-testid="stays-recent-clear"
            >
              {t("clearRecent")}
            </button>
          </div>
          <ul className="-mx-4 mt-3 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden">
            {recentItems.map((c) => (
              <li key={c.id} className="w-64 shrink-0 snap-start">
                <PropertyCardView card={c} saved={saved.has(c.id)} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="px-4 sm:px-6" aria-labelledby="stays-cities">
        <h2 id="stays-cities" className="text-lg font-bold">
          {t("popularCities")}
        </h2>
        {cities.length ? (
          <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4" data-testid="stays-home-cities">
            {cities.map((c, i) => (
              <li key={c.id}>
                <Link
                  href={`/stays/city/${c.slug}`}
                  className="group relative block overflow-hidden rounded-2xl focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:outline-none"
                >
                  <StayImage src={c.coverUrl} alt={c.coverAlt ?? c.name} className="aspect-[4/3] w-full transition group-hover:scale-105" priority={i < 2} sizes="(min-width: 1024px) 25vw, 50vw" />
                  <span className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                  <span className="absolute inset-x-3 bottom-3 text-white">
                    <span className="block text-base font-bold">{c.name}</span>
                    <span className="block text-xs text-white/85">{t("propertyCount", { count: c.propertyCount })}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="mt-3 rounded-2xl bg-white p-6 text-center ring-1 ring-slate-200" data-testid="stays-home-empty">
            <p className="font-semibold">{t("emptyTitle")}</p>
            <p className="mt-1 text-sm text-slate-600">{t("emptyText")}</p>
          </div>
        )}
      </section>

      {featured.length ? (
        <section className="px-4 sm:px-6" aria-labelledby="stays-featured">
          <div className="flex items-center justify-between">
            <h2 id="stays-featured" className="text-lg font-bold">
              {t("featured")}
            </h2>
            <Link href="/stays/explore" className="min-h-11 content-center rounded-full px-3 text-sm font-semibold text-emerald-800 hover:bg-emerald-50">
              {t("seeAll")}
            </Link>
          </div>
          <ul className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-4" data-testid="stays-featured">
            {featured.map((c) => (
              <li key={c.id}>
                <PropertyCardView card={c} saved={saved.has(c.id)} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}


      <section className="mx-4 rounded-3xl bg-rose-50 p-5 ring-1 ring-rose-100 sm:mx-6 md:flex md:items-center md:justify-between md:gap-6" aria-labelledby="stays-medical">
        <div className="flex items-start gap-3">
          <HeartPulse className="mt-1 size-6 shrink-0 text-rose-600" aria-hidden="true" />
          <div>
            <h2 id="stays-medical" className="text-lg font-bold text-rose-950">
              {t("medicalTitle")}
            </h2>
            <p className="mt-1 text-sm leading-6 text-rose-900/80">{t("medicalText")}</p>
          </div>
        </div>
        <Link
          href="/stays/explore?amen=near_hospital"
          className="mt-4 inline-flex min-h-11 items-center rounded-full bg-rose-600 px-5 text-sm font-bold text-white hover:bg-rose-700 md:mt-0 md:shrink-0"
        >
          {t("medicalCta")}
        </Link>
      </section>

      <section className="px-4 sm:px-6" aria-labelledby="stays-why">
        <h2 id="stays-why" className="text-lg font-bold">
          {t("whyTitle")}
        </h2>
        <ul className="mt-3 grid gap-3 md:grid-cols-3" data-testid="stays-why">
          {[
            { icon: BadgeCheck, title: t("why1Title"), text: t("why1") },
            { icon: MapPinned, title: t("why2Title"), text: t("why2") },
            { icon: Headphones, title: t("why3Title"), text: t("why3") },
          ].map(({ icon: Icon, title, text }) => (
            <li key={title} className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
              <Icon className="size-6 text-emerald-700" aria-hidden="true" />
              <h3 className="mt-2 font-bold">{title}</h3>
              <p className="mt-1 text-sm leading-6 text-slate-600">{text}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
