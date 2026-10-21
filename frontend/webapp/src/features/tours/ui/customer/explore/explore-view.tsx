"use client";

import { useEffect, useId, useMemo, useState, useTransition } from "react";
import { ChevronLeft, ChevronRight, History, List, LocateFixed, Map as MapIcon, Search, SlidersHorizontal, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Link, useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

import { directionOf } from "../../../domain/content";
import { clearRecentSearchesAction, recordSearchAction } from "../../../server/actions/customer";
import type { TaxonomyTerm } from "../../../server/actions/customer/state";
import type { DestinationCard, TourCard as TourCardData, TourSearch } from "../../../server/platform/catalog";
import { CalendarPicker } from "../../shared/calendar-picker";
import { CalendarSwitcher } from "../../shared/calendar-switcher";
import { formatNumber, languageName } from "../../shared/format";
import { TourMap } from "../../shared/tour-map";
import { TourDate } from "../common";
import { useToursPrefs } from "../prefs-context";
import { TourCard } from "../tour-card";

const SORTS = ["relevance", "price_asc", "price_desc", "start_date", "duration", "popularity", "rating"] as const;
/** URL keys that are filters (not sort/page/view) — same contract as catalog.searchToParams. */
const FILTER_KEYS = [
  "destination", "category", "from", "to", "party", "minPrice", "maxPrice", "minDays", "maxDays", "startAfter", "startBefore",
  "lang", "difficulty", "accessible", "family", "lowMobility", "recovery", "private", "instant", "minRating", "transport", "all",
] as const;

type Draft = Record<string, string>;

function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const s = Math.sin(dLat / 2) ** 2 + Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

export function ExploreView({
  params,
  search,
  results,
  destinations,
  taxonomy,
  recentSearches,
  savedIds,
  guideLanguages,
  openFilters,
  view,
}: {
  params: string;
  search: TourSearch;
  results: { items: TourCardData[]; total: number; page: number; pageSize: number };
  destinations: DestinationCard[];
  taxonomy: Record<string, TaxonomyTerm[]>;
  recentSearches: { id: string; query: string; filters: Record<string, string> }[];
  savedIds: string[];
  guideLanguages: string[];
  openFilters: boolean;
  view: "list" | "map";
}) {
  const t = useTranslations("TourApp.explore");
  const tc = useTranslations("TourApp");
  const locale = useLocale();
  const router = useRouter();
  const prefs = useToursPrefs();
  const rtl = directionOf(locale) === "rtl";
  const [pending, start] = useTransition();
  const [q, setQ] = useState(search.q ?? "");
  const [sheetOpen, setSheetOpen] = useState(openFilters);
  const current = useMemo(() => Object.fromEntries(new URLSearchParams(params).entries()) as Draft, [params]);
  const [draft, setDraft] = useState<Draft>(current);
  const [recent, setRecent] = useState(recentSearches);
  const [geo, setGeo] = useState<{ state: "idle" | "asking" | "on" | "denied" | "error"; pos?: { lat: number; lng: number } }>({ state: "idle" });
  const saved = new Set(savedIds);
  const sortId = useId();

  // Keep the local search box in sync with back/forward navigation.
  useEffect(() => {
    setQ(search.q ?? "");
    setDraft(current);
  }, [search.q, current]);

  // Remember meaningful searches (C-030); sort/page changes alone are not searches.
  const filterSignature = useMemo(() => {
    const f: Record<string, string> = {};
    for (const k of FILTER_KEYS) if (current[k]) f[k] = current[k];
    return JSON.stringify({ q: current.q ?? "", f });
  }, [current]);
  useEffect(() => {
    const { q: query, f } = JSON.parse(filterSignature) as { q: string; f: Record<string, string> };
    if (!query && Object.keys(f).length === 0) return;
    void recordSearchAction(query, f).catch(() => undefined);
  }, [filterSignature]);

  function href(next: Draft, opts: { keepView?: boolean } = {}) {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries(next)) if (v !== undefined && v !== null && v !== "") p.set(k, v);
    if (opts.keepView !== false && view === "map") p.set("view", "map");
    const s = p.toString();
    return s ? `/tours/explore?${s}` : "/tours/explore";
  }
  function go(next: Draft) {
    start(() => router.push(href(next)));
  }
  function withChange(patch: Draft, resetPage = true): Draft {
    const next = { ...current, ...patch };
    if (resetPage) delete next.page;
    for (const k of Object.keys(next)) if (!next[k]) delete next[k];
    return next;
  }

  const activeCount = FILTER_KEYS.filter((k) => k !== "category" && current[k]).length;
  const pages = Math.max(1, Math.ceil(results.total / results.pageSize));
  const showingUnavailable = current.all === "1";
  const dateFiltered = Boolean(current.from || current.to || current.party || current.startAfter || current.startBefore);

  const destBySlug = useMemo(() => new Map(destinations.map((d) => [d.slug, d])), [destinations]);
  const items = useMemo(() => {
    if (geo.state !== "on" || !geo.pos) return results.items.map((c) => ({ card: c, km: null as number | null }));
    return results.items
      .map((c) => {
        const d = c.destination ? destBySlug.get(c.destination.slug) : undefined;
        const km = d?.latitude != null && d.longitude != null ? haversineKm(geo.pos!, { lat: d.latitude, lng: d.longitude }) : null;
        return { card: c, km };
      })
      .sort((a, b) => (a.km ?? Infinity) - (b.km ?? Infinity));
  }, [results.items, geo, destBySlug]);

  function askLocation() {
    if (!("geolocation" in navigator)) {
      setGeo({ state: "error" });
      return;
    }
    setGeo({ state: "asking" });
    navigator.geolocation.getCurrentPosition(
      (p) => setGeo({ state: "on", pos: { lat: p.coords.latitude, lng: p.coords.longitude } }),
      (err) => setGeo({ state: err.code === err.PERMISSION_DENIED ? "denied" : "error" }),
      { maximumAge: 600_000, timeout: 10_000 },
    );
  }

  const mapPoints = useMemo(() => {
    const counts = new Map<string, number>();
    for (const c of results.items) if (c.destination) counts.set(c.destination.slug, (counts.get(c.destination.slug) ?? 0) + 1);
    return [...counts.entries()]
      .map(([slug, n]) => {
        const d = destBySlug.get(slug);
        if (!d || d.latitude == null || d.longitude == null) return null;
        return { id: slug, lat: d.latitude, lng: d.longitude, label: `${d.name?.value ?? slug} (${n})`, kind: "destination" as const, order: n, exact: true };
      })
      .filter((p): p is NonNullable<typeof p> => Boolean(p));
  }, [results.items, destBySlug]);

  const Prev = rtl ? ChevronRight : ChevronLeft;
  const Next = rtl ? ChevronLeft : ChevronRight;
  const categories = taxonomy.category ?? [];

  return (
    <div className="px-4 pt-4 sm:px-6" data-testid="explore">
      <h1 className="text-2xl font-bold text-slate-900">{t("title")}</h1>

      <form
        role="search"
        className="mt-3 flex items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          go(withChange({ q: q.trim() }));
        }}
      >
        <div className="flex min-w-0 flex-1 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 shadow-sm focus-within:ring-2 focus-within:ring-emerald-600">
          <Search className="size-5 shrink-0 text-slate-400" aria-hidden="true" />
          <label htmlFor="explore-q" className="sr-only">
            {t("searchLabel")}
          </label>
          <input
            id="explore-q"
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("searchPlaceholder")}
            enterKeyHint="search"
            className="min-h-12 min-w-0 flex-1 bg-transparent text-[15px] outline-none"
          />
        </div>
        <button type="submit" className="min-h-12 rounded-2xl bg-emerald-700 px-4 text-sm font-semibold text-white hover:bg-emerald-800 focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 focus-visible:outline-none">
          {t("search")}
        </button>
        <button
          type="button"
          onClick={() => {
            setDraft(current);
            setSheetOpen(true);
          }}
          aria-label={activeCount ? `${t("filters")} (${t("activeFilters", { count: activeCount })})` : t("filters")}
          data-testid="open-filters"
          className="relative flex size-12 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:outline-none"
        >
          <SlidersHorizontal className="size-5" aria-hidden="true" />
          {activeCount ? (
            <span className="absolute -end-1 -top-1 flex size-5 items-center justify-center rounded-full bg-emerald-700 text-[11px] font-bold text-white">
              {formatNumber(activeCount, locale)}
            </span>
          ) : null}
        </button>
      </form>

      {categories.length > 0 ? (
        <nav aria-label={t("categories")} className="-mx-4 mt-3 sm:-mx-6">
          <ul className="flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:px-6">
            <li className="shrink-0">
              <Link
                href={href(withChange({ category: "" }))}
                aria-current={!current.category ? "true" : undefined}
                className={cn(
                  "flex min-h-11 items-center rounded-full px-4 text-sm font-medium focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:outline-none",
                  !current.category ? "bg-slate-900 text-white" : "border border-slate-200 bg-white text-slate-700",
                )}
              >
                {t("all")}
              </Link>
            </li>
            {categories.map((c) => (
              <li key={c.code} className="shrink-0">
                <Link
                  href={href(withChange({ category: c.code }))}
                  aria-current={current.category === c.code ? "true" : undefined}
                  data-testid={`category-chip-${c.code}`}
                  className={cn(
                    "flex min-h-11 items-center rounded-full px-4 text-sm font-medium focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:outline-none",
                    current.category === c.code ? "bg-slate-900 text-white" : "border border-slate-200 bg-white text-slate-700",
                  )}
                >
                  {c.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}

      {recent.length > 0 && !current.q && activeCount === 0 ? (
        <section aria-labelledby="recent-searches" className="mt-4">
          <div className="flex items-center justify-between">
            <h2 id="recent-searches" className="flex items-center gap-1.5 text-sm font-semibold text-slate-700">
              <History className="size-4" aria-hidden="true" />
              {t("recentSearches")}
            </h2>
            <button
              type="button"
              data-testid="clear-recent-searches"
              onClick={() => {
                setRecent([]);
                void clearRecentSearchesAction();
              }}
              className="min-h-11 rounded-full px-3 text-sm font-medium text-slate-600 hover:bg-slate-100"
            >
              {t("clearRecentSearches")}
            </button>
          </div>
          <ul className="mt-1 flex flex-wrap gap-2">
            {recent.map((r) => (
              <li key={r.id}>
                <Link
                  href={href({ ...(r.query ? { q: r.query } : {}), ...r.filters }, { keepView: false })}
                  className="flex min-h-11 items-center rounded-full bg-white px-3 text-sm text-slate-700 ring-1 ring-slate-200 hover:ring-emerald-300"
                >
                  {[r.query, ...Object.values(r.filters)].filter(Boolean).join(" · ") || "—"}
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-1 text-xs text-slate-500">{t("recentRetention")}</p>
        </section>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium text-slate-700" aria-live="polite" data-testid="results-count">
          {t("results", { count: results.total })}
        </p>
        <div className="flex items-center gap-2">
          <label htmlFor={sortId} className="sr-only">
            {t("sort")}
          </label>
          <select
            id={sortId}
            value={current.sort ?? "relevance"}
            data-testid="sort-select"
            onChange={(e) => go(withChange({ sort: e.target.value === "relevance" ? "" : e.target.value }))}
            className="min-h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:outline-none"
          >
            {SORTS.map((s) => (
              <option key={s} value={s}>
                {t(`sortOptions.${s}`)}
              </option>
            ))}
          </select>
          <div role="group" aria-label={`${t("listView")} / ${t("mapView")}`} className="flex rounded-xl border border-slate-200 bg-white p-0.5">
            <Link
              href={href(current, { keepView: false })}
              aria-current={view === "list" ? "true" : undefined}
              className={cn("flex min-h-10 items-center gap-1 rounded-lg px-2.5 text-sm", view === "list" ? "bg-emerald-50 font-semibold text-emerald-800" : "text-slate-600")}
            >
              <List className="size-4" aria-hidden="true" />
              {t("listView")}
            </Link>
            <Link
              href={`${href(current, { keepView: false })}${Object.keys(current).length ? "&" : "?"}view=map`}
              aria-current={view === "map" ? "true" : undefined}
              data-testid="map-view"
              className={cn("flex min-h-10 items-center gap-1 rounded-lg px-2.5 text-sm", view === "map" ? "bg-emerald-50 font-semibold text-emerald-800" : "text-slate-600")}
            >
              <MapIcon className="size-4" aria-hidden="true" />
              {t("mapView")}
            </Link>
          </div>
        </div>
      </div>

      {dateFiltered && !showingUnavailable ? (
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-xs text-emerald-900">
          <span>{t("availabilityNote")}</span>
          <Link href={href(withChange({ all: "1" }))} className="min-h-11 content-center font-semibold underline underline-offset-2" data-testid="show-unavailable">
            {t("showUnavailable")}
          </Link>
        </div>
      ) : null}

      <div className="mt-3">
        {geo.state === "idle" || geo.state === "asking" ? (
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
            <button
              type="button"
              onClick={askLocation}
              disabled={geo.state === "asking"}
              data-testid="nearby"
              className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:outline-none"
            >
              <LocateFixed className="size-4" aria-hidden="true" />
              {t("nearbyAllow")}
            </button>
            <span>{t("nearbyExplain")}</span>
          </div>
        ) : (
          <p role="status" className="text-xs text-slate-600" data-testid="nearby-status">
            {geo.state === "on" ? t("nearbyActive") : geo.state === "denied" ? t("nearbyDenied") : t("nearbyUnavailable")}
          </p>
        )}
      </div>

      {view === "map" ? (
        <div className="mt-3">
          <TourMap
            points={mapPoints}
            labels={{ region: t("mapView"), unavailable: t("mapUnavailable"), approximate: tc("detail.itinerary.approximate") }}
            height={320}
          />
        </div>
      ) : null}

      <div className={cn("mt-4", pending && "opacity-60 transition-opacity")} aria-busy={pending}>
        {results.items.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center" data-testid="no-results">
            <h2 className="text-lg font-bold text-slate-900">{t("noResults")}</h2>
            <p className="mt-2 text-sm text-slate-600">{t("noResultsHint")}</p>
            {activeCount > 0 || current.q ? (
              <Link href="/tours/explore" className="mt-4 inline-flex min-h-11 items-center rounded-full bg-emerald-700 px-5 text-sm font-semibold text-white">
                {t("clearFilters")}
              </Link>
            ) : null}
          </div>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" data-testid="results">
            {items.map(({ card, km }) => (
              <li key={card.id}>
                <TourCard card={card} saved={saved.has(card.id)} distanceKm={km} />
              </li>
            ))}
          </ul>
        )}
      </div>

      {pages > 1 ? (
        <nav aria-label={t("pagination")} className="mt-6 flex items-center justify-center gap-3">
          {results.page > 1 ? (
            <Link href={href(withChange({ page: results.page - 1 > 1 ? String(results.page - 1) : "" }, false))} className="flex size-11 items-center justify-center rounded-full border bg-white" aria-label={t("prev")}>
              <Prev className="size-5" aria-hidden="true" />
            </Link>
          ) : null}
          <span className="text-sm text-slate-600">{t("page", { page: formatNumber(results.page, locale), pages: formatNumber(pages, locale) })}</span>
          {results.page < pages ? (
            <Link href={href(withChange({ page: String(results.page + 1) }, false))} className="flex size-11 items-center justify-center rounded-full border bg-white" aria-label={t("next")} data-testid="next-page">
              <Next className="size-5" aria-hidden="true" />
            </Link>
          ) : null}
        </nav>
      ) : null}

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="bottom" className="max-h-[92dvh] overflow-y-auto rounded-t-3xl">
          <SheetHeader>
            <SheetTitle>{t("filtersTitle")}</SheetTitle>
            <SheetDescription className="sr-only">{t("availabilityNote")}</SheetDescription>
          </SheetHeader>
          <FiltersForm draft={draft} setDraft={setDraft} destinations={destinations} taxonomy={taxonomy} guideLanguages={guideLanguages} calendar={prefs.calendar} onCalendar={(c) => void prefs.setCalendar(c)} />
          <SheetFooter className="sticky bottom-0 flex-row gap-2 border-t bg-white">
            <button
              type="button"
              onClick={() => setDraft(current.q ? { q: current.q } : {})}
              className="min-h-12 flex-1 rounded-xl border border-slate-300 text-sm font-semibold text-slate-700"
            >
              {t("reset")}
            </button>
            <button
              type="button"
              data-testid="apply-filters"
              onClick={() => {
                setSheetOpen(false);
                const next: Draft = {};
                for (const [k, v] of Object.entries(draft) as [string, string][]) if (v) next[k] = v;
                delete next.page;
                go(next);
              }}
              className="min-h-12 flex-[2] rounded-xl bg-emerald-700 text-sm font-semibold text-white hover:bg-emerald-800"
            >
              {t("apply")}
            </button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function Field({ label, children, htmlFor }: { label: string; children: React.ReactNode; htmlFor?: string }) {
  return (
    <div className="space-y-1.5">
      {htmlFor ? (
        <label htmlFor={htmlFor} className="text-sm font-semibold text-slate-800">
          {label}
        </label>
      ) : (
        <span className="text-sm font-semibold text-slate-800">{label}</span>
      )}
      {children}
    </div>
  );
}

const inputCls = "min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:outline-none";

function FiltersForm({
  draft,
  setDraft,
  destinations,
  taxonomy,
  guideLanguages,
  calendar,
  onCalendar,
}: {
  draft: Draft;
  setDraft: (d: Draft) => void;
  destinations: DestinationCard[];
  taxonomy: Record<string, TaxonomyTerm[]>;
  guideLanguages: string[];
  calendar: import("../../../domain/calendar").CalendarId;
  onCalendar: (c: import("../../../domain/calendar").CalendarId) => void;
}) {
  const t = useTranslations("TourApp.explore.fields");
  const tb = useTranslations("TourApp.booking");
  const locale = useLocale();
  const ids = useId();
  const set = (k: string, v: string) => {
    const next = { ...draft, [k]: v };
    if (!v) delete next[k];
    setDraft(next);
  };
  const toggle = (k: string) => set(k, draft[k] === "1" ? "" : "1");
  const party = Number(draft.party ?? 0) || 0;

  return (
    <div className="space-y-5 px-4 pb-4">
      <Field label={t("destination")} htmlFor={`${ids}-dest`}>
        <select id={`${ids}-dest`} value={draft.destination ?? ""} onChange={(e) => set("destination", e.target.value)} className={inputCls} data-testid="filter-destination">
          <option value="">{t("anyDestination")}</option>
          {destinations.map((d) => (
            <option key={d.slug} value={d.slug}>
              {d.name?.value ?? d.slug}
            </option>
          ))}
        </select>
      </Field>

      <Field label={t("dates")}>
        <CalendarSwitcher value={calendar} onChange={onCalendar} compact />
        <div className="mt-2 rounded-2xl border border-slate-200 p-3" data-testid="filter-dates">
          <CalendarPicker
            mode="range"
            calendar={calendar}
            locale={locale}
            value={{ from: draft.from ?? null, to: draft.to ?? null }}
            onChange={({ from, to }) => {
              const next = { ...draft };
              if (from) next.from = from;
              else delete next.from;
              if (to) next.to = to;
              else delete next.to;
              setDraft(next);
            }}
            minIso={new Date().toISOString().slice(0, 10)}
            labels={{ previousMonth: tb("previousMonth"), nextMonth: tb("nextMonth"), grid: t("dates"), rangeStart: t("dateFrom"), rangeEnd: t("dateTo") }}
          />
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
            <span data-testid="filter-date-summary">
              {draft.from ? <TourDate iso={draft.from} /> : "—"} → {draft.to ? <TourDate iso={draft.to} /> : "—"}
            </span>
            {draft.from || draft.to ? (
              <button
                type="button"
                className="min-h-11 rounded-full px-3 font-medium text-emerald-700"
                onClick={() => {
                  const next = { ...draft };
                  delete next.from;
                  delete next.to;
                  setDraft(next);
                }}
              >
                <X className="me-1 inline size-3" aria-hidden="true" />
                {t("clearDates")}
              </button>
            ) : null}
          </div>
        </div>
      </Field>

      <Field label={t("party")}>
        <div className="flex items-center gap-3">
          <button type="button" aria-label={`${t("party")} −`} disabled={party <= 0} onClick={() => set("party", party - 1 > 0 ? String(party - 1) : "")} className="flex size-11 items-center justify-center rounded-full border text-lg disabled:opacity-40">
            −
          </button>
          <output aria-live="polite" className="min-w-8 text-center text-base font-semibold" data-testid="filter-party">
            {party ? formatNumber(party, locale) : t("any")}
          </output>
          <button type="button" aria-label={`${t("party")} +`} disabled={party >= 50} onClick={() => set("party", String(party + 1))} className="flex size-11 items-center justify-center rounded-full border text-lg disabled:opacity-40" data-testid="filter-party-inc">
            +
          </button>
        </div>
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label={`${t("budget")} — ${t("minPrice")}`} htmlFor={`${ids}-minp`}>
          <input id={`${ids}-minp`} inputMode="numeric" value={draft.minPrice ?? ""} onChange={(e) => set("minPrice", e.target.value.replace(/[^\d۰-۹٠-٩]/g, ""))} className={inputCls} />
        </Field>
        <Field label={t("maxPrice")} htmlFor={`${ids}-maxp`}>
          <input id={`${ids}-maxp`} inputMode="numeric" value={draft.maxPrice ?? ""} onChange={(e) => set("maxPrice", e.target.value.replace(/[^\d۰-۹٠-٩]/g, ""))} className={inputCls} />
        </Field>
        <Field label={`${t("duration")} — ${t("minDays")}`} htmlFor={`${ids}-mind`}>
          <input id={`${ids}-mind`} type="number" min={1} max={60} value={draft.minDays ?? ""} onChange={(e) => set("minDays", e.target.value)} className={inputCls} />
        </Field>
        <Field label={t("maxDays")} htmlFor={`${ids}-maxd`}>
          <input id={`${ids}-maxd`} type="number" min={1} max={60} value={draft.maxDays ?? ""} onChange={(e) => set("maxDays", e.target.value)} className={inputCls} />
        </Field>
        <Field label={`${t("startTime")} — ${t("startAfter")}`} htmlFor={`${ids}-sa`}>
          <input id={`${ids}-sa`} type="time" value={draft.startAfter ?? ""} onChange={(e) => set("startAfter", e.target.value)} className={inputCls} />
        </Field>
        <Field label={t("startBefore")} htmlFor={`${ids}-sb`}>
          <input id={`${ids}-sb`} type="time" value={draft.startBefore ?? ""} onChange={(e) => set("startBefore", e.target.value)} className={inputCls} />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label={t("guideLanguage")} htmlFor={`${ids}-lang`}>
          <select id={`${ids}-lang`} value={draft.lang ?? ""} onChange={(e) => set("lang", e.target.value)} className={inputCls}>
            <option value="">{t("anyLanguage")}</option>
            {guideLanguages.map((l) => (
              <option key={l} value={l}>
                {languageName(l, locale)}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t("difficulty")} htmlFor={`${ids}-diff`}>
          <select id={`${ids}-diff`} value={draft.difficulty ?? ""} onChange={(e) => set("difficulty", e.target.value)} className={inputCls}>
            <option value="">{t("any")}</option>
            {(taxonomy.difficulty ?? []).map((d) => (
              <option key={d.code} value={d.code}>
                {d.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t("transport")} htmlFor={`${ids}-tr`}>
          <select id={`${ids}-tr`} value={draft.transport ?? ""} onChange={(e) => set("transport", e.target.value)} className={inputCls}>
            <option value="">{t("any")}</option>
            {(taxonomy.transport_mode ?? []).map((d) => (
              <option key={d.code} value={d.code}>
                {d.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t("minRating")} htmlFor={`${ids}-rat`}>
          <select id={`${ids}-rat`} value={draft.minRating ?? ""} onChange={(e) => set("minRating", e.target.value)} className={inputCls}>
            <option value="">{t("any")}</option>
            {[3, 3.5, 4, 4.5].map((r) => (
              <option key={r} value={String(r)}>
                {t("starsAndUp", { rating: formatNumber(r, locale) })}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-semibold text-slate-800">{t("suitability")}</legend>
        {(
          [
            ["accessible", t("accessible")],
            ["family", t("family")],
            ["lowMobility", t("lowMobility")],
            ["recovery", t("recovery")],
            ["private", t("privateOnly")],
            ["instant", t("instantOnly")],
          ] as const
        ).map(([k, label]) => (
          <label key={k} className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl px-1 text-sm text-slate-800">
            <input type="checkbox" checked={draft[k] === "1"} onChange={() => toggle(k)} className="size-5 accent-emerald-700" />
            {label}
          </label>
        ))}
        <p className="text-xs leading-5 text-slate-500">{t("suitabilityNote")}</p>
      </fieldset>
    </div>
  );
}
