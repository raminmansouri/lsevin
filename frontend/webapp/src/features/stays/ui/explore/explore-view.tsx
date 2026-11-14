"use client";

import { useMemo, useState, useTransition } from "react";
import { List, Map as MapIcon, SlidersHorizontal, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { directionOf } from "@/features/tours/domain/content";
import { TourMap } from "@/features/tours/ui/shared/tour-map";
import { usePathname, useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

import { activeFilterCount, PROPERTY_KINDS, SORTS, stayQueryOnly, toSearchParams, type StaySearch } from "../../domain/search";
import type { Amenity, SearchResult } from "../../types";
import { PropertyCardView } from "../property-card";
import { StaySearchForm, type CityOption } from "../search/search-form";

export function ExploreView({
  search,
  result,
  cities,
  amenities,
  savedIds,
  heading,
  basePath = "/stays/explore",
  lockedCity,
}: {
  search: StaySearch;
  result: SearchResult | null;
  cities: CityOption[];
  amenities: Amenity[];
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
  const saved = useMemo(() => new Set(savedIds), [savedIds]);
  const filters = activeFilterCount(search);
  const pages = result ? Math.max(1, Math.ceil(result.total / result.pageSize)) : 1;
  const cardQuery = stayQueryOnly(search).toString();

  function go(patch: Partial<StaySearch>) {
    const next = { ...search, ...patch, page: patch.page ?? 1 };
    const qs = toSearchParams(next, { omitCity: Boolean(lockedCity) }).toString();
    start(() => router.push(`${basePath}${qs ? `?${qs}` : ""}`, { scroll: true }));
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

  const points = result.items
    .filter((c) => c.latitude != null && c.longitude != null)
    .map((c) => ({ id: c.id, lat: c.latitude!, lng: c.longitude!, label: c.name, kind: "destination" as const, exact: !c.approximate, radiusM: c.approximate ? 1000 : undefined }));

  return (
    <div className="space-y-4 px-4 pt-4 sm:px-6" aria-busy={pending}>
      <div className="rounded-3xl bg-white p-3 ring-1 ring-slate-200">
        <StaySearchForm
          key={`${search.city}-${search.checkIn}-${search.checkOut}-${search.adults}-${search.rooms}-${search.childAges.join(".")}`}
          cities={cities}
          initial={search}
          variant="hero"
          target={lockedCity ? { path: pathname } : "explore"}
        />
      </div>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 md:text-2xl">{heading}</h1>
          <p className="text-sm text-slate-600" aria-live="polite" data-testid="stays-results-count">
            {t("results", { count: result.total })}
            {search.checkIn && search.checkOut && result.items[0]?.nights ? ` ${t("resultsFor", { nights: result.items[0].nights })}` : ""}
          </p>
          {!search.checkIn ? <p className="mt-1 text-xs text-amber-800" data-testid="stays-no-dates-hint">{t("noDatesHint")}</p> : null}
        </div>
        <div className="flex items-center gap-2">
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
            {SORTS.map((s) => (
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
            <button type="button" aria-pressed={view === "map"} onClick={() => setView("map")} data-testid="stays-map-toggle" className={cn("flex min-h-9 items-center gap-1 rounded-full px-3 text-sm", view === "map" && "bg-emerald-700 text-white")}>
              <MapIcon className="size-4" aria-hidden="true" />
              <span className="sr-only sm:not-sr-only">{t("map")}</span>
            </button>
          </div>
        </div>
      </div>

      {filters ? (
        <div className="flex flex-wrap gap-2" data-testid="stays-active-filters">
          <button type="button" onClick={() => go({ kinds: [], stars: [], amenities: [], minPrice: null, maxPrice: null, minRating: null, freeCancellation: false, instantOnly: false, accessible: false, availableOnly: false })} className="inline-flex min-h-9 items-center gap-1 rounded-full bg-slate-900 px-3 text-xs font-semibold text-white" data-testid="stays-filters-reset">
            <X className="size-3.5" aria-hidden="true" />
            {t("reset")}
          </button>
        </div>
      ) : null}

      {view === "map" ? (
        <section aria-label={t("mapTitle")}>
          <TourMap points={points} labels={{ region: t("mapTitle"), unavailable: t("errorText"), approximate: t("mapApproximate") }} height={420} />
          <p className="mt-2 text-xs text-slate-500">{t("mapApproximate")}</p>
        </section>
      ) : null}

      {result.items.length === 0 ? (
        <div className="rounded-2xl bg-white p-8 text-center ring-1 ring-slate-200" data-testid="stays-empty">
          <p className="text-lg font-bold">{t("emptyTitle")}</p>
          <p className="mt-1 text-sm text-slate-600">{t("emptyText")}</p>
          {filters ? (
            <button type="button" onClick={() => go({ kinds: [], stars: [], amenities: [], minPrice: null, maxPrice: null, minRating: null, freeCancellation: false, instantOnly: false, accessible: false, availableOnly: false })} className="mt-4 min-h-11 rounded-full bg-emerald-700 px-5 text-sm font-bold text-white">
              {t("reset")}
            </button>
          ) : null}
        </div>
      ) : (
        <ul className={cn("grid gap-4 sm:grid-cols-2 lg:grid-cols-3", pending && "opacity-60")} data-testid="stays-results">
          {result.items.map((c, i) => (
            <li key={c.id}>
              <PropertyCardView card={c} saved={saved.has(c.id)} query={cardQuery} priority={i < 2} headingLevel={2} />
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
        priceHint={search.checkIn ? t("priceHintTotal") : t("priceHintNightly")}
        onApply={(patch) => {
          setFiltersOpen(false);
          go(patch);
        }}
      />
    </div>
  );
}

type FilterDraft = Pick<StaySearch, "kinds" | "stars" | "amenities" | "minPrice" | "maxPrice" | "minRating" | "freeCancellation" | "instantOnly" | "accessible" | "availableOnly">;

function FiltersSheet({
  open,
  onOpenChange,
  search,
  amenities,
  side,
  priceHint,
  onApply,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  search: StaySearch;
  amenities: Amenity[];
  side: "left" | "right";
  priceHint: string;
  onApply: (patch: FilterDraft) => void;
}) {
  const t = useTranslations("StayApp.explore");
  const tKinds = useTranslations("StayApp.kinds");
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
  };
  const [d, setD] = useState<FilterDraft>(initial);
  const toggle = <K extends "kinds" | "stars" | "amenities">(key: K, v: FilterDraft[K][number]) =>
    setD((x) => ({ ...x, [key]: (x[key] as unknown[]).includes(v) ? (x[key] as unknown[]).filter((y) => y !== v) : [...(x[key] as unknown[]), v] }));
  const chip = (on: boolean) => cn("min-h-10 rounded-full px-3 text-sm ring-1", on ? "bg-emerald-700 text-white ring-emerald-700" : "bg-white text-slate-800 ring-slate-300 hover:bg-slate-50");
  return (
    <Sheet
      open={open}
      onOpenChange={(v) => {
        if (v) setD(initial);
        onOpenChange(v);
      }}
    >
      <SheetContent side={side} className="flex w-full flex-col sm:max-w-md" data-testid="stays-filters-sheet">
        <SheetHeader>
          <SheetTitle>{t("filters")}</SheetTitle>
          <SheetDescription className="sr-only">{t("filters")}</SheetDescription>
        </SheetHeader>
        <div className="flex-1 space-y-6 overflow-y-auto px-4 pb-4">
          <fieldset>
            <legend className="text-sm font-bold">{t("price")}</legend>
            <p className="text-xs text-slate-500">{priceHint}</p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <label className="text-xs text-slate-600">
                {t("minPrice")}
                <input inputMode="numeric" value={d.minPrice ?? ""} onChange={(e) => setD((x) => ({ ...x, minPrice: Number(e.target.value.replace(/\D/g, "")) || null }))} className="mt-1 min-h-11 w-full rounded-xl border border-slate-300 px-3 text-sm" data-testid="stays-min-price" />
              </label>
              <label className="text-xs text-slate-600">
                {t("maxPrice")}
                <input inputMode="numeric" value={d.maxPrice ?? ""} onChange={(e) => setD((x) => ({ ...x, maxPrice: Number(e.target.value.replace(/\D/g, "")) || null }))} className="mt-1 min-h-11 w-full rounded-xl border border-slate-300 px-3 text-sm" data-testid="stays-max-price" />
              </label>
            </div>
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
          <fieldset className="space-y-2">
            <legend className="text-sm font-bold">{t("more")}</legend>
            {(
              [
                ["freeCancellation", t("freeCancellation")],
                ["instantOnly", t("instantOnly")],
                ["accessible", t("accessible")],
                ["availableOnly", t("availableOnly")],
              ] as const
            ).map(([key, label]) => (
              <label key={key} className="flex min-h-11 items-center justify-between gap-3 text-sm">
                {label}
                <input type="checkbox" checked={d[key]} onChange={(e) => setD((x) => ({ ...x, [key]: e.target.checked }))} className="size-5 accent-emerald-700" data-testid={`stays-filter-${key}`} />
              </label>
            ))}
          </fieldset>
          <fieldset>
            <legend className="text-sm font-bold">{t("amenities")}</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {amenities.map((a) => (
                <button key={a.code} type="button" aria-pressed={d.amenities.includes(a.code)} onClick={() => toggle("amenities", a.code)} className={chip(d.amenities.includes(a.code))} data-testid={`stays-filter-amenity-${a.code}`}>
                  {a.label}
                </button>
              ))}
            </div>
          </fieldset>
        </div>
        <SheetFooter className="flex-row gap-2 border-t border-slate-100 p-4">
          <button type="button" onClick={() => setD({ kinds: [], stars: [], amenities: [], minPrice: null, maxPrice: null, minRating: null, freeCancellation: false, instantOnly: false, accessible: false, availableOnly: false })} className="min-h-11 flex-1 rounded-full text-sm font-semibold ring-1 ring-slate-300">
            {t("reset")}
          </button>
          <button type="button" onClick={() => onApply(d)} className="min-h-11 flex-[2] rounded-full bg-emerald-700 text-sm font-bold text-white" data-testid="stays-filters-apply">
            {t("apply")}
          </button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
