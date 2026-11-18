"use client";

import { useEffect, useState, useTransition } from "react";
import { BadgeCheck, Building2, Headphones, HeartPulse, History, Home, Hotel, Landmark, MapPinned, Tent, TreePine } from "lucide-react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";

import { LAST_EXPLORE_KEY, parseStaySearch, type PropertyKind, type StaySearch } from "../../domain/search";
import { clearStayRecentViewsAction } from "../../server/actions/customer";
import type { CitySummary, PropertyCard } from "../../types";
import { StayImage } from "../common";
import { PropertyCardView } from "../property-card";
import { StaySearchForm, type CityOption } from "../search/search-form";

const TYPES: { kind: PropertyKind; icon: typeof Hotel }[] = [
  { kind: "hotel", icon: Hotel },
  { kind: "traditional", icon: Landmark },
  { kind: "hotel_apartment", icon: Building2 },
  { kind: "villa", icon: Home },
  { kind: "cottage", icon: TreePine },
  { kind: "ecolodge", icon: Tent },
];

export function StaysHome({
  cities,
  cityOptions,
  featured,
  recent,
  savedIds,
}: {
  cities: CitySummary[];
  cityOptions: CityOption[];
  featured: PropertyCard[];
  recent: PropertyCard[];
  savedIds: string[];
}) {
  const t = useTranslations("StayApp.home");
  const tKinds = useTranslations("StayApp.kinds");
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

  return (
    <div className="space-y-10 pb-6">
      <section className="relative overflow-hidden bg-gradient-to-b from-emerald-900 to-emerald-700 px-4 pt-8 pb-10 text-white sm:rounded-b-3xl sm:px-8 md:pt-12" aria-labelledby="stays-home-title">
        <h1 id="stays-home-title" className="text-3xl leading-tight font-extrabold md:text-4xl">
          {t("heroTitle")}
        </h1>
        <p className="mt-2 max-w-xl text-sm leading-6 text-emerald-50 md:text-base">{t("heroSubtitle")}</p>
        <div className="mt-6 text-slate-900">
          <StaySearchForm key={last?.href ?? "new"} cities={cityOptions} initial={last?.search} />
        </div>
        {last ? (
          <Link
            href={last.href}
            className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-full bg-white/15 px-4 text-sm font-semibold text-white ring-1 ring-white/30 hover:bg-white/25"
            data-testid="stays-continue-search"
          >
            <History className="size-4" aria-hidden="true" />
            {lastCity ? t("continueSearchIn", { city: lastCity }) : t("continueSearch")}
          </Link>
        ) : null}
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

      <section className="px-4 sm:px-6" aria-labelledby="stays-types">
        <h2 id="stays-types" className="text-lg font-bold">
          {t("browseByType")}
        </h2>
        <ul className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-6">
          {TYPES.map(({ kind, icon: Icon }) => (
            <li key={kind}>
              <Link
                href={`/stays/explore?type=${kind}`}
                className="flex min-h-20 flex-col items-center justify-center gap-1.5 rounded-2xl bg-white p-2 text-center text-xs font-semibold text-slate-800 ring-1 ring-slate-200 hover:bg-emerald-50 focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:outline-none"
              >
                <Icon className="size-6 text-emerald-700" aria-hidden="true" />
                {tKinds(kind)}
              </Link>
            </li>
          ))}
        </ul>
      </section>

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
