"use client";

import { BadgeCheck, LocateFixed, MapPin, Search, SlidersHorizontal, Star } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";

import { toast } from "sonner";
import { rememberUserLocation } from "@/features/shared/types/coordinates";

import { FavoriteButton } from "@/features/favorites/components/favorite-button";
import { Link, useRouter } from "@/i18n/navigation";
import { slugLookup, type ListingSlugs } from "@/lib/routes/filter-paths";
import NearbyMap from "@/app/[locale]/n/app/mobile/map-discovery/NearbyMap";
import {
  buildNearbyQuery,
  mediaUrl,
  navigateSmooth,
  PendingOverlay,
  providerHref,
} from "@/app/[locale]/n/app/mobile/map-discovery/NearbyClient";
import NearbyFilterPanel, {
  countNearbyFilterValues,
  nearbyFilterValuesFrom,
} from "@/app/[locale]/n/app/mobile/map-discovery/NearbyFilterPanel";
import type {
  NearbyCategory,
  NearbyCurrencyOption,
  NearbyFiltersInput,
  NearbyProvider,
} from "@/app/[locale]/n/app/mobile/map-discovery/nearby.data";

import { Reveal } from "../components/motion";
import { responsiveImg } from "@/lib/media/responsive-img";

// The translation namespace NearbyClient uses (see its useTranslations call).
const NAMESPACE = "MapDiscovery";
const GEO_OPTIONS: PositionOptions = { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 };

type Props = {
  locale: string;
  categories: NearbyCategory[];
  providers: NearbyProvider[];
  filters: NearbyFiltersInput;
  mapCenter: { lat: number; lng: number; zoom: number };
  expandedBeyondFilters: boolean;
  /** "list" when the page was opened as a provider list (e.g. from a category). */
  initialView: "map" | "list";
  /** The URL slug of the provider type this request filters by, if any. */
  providerTypeSlug?: string | null;
  availableLanguages: string[];
  availableSpecialties: string[];
  availableCurrencies: NearbyCurrencyOption[];
};

/** Desktop map discovery: a full-height map beside the list, kept in sync both ways. */
export function DesktopNearbyView({
  locale,
  categories,
  providers,
  filters,
  mapCenter,
  expandedBeyondFilters,
  initialView,
  providerTypeSlug = null,
  availableLanguages,
  availableSpecialties,
  availableCurrencies,
}: Props) {
  const slugs = useMemo<ListingSlugs>(
    () => ({
      category: slugLookup(categories.filter((category) => category.id !== "all")),
      type: (id) => (id === filters.providerTypeId ? providerTypeSlug : null),
    }),
    [categories, filters.providerTypeId, providerTypeSlug],
  );
  const t = useTranslations(NAMESPACE);
    const tLocation = useTranslations("LocationAccess");
  const tExplore = useTranslations("Explore");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [center, setCenter] = useState(mapCenter);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(
    filters.lat != null && filters.lng != null ? { lat: filters.lat, lng: filters.lng } : null
  );
  const [isLocating, setIsLocating] = useState(false);
  const [query, setQuery] = useState(filters.q);
  const [view, setView] = useState<"map" | "list">(initialView);
  const cardRefs = useRef(new Map<string, HTMLElement>());
  // The same "advanced filters" panel as the phone screen: location, price,
  // distance, rating, verified, languages, specialties.
  const [showFilters, setShowFilters] = useState(false);
  const closeFilters = useCallback(() => setShowFilters(false), []);
  const activeFilterCount = countNearbyFilterValues(nearbyFilterValuesFrom(filters));

  useEffect(() => setCenter(mapCenter), [mapCenter]);

  const selectedProvider = useMemo(() => providers.find((provider) => provider.id === selectedId) ?? null, [providers, selectedId]);
  const number = (value: number, digits = 0) => new Intl.NumberFormat(locale, { maximumFractionDigits: digits }).format(value);
  const km = (value: number) => new Intl.NumberFormat(locale, { style: "unit", unit: "kilometer", maximumFractionDigits: 1 }).format(value);

  const apply = (changes: Partial<NearbyFiltersInput>) =>
    navigateSmooth(startTransition, router, buildNearbyQuery({ ...filters, ...changes }, view, slugs));

  // A pin picked on the map: bring its card into view.
  const selectFromMap = (id: string | null) => {
    setSelectedId(id);
    if (id) cardRefs.current.get(id)?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const locateMe = () => {
    if (!navigator.geolocation) {
      toast.error(tLocation("unavailable"));
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLocating(false);
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        rememberUserLocation({ latitude: lat, longitude: lng });
        setUserLocation({ lat, lng });
        setCenter({ lat, lng, zoom: 14 });
        apply({ lat, lng });
      },
      (error) => {
        setIsLocating(false);
        toast.error(error.code === error.PERMISSION_DENIED ? tLocation("denied") : tLocation("unavailable"));
      },
      GEO_OPTIONS
    );
  };

  const hasCustomFilters =
    Boolean(filters.q || filters.categoryId || filters.countryCode || filters.cityCode || filters.currencyCode) ||
    filters.verifiedOnly ||
    filters.minRating > 0 ||
    filters.minPrice > 0 ||
    (filters.maxPrice > 0 && filters.maxPrice !== 5000) ||
    filters.languages.length > 0 ||
    filters.specialties.length > 0;
  const chips = categories.some((category) => category.id === "all") ? categories : [{ id: "all", label: t("filters.any") }, ...categories];

  return (
    <div className="lsd hidden xl:block">
      {isPending ? <PendingOverlay /> : null}

      <div className={`mx-auto grid max-w-[1600px] gap-6 px-6 pb-6 pt-4 ${view === "map" ? "grid-cols-[480px_1fr]" : "grid-cols-1"}`}>
        {/* List column */}
        <div className={view === "map" ? "flex h-[calc(100vh-136px)] min-h-[560px] flex-col" : "flex flex-col"}>
          <div className="space-y-4 pb-4">
            <div className="flex items-end justify-between gap-4">
              <div role="heading" aria-level={1} className="lsd-heading text-3xl font-black text-[#0e1a16]">{t("title")}</div>
              <span className="flex items-center gap-3">
                <span className="rounded-full bg-[#083f30] px-3 py-1 text-sm font-bold text-[#eacb7f]">{number(providers.length)}</span>
                <button
                  type="button"
                  onClick={() => setView(view === "map" ? "list" : "map")}
                  className="flex items-center gap-1.5 rounded-full bg-white px-4 py-1.5 text-sm font-bold text-[#083f30] ring-1 ring-[#dce4e0] transition hover:ring-[#c9a55a]"
                >
                  <MapPin size={15} className="text-[#c9a55a]" />
                  {view === "map" ? t("showList") : t("showMap")}
                </button>
              </span>
            </div>

            <form
              onSubmit={(event) => {
                event.preventDefault();
                apply({ q: query.trim() });
              }}
              className="flex h-14 items-center gap-3 rounded-full bg-white pe-2 ps-5 ring-1 ring-[#dce4e0] focus-within:ring-[#c9a55a]"
            >
              <Search size={19} className="shrink-0 text-[#083f30]" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={tExplore("search.placeholder")}
                className="min-w-0 flex-1 bg-transparent text-[15px] outline-none"
              />
              <button
                type="button"
                onClick={locateMe}
                disabled={isLocating}
                aria-label={t("useMyLocation")}
                title={t("useMyLocation")}
                className="grid h-10 w-10 place-items-center rounded-full bg-[#083f30] text-[#eacb7f] transition hover:bg-[#0f5a45] disabled:opacity-60"
              >
                <LocateFixed size={18} className={isLocating ? "animate-pulse" : ""} />
              </button>
            </form>

            <div className="hide-scrollbar flex gap-2 overflow-x-auto">
              {chips.map((category) => {
                const active = (filters.categoryId ?? "all") === category.id;
                return (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => apply({ categoryId: category.id === "all" ? null : category.id })}
                    className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold transition ${
                      active ? "bg-[#083f30] text-[#eacb7f]" : "bg-white text-[#56675f] ring-1 ring-[#dce4e0] hover:text-[#083f30]"
                    }`}
                  >
                    {category.label}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => setShowFilters(true)}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#083f30] px-6 text-sm font-bold text-[#eacb7f] transition hover:bg-[#0f5a45]"
            >
              <SlidersHorizontal size={17} />
              {t("advancedFilters")}
              {activeFilterCount > 0 ? (
                <span className="inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-[#eacb7f] px-1.5 text-[11px] font-black text-[#062a20]">
                  {number(activeFilterCount)}
                </span>
              ) : null}
            </button>
            <NearbyFilterPanel
              open={showFilters}
              onClose={closeFilters}
              variant="dialog"
              filters={filters}
              locale={locale}
              availableLanguages={availableLanguages}
              availableSpecialties={availableSpecialties}
              availableCurrencies={availableCurrencies}
              onApply={(values) => apply(values)}
              onClear={() => apply(nearbyFilterValuesFrom(null))}
            />

            {hasCustomFilters ? (
              <Link href="/map" className="inline-block text-sm font-semibold text-[#8c6b2c] hover:text-[#083f30]">
                {t("clearAll")}
              </Link>
            ) : null}
            {expandedBeyondFilters ? (
              <p className="rounded-2xl bg-[#fbf3de] px-4 py-3 text-sm leading-6 text-[#8c6b2c]">{t("expandedNote")}</p>
            ) : null}
          </div>

          {/* Results */}
          <div className={view === "map" ? "hide-scrollbar -mx-1 flex-1 space-y-3 overflow-y-auto px-1 pb-2" : "grid grid-cols-3 gap-4 pb-2"}>
            {providers.length ? (
              providers.map((provider, index) => {
                const selected = provider.id === selectedId;
                return (
                  <Reveal key={provider.id} delay={Math.min(index, 8) * 50}>
                    <article
                      ref={(node) => {
                        if (node) cardRefs.current.set(provider.id, node);
                        else cardRefs.current.delete(provider.id);
                      }}
                      className={`group relative flex gap-4 rounded-[24px] bg-white p-3 transition duration-300 ${
                        selected ? "shadow-[0_20px_40px_-25px_rgba(6,42,32,0.6)] ring-2 ring-[#c9a55a]" : "ring-1 ring-[#dce4e0] hover:ring-[#c9a55a]/60"
                      }`}
                    >
                      <Link href={providerHref(provider)} className="absolute inset-0 z-0 rounded-[24px]" aria-label={provider.name} />
                      <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-2xl bg-[#0f5a45]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img {...responsiveImg(mediaUrl(provider.image), "160px")} loading="lazy" decoding="async" alt="" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
                      </div>
                      <div className="pointer-events-none relative min-w-0 flex-1 py-1">
                        <h3 className="flex items-center gap-1.5 font-black text-[#0e1a16]">
                          <span className="truncate">{provider.name}</span>
                          {provider.verified ? <BadgeCheck size={16} className="shrink-0 text-[#0f5a45]" /> : null}
                        </h3>
                        <p className="mt-1 truncate text-sm text-[#56675f]">{provider.location}</p>
                        <div className="mt-2 flex items-center gap-3 text-sm">
                          <span className="flex items-center gap-1">
                            <Star size={14} className="fill-[#c9a55a] text-[#c9a55a]" />
                            <span className="font-bold">{number(provider.rating || 0, 1)}</span>
                            {provider.reviews ? <span className="text-[#8fa79d]">({number(provider.reviews)})</span> : null}
                          </span>
                          {provider.distanceKm != null ? (
                            <span className="rounded-full bg-[#fbf3de] px-2 py-0.5 text-xs font-bold text-[#8c6b2c]">{km(provider.distanceKm)}</span>
                          ) : null}
                        </div>
                        {provider.specialties.length ? (
                          <p className="mt-2 truncate text-xs text-[#8fa79d]">{provider.specialties.slice(0, 3).join(" · ")}</p>
                        ) : null}
                      </div>
                      <div className="relative z-10 flex flex-col items-center justify-between gap-2">
                        <FavoriteButton
                          entityId={provider.id}
                          entityType="provider"
                          initialIsFavorite={provider.isFavorited}
                          className="!h-9 !w-9 bg-[#f2f5f3] text-gray-700"
                          iconClassName="h-4 w-4"
                        />
                        {provider.coordinates ? (
                          <button
                            type="button"
                            onClick={() => setSelectedId(provider.id)}
                            aria-label={provider.name}
                            className={`grid h-9 w-9 place-items-center rounded-full transition ${
                              selected ? "bg-[#c9a55a] text-[#062a20]" : "bg-[#083f30] text-[#eacb7f] hover:bg-[#0f5a45]"
                            }`}
                          >
                            <MapPin size={16} />
                          </button>
                        ) : null}
                      </div>
                    </article>
                  </Reveal>
                );
              })
            ) : (
              <p className="rounded-[24px] border border-dashed border-[#dce4e0] bg-white p-8 text-center text-[#56675f]">{t("noResults")}</p>
            )}
          </div>
        </div>

        {/* Map column */}
        {view === "map" ? (
        <div className="sticky top-28 h-[calc(100vh-136px)] min-h-[560px] overflow-hidden rounded-[36px] ring-1 ring-[#dce4e0] [&>*]:!h-full">
          <NearbyMap
            providers={providers}
            selectedProvider={selectedProvider}
            onSelectProvider={selectFromMap}
            center={center}
            userLocation={userLocation}
            countryCode={filters.countryCode}
          />
        </div>
        ) : null}
      </div>
    </div>
  );
}