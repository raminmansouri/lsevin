"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { Crosshair, List, LocateFixed, Map as MapIcon, MapPin, SlidersHorizontal, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";

import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { directionOf } from "@/features/tours/domain/content";
import { formatMoney } from "@/features/tours/ui/shared/format";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

import { DEFAULT_RADIUS_M, RADII_M, type NearRef, type RadiusM } from "../../domain/geo";
import { activeFilterCount, LAST_EXPLORE_KEY, parseStaySearch, PROPERTY_KINDS, SORTS, stayQueryOnly, toSearchParams, withoutFilters, type StaySearch } from "../../domain/search";
import type { ExploreSuggestions } from "../../server/catalog";
import type { Amenity, Landmark, SearchResult } from "../../types";
import { useDistance } from "../common";
import { PropertyCardView } from "../property-card";
import { StaySearchForm, type CityOption } from "../search/search-form";

import { StaysMap } from "./stays-map";

/** Amenities offered as one-tap filters, in this order, when the catalog has them. */
const QUICK_AMENITIES = ["parking", "haram_view", "pool", "kitchen", "family_rooms", "companion_beds"];

/** Sensible first radius per kind of place: a shrine or bazaar is walked to, an airport is driven to. */
const RADIUS_FOR: Partial<Record<Landmark["kind"], RadiusM>> = { shrine: 1000, attraction: 1000, shopping: 1000, airport: 5000, station: 2000, hospital: 2000, park: 2000 };

export type CityCount = { slug: string; name: string; count: number };

export function ExploreView({
  search,
  result,
  cities,
  cityCounts = [],
  amenities,
  landmarks = [],
  suggestions = null,
  savedIds,
  heading,
  basePath = "/stays/explore",
  lockedCity,
}: {
  search: StaySearch;
  result: SearchResult | null;
  cities: CityOption[];
  /** Cities with bookable stays — offered when a search finds nothing. */
  cityCounts?: CityCount[];
  amenities: Amenity[];
  /** Places of the searched city (shrine, bazaar, airport…) for "near …". */
  landmarks?: Landmark[];
  suggestions?: ExploreSuggestions | null;
  savedIds: string[];
  heading: string;
  /** City landing pages keep their own path; the city is implied by it. */
  basePath?: string;
  lockedCity?: string | null;
}) {
  const t = useTranslations("StayApp.explore");
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();
  const [pending, start] = useTransition();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [view, setView] = useState<"list" | "map">("list");
  const [picked, setPicked] = useState<{ lat: number; lng: number } | null>(null);
  const [geoError, setGeoError] = useState(false);
  const saved = useMemo(() => new Set(savedIds), [savedIds]);
  const filters = activeFilterCount(search);
  const pages = result ? Math.max(1, Math.ceil(result.total / result.pageSize)) : 1;
  const cardQuery = stayQueryOnly(search).toString();
  const urlParams = useSearchParams();
  const omitCity = Boolean(lockedCity);
  const anchor = result?.anchor ?? null;
  const anchorName = anchor ? (anchor.name ?? t("chosenPoint")) : null;

  // The URL is the state. If the browser shows a different search than the one rendered
  // (back/forward after a reload restores the URL without new server data), refetch.
  useEffect(() => {
    const inUrl = toSearchParams(parseStaySearch(new URLSearchParams(urlParams.toString())), { omitCity }).toString();
    const rendered = toSearchParams(search, { omitCity }).toString();
    if (inUrl !== rendered) router.refresh();
  }, [urlParams, search, omitCity, router]);

  useEffect(() => {
    const qs = toSearchParams(search, { omitCity }).toString();
    try {
      sessionStorage.setItem(LAST_EXPLORE_KEY, `${basePath}${qs ? `?${qs}` : ""}`);
    } catch {
      // private mode / storage disabled: back navigation falls back to the stays home
    }
  }, [search, basePath, omitCity]);

  function go(patch: Partial<StaySearch>) {
    const next = { ...search, ...patch, page: patch.page ?? 1 };
    if (!next.near && next.sort === "distance") next.sort = "recommended";
    const qs = toSearchParams(next, { omitCity }).toString();
    start(() => router.push(`${basePath}${qs ? `?${qs}` : ""}`, { scroll: patch.page != null }));
  }

  function nearPlace(near: NearRef, radius: RadiusM | null) {
    setPicked(null);
    go({ near, radius, sort: "distance" });
  }

  function nearMe() {
    setGeoError(false);
    if (!("geolocation" in navigator)) return setGeoError(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => nearPlace({ type: "pt", lat: pos.coords.latitude, lng: pos.coords.longitude }, DEFAULT_RADIUS_M),
      () => setGeoError(true),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
    );
  }

  if (!result) {
    return (
      <div className="px-4 py-10 text-center" role="alert" data-testid="stays-explore-error">
        <p className="text-lg font-bold">{t("errorTitle")}</p>
        <p className="mt-1 text-sm text-slate-600">{t("errorText")}</p>
        <button type="button" onClick={() => start(() => router.refresh())} className="mt-4 min-h-11 rounded-full bg-emerald-700 px-5 text-sm font-bold text-white">
          {t("retry")}
        </button>
      </div>
    );
  }

  const cityLandmarks = landmarks.filter((l) => !search.city || l.city === search.city);
  const sorts = SORTS.filter((s) => s !== "distance" || anchor);

  return (
    <div className="space-y-4 px-4 pt-4 sm:px-6" aria-busy={pending}>
      <div className="rounded-3xl bg-white p-3 ring-1 ring-slate-200">
        <StaySearchForm
          key={`${search.city}-${search.q}-${search.checkIn}-${search.checkOut}-${search.adults}-${search.rooms}-${search.childAges.join(".")}`}
          cities={cities}
          initial={search}
          variant="hero"
          target={lockedCity ? { path: pathname } : "explore"}
          keep={toSearchParams({ ...search, city: null, q: null, checkIn: null, checkOut: null, adults: undefined, childAges: [], rooms: undefined, page: 1 })}
        />
      </div>

      <LocationBar
        landmarks={cityLandmarks}
        anchorName={anchorName}
        hasAnchor={Boolean(search.near)}
        anchorMissing={Boolean(search.near) && !anchor}
        radius={search.radius}
        onLandmark={(l) => nearPlace({ type: "lm", city: l.city, slug: l.slug }, RADIUS_FOR[l.kind] ?? DEFAULT_RADIUS_M)}
        onRadius={(r) => go({ radius: r })}
        onClear={() => go({ near: null, radius: null })}
        onNearMe={nearMe}
        onPickOnMap={() => setView("map")}
        geoError={geoError}
      />

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 md:text-2xl">{heading}</h1>
          <p className="text-sm text-slate-600" aria-live="polite" data-testid="stays-results-count">
            {t("results", { count: result.total })}
            {search.checkIn && search.checkOut && result.items[0]?.nights ? ` ${t("resultsFor", { nights: result.items[0].nights })}` : ""}
          </p>
          {!search.checkIn ? (
            <p className="mt-1 text-xs text-amber-800" data-testid="stays-no-dates-hint">
              {t("noDatesHint")}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setFiltersOpen(true)}
            data-testid="stays-filters-open"
            className="inline-flex min-h-11 items-center gap-2 rounded-full bg-white px-4 text-sm font-semibold ring-1 ring-slate-300 hover:bg-slate-50"
          >
            <SlidersHorizontal className="size-4" aria-hidden="true" />
            {filters ? t("filtersCount", { count: filters }) : t("filters")}
          </button>
          <label className="sr-only" htmlFor="stays-sort">
            {t("sort")}
          </label>
          <select
            id="stays-sort"
            value={search.sort}
            onChange={(e) => go({ sort: e.target.value as StaySearch["sort"] })}
            data-testid="stays-sort"
            className="min-h-11 rounded-full border border-slate-300 bg-white px-3 text-sm font-medium"
          >
            {sorts.map((s) => (
              <option key={s} value={s}>
                {t(`sorts.${s}`)}
              </option>
            ))}
          </select>
          <div className="flex rounded-full bg-white p-1 ring-1 ring-slate-300" role="group" aria-label={`${t("list")} / ${t("map")}`}>
            <button type="button" aria-pressed={view === "list"} onClick={() => setView("list")} className={cn("flex min-h-9 items-center gap-1 rounded-full px-3 text-sm", view === "list" && "bg-emerald-700 text-white")}>
              <List className="size-4" aria-hidden="true" />
              <span className="sr-only sm:not-sr-only">{t("list")}</span>
            </button>
            <button
              type="button"
              aria-pressed={view === "map"}
              onClick={() => setView("map")}
              data-testid="stays-map-toggle"
              className={cn("flex min-h-9 items-center gap-1 rounded-full px-3 text-sm", view === "map" && "bg-emerald-700 text-white")}
            >
              <MapIcon className="size-4" aria-hidden="true" />
              <span className="sr-only sm:not-sr-only">{t("map")}</span>
            </button>
          </div>
        </div>
      </div>

      <QuickFilters search={search} amenities={amenities} onToggle={go} />

      <ActiveFilters search={search} amenities={amenities} onChange={go} />

      {view === "map" ? (
        <section aria-label={t("mapTitle")} className="space-y-2">
          <StaysMap
            points={result.items
              .filter((c) => c.latitude != null && c.longitude != null)
              .map((c) => ({
                id: c.id,
                lat: c.latitude!,
                lng: c.longitude!,
                name: c.name,
                price: c.total != null && c.nights ? formatMoney(Math.round(c.total / c.nights), c.currency, locale) : c.fromNightly != null ? formatMoney(c.fromNightly, c.currency, locale) : null,
                href: `/${locale}/stays/${c.slug}${cardQuery ? `?${cardQuery}` : ""}`,
                approximate: c.approximate,
              }))}
            anchor={anchor ? { lat: anchor.latitude, lng: anchor.longitude, name: anchorName } : null}
            radiusM={search.radius}
            picked={picked}
            onPick={setPicked}
            labels={{ region: t("mapTitle"), unavailable: t("mapUnavailable"), tapHint: t("pickHint") }}
          />
          {picked ? (
            <PickedPointBar
              onSearch={(radius) => nearPlace({ type: "pt", lat: picked.lat, lng: picked.lng }, radius)}
              onCancel={() => setPicked(null)}
            />
          ) : null}
          <p className="text-xs text-slate-500">{t("mapApproximate")}</p>
        </section>
      ) : null}

      {result.items.length === 0 ? (
        <EmptyState search={search} suggestions={suggestions} cityCounts={cityCounts} savedIds={saved} cardQuery={cardQuery} onChange={go} />
      ) : (
        <ul className={cn("grid gap-4 sm:grid-cols-2 lg:grid-cols-3", pending && "opacity-60")} data-testid="stays-results">
          {result.items.map((c, i) => (
            <li key={c.id}>
              <PropertyCardView card={c} saved={saved.has(c.id)} query={cardQuery} priority={i < 2} headingLevel={2} anchorName={anchorName} />
            </li>
          ))}
        </ul>
      )}

      {pages > 1 ? (
        <nav className="flex items-center justify-center gap-3 py-4" aria-label={t("page", { page: search.page, pages })}>
          <button type="button" disabled={search.page <= 1} onClick={() => go({ page: search.page - 1 })} className="min-h-11 rounded-full px-4 text-sm font-semibold ring-1 ring-slate-300 disabled:opacity-40" data-testid="stays-prev-page">
            {t("previous")}
          </button>
          <span className="text-sm text-slate-600">{t("page", { page: search.page, pages })}</span>
          <button type="button" disabled={search.page >= pages} onClick={() => go({ page: search.page + 1 })} className="min-h-11 rounded-full px-4 text-sm font-semibold ring-1 ring-slate-300 disabled:opacity-40" data-testid="stays-next-page">
            {t("next")}
          </button>
        </nav>
      ) : null}

      <FiltersSheet
        open={filtersOpen}
        onOpenChange={setFiltersOpen}
        search={search}
        amenities={amenities}
        side={directionOf(locale) === "rtl" ? "left" : "right"}
        onApply={(patch) => {
          setFiltersOpen(false);
          go(patch);
        }}
      />
    </div>
  );
}

function RadiusSelect({ value, onChange, id, className }: { value: RadiusM | null; onChange: (r: RadiusM | null) => void; id: string; className?: string }) {
  const t = useTranslations("StayApp.explore");
  const { length } = useDistance();
  return (
    <select
      id={id}
      value={value ?? "any"}
      onChange={(e) => onChange(e.target.value === "any" ? null : (Number(e.target.value) as RadiusM))}
      className={cn("min-h-10 rounded-full border border-emerald-300 bg-white px-3 text-sm font-semibold text-emerald-900", className)}
      data-testid={`${id}-select`}
    >
      {RADII_M.map((r) => (
        <option key={r} value={r}>
          {t("upTo", { distance: length(r) })}
        </option>
      ))}
      <option value="any">{t("radiusAny")}</option>
    </select>
  );
}

/** "Near …": the city's key places, the visitor's position, or a point on the map — plus the active place and its radius. */
function LocationBar({
  landmarks,
  anchorName,
  hasAnchor,
  anchorMissing,
  radius,
  onLandmark,
  onRadius,
  onClear,
  onNearMe,
  onPickOnMap,
  geoError,
}: {
  landmarks: Landmark[];
  anchorName: string | null;
  hasAnchor: boolean;
  anchorMissing: boolean;
  radius: RadiusM | null;
  onLandmark: (l: Landmark) => void;
  onRadius: (r: RadiusM | null) => void;
  onClear: () => void;
  onNearMe: () => void;
  onPickOnMap: () => void;
  geoError: boolean;
}) {
  const t = useTranslations("StayApp.explore");
  const chips = landmarks.filter((l) => l.quick).slice(0, 6);
  const chip = "inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-full bg-white px-3 text-sm font-medium text-slate-800 ring-1 ring-slate-300 hover:bg-emerald-50 focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:outline-none";
  return (
    <section aria-label={t("locationTitle")} className="space-y-2" data-testid="stays-location-bar">
      {hasAnchor ? (
        <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-emerald-50 px-3 py-2 text-sm text-emerald-950 ring-1 ring-emerald-200" data-testid="stays-anchor">
          <MapPin className="size-4 shrink-0 text-emerald-700" aria-hidden="true" />
          {anchorMissing ? (
            <span className="font-semibold">{t("placeUnavailable")}</span>
          ) : (
            <>
              <span className="font-semibold">{t("nearPlace", { place: anchorName ?? "" })}</span>
              <label htmlFor="stays-radius" className="sr-only">
                {t("radius")}
              </label>
              <RadiusSelect id="stays-radius" value={radius} onChange={onRadius} />
            </>
          )}
          <button type="button" onClick={onClear} className="ms-auto inline-flex min-h-10 items-center gap-1 rounded-full px-3 text-sm font-semibold text-emerald-800 hover:bg-emerald-100" data-testid="stays-anchor-clear">
            <X className="size-4" aria-hidden="true" />
            {t("clearPlace")}
          </button>
        </div>
      ) : null}
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0" data-testid="stays-near-chips">
        {chips.map((l) => (
          <button key={`${l.city}/${l.slug}`} type="button" onClick={() => onLandmark(l)} className={chip} data-testid={`stays-near-${l.slug}`}>
            <MapPin className="size-4 text-emerald-700" aria-hidden="true" />
            {t("nearPlace", { place: l.name })}
          </button>
        ))}
        <button type="button" onClick={onNearMe} className={chip} data-testid="stays-near-me">
          <LocateFixed className="size-4 text-emerald-700" aria-hidden="true" />
          {t("nearMe")}
        </button>
        <button type="button" onClick={onPickOnMap} className={chip} data-testid="stays-pick-on-map">
          <Crosshair className="size-4 text-emerald-700" aria-hidden="true" />
          {t("pickOnMap")}
        </button>
      </div>
      {geoError ? (
        <p role="alert" className="text-xs font-medium text-red-700" data-testid="stays-near-me-error">
          {t("nearMeError")}
        </p>
      ) : null}
    </section>
  );
}

function PickedPointBar({ onSearch, onCancel }: { onSearch: (r: RadiusM) => void; onCancel: () => void }) {
  const t = useTranslations("StayApp.explore");
  const [radius, setRadius] = useState<RadiusM>(1000);
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-orange-50 px-3 py-2 text-sm ring-1 ring-orange-200" data-testid="stays-picked-point">
      <span className="font-semibold text-orange-950">{t("searchAroundPoint")}</span>
      <label htmlFor="stays-picked-radius" className="sr-only">
        {t("radius")}
      </label>
      <RadiusSelect id="stays-picked-radius" value={radius} onChange={(r) => setRadius(r ?? 10000)} />
      <button type="button" onClick={() => onSearch(radius)} className="min-h-10 rounded-full bg-orange-500 px-4 font-bold text-white hover:bg-orange-600" data-testid="stays-picked-search">
        {t("searchHere")}
      </button>
      <button type="button" onClick={onCancel} className="min-h-10 rounded-full px-3 text-slate-700 hover:bg-orange-100">
        {t("cancel")}
      </button>
    </div>
  );
}

/** One-tap filters guests use most (competitor research: capacity, free cancellation, breakfast, parking…). */
function QuickFilters({ search, amenities, onToggle }: { search: StaySearch; amenities: Amenity[]; onToggle: (p: Partial<StaySearch>) => void }) {
  const t = useTranslations("StayApp.explore");
  const byCode = new Map(amenities.map((a) => [a.code, a]));
  const toggles: { key: string; label: string; on: boolean; patch: Partial<StaySearch> }[] = [];
  if (search.checkIn) toggles.push({ key: "avail", label: t("availableOnly"), on: search.availableOnly, patch: { availableOnly: !search.availableOnly } });
  toggles.push({ key: "free", label: t("freeCancellation"), on: search.freeCancellation, patch: { freeCancellation: !search.freeCancellation } });
  toggles.push({ key: "bf", label: t("breakfast"), on: search.breakfast, patch: { breakfast: !search.breakfast } });
  toggles.push({ key: "instant", label: t("instantOnly"), on: search.instantOnly, patch: { instantOnly: !search.instantOnly } });
  for (const code of QUICK_AMENITIES) {
    const a = byCode.get(code);
    if (!a) continue;
    const on = search.amenities.includes(code);
    toggles.push({ key: code, label: a.label, on, patch: { amenities: on ? search.amenities.filter((c) => c !== code) : [...search.amenities, code] } });
  }
  return (
    <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0" role="group" aria-label={t("quickTitle")} data-testid="stays-quick-filters">
      {toggles.map((q) => (
        <button
          key={q.key}
          type="button"
          aria-pressed={q.on}
          onClick={() => onToggle(q.patch)}
          data-testid={`stays-quick-${q.key}`}
          className={cn(
            "inline-flex min-h-9 shrink-0 items-center rounded-full px-3 text-xs font-semibold ring-1 focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:outline-none",
            q.on ? "bg-emerald-700 text-white ring-emerald-700" : "bg-white text-slate-700 ring-slate-300 hover:bg-slate-50",
          )}
        >
          {q.label}
        </button>
      ))}
    </div>
  );
}

/** Every applied filter as a chip that removes just that filter. */
function ActiveFilters({ search, amenities, onChange }: { search: StaySearch; amenities: Amenity[]; onChange: (p: Partial<StaySearch>) => void }) {
  const t = useTranslations("StayApp.explore");
  const tKinds = useTranslations("StayApp.kinds");
  const locale = useLocale();
  const labels = new Map(amenities.map((a) => [a.code, a.label]));
  // Price filters are in the catalog's charge currency (rial), exactly as prices are shown.
  const money = (v: number) => formatMoney(v, "IRR", locale);
  const chips: { key: string; label: string; patch: Partial<StaySearch> }[] = [
    ...search.kinds.map((k) => ({ key: `k-${k}`, label: tKinds(k), patch: { kinds: search.kinds.filter((x) => x !== k) } })),
    ...search.stars.map((s) => ({ key: `s-${s}`, label: t("starsValue", { count: s }), patch: { stars: search.stars.filter((x) => x !== s) } })),
    ...search.amenities.map((a) => ({ key: `a-${a}`, label: labels.get(a) ?? a, patch: { amenities: search.amenities.filter((x) => x !== a) } })),
  ];
  if (search.minPrice) chips.push({ key: "min", label: t("minPriceChip", { price: money(search.minPrice) }), patch: { minPrice: null } });
  if (search.maxPrice) chips.push({ key: "max", label: t("maxPriceChip", { price: money(search.maxPrice) }), patch: { maxPrice: null } });
  if (search.minRating) chips.push({ key: "rating", label: t("ratingValue", { value: search.minRating }), patch: { minRating: null } });
  if (search.freeCancellation) chips.push({ key: "free", label: t("freeCancellation"), patch: { freeCancellation: false } });
  if (search.instantOnly) chips.push({ key: "instant", label: t("instantOnly"), patch: { instantOnly: false } });
  if (search.accessible) chips.push({ key: "access", label: t("accessible"), patch: { accessible: false } });
  if (search.availableOnly) chips.push({ key: "avail", label: t("availableOnly"), patch: { availableOnly: false } });
  if (search.breakfast) chips.push({ key: "bf", label: t("breakfast"), patch: { breakfast: false } });
  if (chips.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-2" data-testid="stays-active-filters">
      {chips.map((c) => (
        <button
          key={c.key}
          type="button"
          onClick={() => onChange(c.patch)}
          aria-label={t("removeFilter", { name: c.label })}
          className="inline-flex min-h-9 items-center gap-1 rounded-full bg-emerald-50 px-3 text-xs font-semibold text-emerald-900 ring-1 ring-emerald-200 hover:bg-emerald-100"
        >
          {c.label}
          <X className="size-3.5" aria-hidden="true" />
        </button>
      ))}
      <button type="button" onClick={() => onChange(withoutFilters(search))} className="inline-flex min-h-9 items-center gap-1 rounded-full bg-slate-900 px-3 text-xs font-semibold text-white" data-testid="stays-filters-reset">
        {t("clearAll")}
      </button>
    </div>
  );
}

/** No results is never a dead end: say why, offer the change that finds stays, and show stays for the same trip. */
function EmptyState({
  search,
  suggestions,
  cityCounts,
  savedIds,
  cardQuery,
  onChange,
}: {
  search: StaySearch;
  suggestions: ExploreSuggestions | null;
  cityCounts: CityCount[];
  savedIds: Set<string>;
  cardQuery: string;
  onChange: (p: Partial<StaySearch>) => void;
}) {
  const t = useTranslations("StayApp.explore");
  const { length } = useDistance();
  const city = cityCounts.find((c) => c.slug === search.city);
  const cityHasNone = Boolean(search.city) && !city;
  const otherCities = cityCounts.filter((c) => c.slug !== search.city && c.count > 0).slice(0, 8);
  const action = "inline-flex min-h-11 items-center justify-center rounded-full bg-emerald-700 px-5 text-sm font-bold text-white hover:bg-emerald-800";
  const secondary = "inline-flex min-h-11 items-center justify-center rounded-full bg-white px-5 text-sm font-semibold text-emerald-900 ring-1 ring-emerald-300 hover:bg-emerald-50";
  return (
    <section className="space-y-6" data-testid="stays-empty">
      <div className="rounded-2xl bg-white p-6 ring-1 ring-slate-200">
        <h2 className="text-lg font-bold">{t("emptyTitle")}</h2>
        <p className="mt-1 text-sm leading-6 text-slate-600">
          {cityHasNone ? t("emptyNoCity") : search.q ? t("emptyQuery", { q: search.q }) : t("emptyText")}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {suggestions?.widerRadius ? (
            <button type="button" className={action} onClick={() => onChange({ radius: suggestions.widerRadius!.radius as RadiusM | null })} data-testid="stays-empty-wider">
              {suggestions.widerRadius.radius == null
                ? t("tryAnyDistance", { count: suggestions.widerRadius.count })
                : t("tryWiderRadius", { distance: length(suggestions.widerRadius.radius), count: suggestions.widerRadius.count })}
            </button>
          ) : null}
          {suggestions?.withoutFilters ? (
            <button type="button" className={suggestions.widerRadius ? secondary : action} onClick={() => onChange(withoutFilters(search))} data-testid="stays-empty-clear-filters">
              {t("tryWithoutFilters", { count: suggestions.withoutFilters })}
            </button>
          ) : null}
          {search.q ? (
            <button type="button" className={secondary} onClick={() => onChange({ q: null })} data-testid="stays-empty-clear-query">
              {t("tryWithoutQuery")}
            </button>
          ) : null}
          {search.checkIn ? (
            <button type="button" className={secondary} onClick={() => onChange({ checkIn: null, checkOut: null })} data-testid="stays-empty-clear-dates">
              {t("tryWithoutDates")}
            </button>
          ) : null}
          {search.near ? (
            <button type="button" className={secondary} onClick={() => onChange({ near: null, radius: null })}>
              {t("clearPlace")}
            </button>
          ) : null}
        </div>
        {otherCities.length ? (
          <div className="mt-5">
            <h3 className="text-sm font-bold text-slate-800">{t("tryOtherCities")}</h3>
            <ul className="mt-2 flex flex-wrap gap-2" data-testid="stays-empty-cities">
              {otherCities.map((c) => (
                <li key={c.slug}>
                  <Link href={`/stays/city/${c.slug}${cardQuery ? `?${cardQuery}` : ""}`} className="inline-flex min-h-10 items-center gap-1 rounded-full bg-slate-50 px-3 text-sm ring-1 ring-slate-200 hover:bg-emerald-50">
                    {c.name}
                    <span className="text-xs text-slate-500">({t("cityCount", { count: c.count })})</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
      {suggestions?.popular.length ? (
        <div>
          <h2 className="text-lg font-bold">{t("popularForTrip")}</h2>
          <ul className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-4" data-testid="stays-empty-popular">
            {suggestions.popular.map((c) => (
              <li key={c.id}>
                <PropertyCardView card={c} saved={savedIds.has(c.id)} query={cardQuery} />
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}

type FilterDraft = Pick<
  StaySearch,
  "kinds" | "stars" | "amenities" | "minPrice" | "maxPrice" | "minRating" | "freeCancellation" | "instantOnly" | "accessible" | "availableOnly" | "breakfast"
>;

const GROUP_ORDER = ["general", "room", "food", "wellness", "family", "medical", "accessibility", "business", "bathroom", "outdoor"];

function FiltersSheet({
  open,
  onOpenChange,
  search,
  amenities,
  side,
  onApply,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  search: StaySearch;
  amenities: Amenity[];
  side: "left" | "right";
  onApply: (patch: FilterDraft) => void;
}) {
  const t = useTranslations("StayApp.explore");
  const tKinds = useTranslations("StayApp.kinds");
  const locale = useLocale();
  const initial: FilterDraft = {
    kinds: search.kinds,
    stars: search.stars,
    amenities: search.amenities,
    minPrice: search.minPrice,
    maxPrice: search.maxPrice,
    minRating: search.minRating,
    freeCancellation: search.freeCancellation,
    instantOnly: search.instantOnly,
    accessible: search.accessible,
    availableOnly: search.availableOnly,
    breakfast: search.breakfast,
  };
  const [d, setD] = useState<FilterDraft>(initial);
  const toggle = <K extends "kinds" | "stars" | "amenities">(key: K, v: FilterDraft[K][number]) =>
    setD((x) => ({ ...x, [key]: (x[key] as unknown[]).includes(v) ? (x[key] as unknown[]).filter((y) => y !== v) : [...(x[key] as unknown[]), v] }));
  const chip = (on: boolean) => cn("min-h-10 rounded-full px-3 text-sm ring-1", on ? "bg-emerald-700 text-white ring-emerald-700" : "bg-white text-slate-800 ring-slate-300 hover:bg-slate-50");
  const groups = GROUP_ORDER.map((g) => ({ g, items: amenities.filter((a) => a.group === g) })).filter((x) => x.items.length);
  return (
    <Sheet
      open={open}
      onOpenChange={(v) => {
        if (v) setD(initial);
        onOpenChange(v);
      }}
    >
      <SheetContent side={side} className="flex w-full flex-col sm:max-w-md" data-testid="stays-filters-sheet">
        <SheetHeader className="pe-12">
          <SheetTitle>{t("filters")}</SheetTitle>
          <SheetDescription>{t("filtersHelp")}</SheetDescription>
        </SheetHeader>
        <div className="flex-1 space-y-6 overflow-y-auto px-4 pb-4">
          <fieldset>
            <legend className="text-sm font-bold">{t("price")}</legend>
            <p className="text-xs text-slate-500">{t("priceHint")}</p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <label className="text-xs text-slate-600">
                {t("minPrice")}
                <input
                  inputMode="numeric"
                  value={d.minPrice ?? ""}
                  onChange={(e) => setD((x) => ({ ...x, minPrice: Number(toLatin(e.target.value).replace(/\D/g, "")) || null }))}
                  className="mt-1 min-h-11 w-full rounded-xl border border-slate-300 px-3 text-sm"
                  data-testid="stays-min-price"
                />
                {d.minPrice ? <span className="mt-1 block text-[11px] text-slate-500">{formatMoney(d.minPrice, "IRR", locale)}</span> : null}
              </label>
              <label className="text-xs text-slate-600">
                {t("maxPrice")}
                <input
                  inputMode="numeric"
                  value={d.maxPrice ?? ""}
                  onChange={(e) => setD((x) => ({ ...x, maxPrice: Number(toLatin(e.target.value).replace(/\D/g, "")) || null }))}
                  className="mt-1 min-h-11 w-full rounded-xl border border-slate-300 px-3 text-sm"
                  data-testid="stays-max-price"
                />
                {d.maxPrice ? <span className="mt-1 block text-[11px] text-slate-500">{formatMoney(d.maxPrice, "IRR", locale)}</span> : null}
              </label>
            </div>
            {d.minPrice && d.maxPrice && d.minPrice > d.maxPrice ? (
              <p role="alert" className="mt-1 text-xs font-medium text-red-700" data-testid="stays-price-error">
                {t("priceOrder")}
              </p>
            ) : null}
          </fieldset>
          <fieldset className="space-y-2">
            <legend className="text-sm font-bold">{t("more")}</legend>
            {(
              [
                ["availableOnly", t("availableOnly")],
                ["freeCancellation", t("freeCancellation")],
                ["breakfast", t("breakfast")],
                ["instantOnly", t("instantOnly")],
                ["accessible", t("accessible")],
              ] as const
            ).map(([key, label]) => (
              <label key={key} className="flex min-h-11 items-center justify-between gap-3 text-sm">
                {label}
                <input type="checkbox" checked={d[key]} onChange={(e) => setD((x) => ({ ...x, [key]: e.target.checked }))} className="size-5 accent-emerald-700" data-testid={`stays-filter-${key}`} />
              </label>
            ))}
          </fieldset>
          <fieldset>
            <legend className="text-sm font-bold">{t("type")}</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {PROPERTY_KINDS.map((k) => (
                <button key={k} type="button" aria-pressed={d.kinds.includes(k)} onClick={() => toggle("kinds", k)} className={chip(d.kinds.includes(k))} data-testid={`stays-filter-kind-${k}`}>
                  {tKinds(k)}
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend className="text-sm font-bold">{t("stars")}</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {[5, 4, 3, 2, 1].map((s) => (
                <button key={s} type="button" aria-pressed={d.stars.includes(s)} onClick={() => toggle("stars", s)} className={chip(d.stars.includes(s))}>
                  {t("starsValue", { count: s })}
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend className="text-sm font-bold">{t("rating")}</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {[4.5, 4, 3.5, 3].map((r) => (
                <button key={r} type="button" aria-pressed={d.minRating === r} onClick={() => setD((x) => ({ ...x, minRating: x.minRating === r ? null : r }))} className={chip(d.minRating === r)}>
                  {t("ratingValue", { value: r })}
                </button>
              ))}
            </div>
          </fieldset>
          {groups.map(({ g, items }) => (
            <fieldset key={g}>
              <legend className="text-sm font-bold">{t(`amenityGroups.${g}` as "amenityGroups.general")}</legend>
              <div className="mt-2 flex flex-wrap gap-2">
                {items.map((a) => (
                  <button key={a.code} type="button" aria-pressed={d.amenities.includes(a.code)} onClick={() => toggle("amenities", a.code)} className={chip(d.amenities.includes(a.code))} data-testid={`stays-filter-amenity-${a.code}`}>
                    {a.label}
                  </button>
                ))}
              </div>
            </fieldset>
          ))}
        </div>
        <SheetFooter className="flex-row gap-2 border-t border-slate-100 p-4">
          <button
            type="button"
            onClick={() =>
              setD({ kinds: [], stars: [], amenities: [], minPrice: null, maxPrice: null, minRating: null, freeCancellation: false, instantOnly: false, accessible: false, availableOnly: false, breakfast: false })
            }
            className="min-h-11 flex-1 rounded-full text-sm font-semibold ring-1 ring-slate-300"
          >
            {t("reset")}
          </button>
          <button
            type="button"
            disabled={Boolean(d.minPrice && d.maxPrice && d.minPrice > d.maxPrice)}
            onClick={() => onApply(d)}
            className="min-h-11 flex-[2] rounded-full bg-emerald-700 text-sm font-bold text-white disabled:opacity-50"
            data-testid="stays-filters-apply"
          >
            {t("apply")}
          </button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

/** Persian/Arabic-Indic digits typed on a phone keyboard → Latin, so prices parse. */
function toLatin(v: string) {
  return v.replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0)).replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660));
}
