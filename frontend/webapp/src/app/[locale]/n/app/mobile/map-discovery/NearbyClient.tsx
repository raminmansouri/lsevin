"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useTransition,
  type TransitionStartFunction,
} from "react";
// Locale-aware router: keeps the active /[locale] prefix on every navigation.
// The plain next/navigation router would push locale-less paths (e.g.
// /n/app/mobile/...), which the middleware then resolves to the default locale,
// silently switching the app to Farsi whenever the map navigates.
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import {
  ChevronLeft,
  MapPin,
  Star,
  BadgeCheck,
  SlidersHorizontal,
  List,
  Navigation,
  X,
  Check,
  DollarSign,
  Award,
  Globe,
  Loader2,
} from "lucide-react";

import NearbyMap from "./NearbyMap";
import { SpecialtyMultiSelect } from "./SpecialtyMultiSelect";
import { resolveMapProvider } from "@/components/map/map-provider";
import { AsyncSearchableSingleSelect } from "@/components/admin/forms/extensions/async-searchable-single-select";
import {
  loadMapDiscoveryLocationByValue,
  loadMapDiscoveryLocationOptions,
} from "./location-options.actions";
import type {
  NearbyCategory,
  NearbyCurrencyOption,
  NearbyFiltersInput,
  NearbyProvider,
} from "./nearby.data";
import FavoriteButton from "../explore/FavoriteButton";
import { ImageWithFallback } from "@/components/ui/image-with-fallback";
import { resolveHomeMediaUrl } from "@/features/home/components/home-media";

// Distance filter bounds (km). The slider runs from MIN to MAX; the far end (MAX)
// means "unlimited" — see UNLIMITED_DISTANCE_KM on the server, which drops the
// radius cap at that value. Keep these aligned with nearby.data.ts.
const MIN_DISTANCE_KM = 1;
const MAX_DISTANCE_KM = 100;
const DEFAULT_DISTANCE_KM = 20;
const isUnlimitedDistance = (km: number) => km >= MAX_DISTANCE_KM;

type FilterFormValues = {
  countryCode: string | null;
  cityCode: string | null;
  maxPrice: number;
  currencyCode: string | null;
  distanceKm: number;
  minRating: number;
  verifiedOnly: boolean;
  languages: string[];
  specialties: string[];
};

type UiFilters = {
  categoryId: string;
  providerTypeId: string;
  countryCode: string | null;
  cityCode: string | null;
  maxPrice: number;
  currencyCode: string | null;
  distanceKm: number;
  minRating: number;
  verifiedOnly: boolean;
  languages: string[];
  specialties: string[];
};

function buildNearbyQuery(next: NearbyFiltersInput, view: "map" | "list" = "map") {
  const params = new URLSearchParams();

  // Every filter change and the location auto-detect rewrite this URL, so the
  // chosen view has to be carried along or the page would snap back to the map
  // mid-browse. Only "list" is written — the map is the default, so its URLs
  // stay clean.
  if (view === "list") params.set("view", "list");

  if (next.q) params.set("q", next.q);
  if (next.categoryId && next.categoryId !== "all")
    params.set("categoryId", next.categoryId);
  if (next.providerTypeId && next.providerTypeId !== "all")
    params.set("providerTypeId", next.providerTypeId);
  if (next.countryCode) params.set("countryCode", next.countryCode);
  if (next.cityCode) params.set("cityCode", next.cityCode);
  if (next.minPrice > 0) params.set("minPrice", String(next.minPrice));
  if (next.maxPrice > 0 && next.maxPrice !== 5000)
    params.set("maxPrice", String(next.maxPrice));
  if (next.currencyCode) params.set("currency", next.currencyCode);
  if (next.distanceKm > 0 && next.distanceKm !== DEFAULT_DISTANCE_KM)
    params.set("distanceKm", String(next.distanceKm));
  if (next.minRating > 0) params.set("minRating", String(next.minRating));
  if (next.verifiedOnly) params.set("verifiedOnly", "1");
  if (next.languages.length > 0)
    params.set("languages", next.languages.join(","));
  if (next.specialties.length > 0)
    params.set("specialties", next.specialties.join(","));
  if (next.lat != null) params.set("lat", String(next.lat));
  if (next.lng != null) params.set("lng", String(next.lng));

  const query = params.toString();
  return query
    ? `/n/app/mobile/map-discovery?${query}`
    : "/n/app/mobile/map-discovery";
}

function navigateSmooth(
  startTransition: TransitionStartFunction,
  router: ReturnType<typeof useRouter>,
  href: string,
) {
  startTransition(() => {
    router.replace(href, { scroll: false });
  });
}

function PendingOverlay() {
  return (
    <div className="pointer-events-none absolute inset-0 z-30 bg-white/45 backdrop-blur-[1px]" />
  );
}

function providerHref(providerId: string) {
  return `/n/app/mobile/provider/${providerId}`;
}

const BARE_UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function firstMediaValue(value?: string | null): string {
  return String(value || "")
    .split(/[،,|]/)
    .map((part) => part.trim().replace(/^[\[\]'"]+|[\]'"]+$/g, "").replace(/\\/g, "/"))
    .find(Boolean) ?? "";
}

function mediaUrl(value?: string | null, fallback = "/placeholder-provider.svg"): string {
  const raw = firstMediaValue(value);

  if (!raw || BARE_UUID_RE.test(raw)) return fallback;

  return resolveHomeMediaUrl(raw) || fallback;
}

function languageLabel(value: string, locale: string): string {
  const normalized = value.trim();
  if (!normalized) return value;

  try {
    const displayNames = new Intl.DisplayNames([locale], { type: "language" });
    return (
      displayNames.of(normalized.split("-")[0].toLowerCase()) ||
      normalized.toUpperCase()
    );
  } catch {
    return normalized.toUpperCase();
  }
}

function fallbackCurrencyOption(): NearbyCurrencyOption {
  return { code: "USD", label: "US Dollar", symbol: "$", count: 0 };
}

// High-accuracy device GPS. enableHighAccuracy asks for the GPS chip (not just
// WiFi/cell triangulation); maximumAge:0 forbids a stale cached fix; a generous
// timeout lets the first GPS lock settle.
const GEO_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 15000,
  maximumAge: 0,
};

// Structured, greppable geolocation logging so raw vs parsed coordinates and the
// resulting accuracy are comparable before/after. Dev-only to avoid prod noise.
function logGeo(event: string, data: Record<string, unknown>) {
  if (process.env.NODE_ENV === "production") return;
  // eslint-disable-next-line no-console
  console.info(`[geo] ${event}`, data);
}

// A raw IP lookup only pinpoints the ISP/datacenter (tens of km off), so it is
// trustworthy enough to center the map and pick a country, but NOT to compute a
// "X km away" distance. Only these sources give a position we trust for distance.
const COARSE_LOCATION_SOURCES = new Set(["ip"]);

function isPreciseLocationSource(source?: string | null): boolean {
  return !COARSE_LOCATION_SOURCES.has(String(source || "").toLowerCase());
}

// The location the visitor already chose on the home page, persisted there.
// Keeping map + home in agreement avoids a second, divergent IP lookup.
const HOME_LOCATION_STORAGE_KEY = "lsevin.home.selected-location.v1";

function readStoredHomeLocation(): {
  lat: number | null;
  lng: number | null;
  countryCode: string | null;
  source: string | null;
} | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(HOME_LOCATION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (!parsed || typeof parsed !== "object") return null;
    const lat =
      typeof parsed.latitude === "number" && Number.isFinite(parsed.latitude)
        ? parsed.latitude
        : null;
    const lng =
      typeof parsed.longitude === "number" && Number.isFinite(parsed.longitude)
        ? parsed.longitude
        : null;
    const countryCode =
      typeof parsed.countryCode === "string" && parsed.countryCode
        ? parsed.countryCode
        : null;
    const source =
      typeof parsed.source === "string" && parsed.source ? parsed.source : null;
    return { lat, lng, countryCode, source };
  } catch {
    return null;
  }
}

export default function NearbyClient({
  locale,
  customerId,
  categories,
  providers,
  availableLanguages,
  availableSpecialties,
  availableCurrencies,
  filters: initialFilters,
  mapCenter,
  expandedBeyondFilters = false,
  initialView = "map",
  activeCategoryLabel = null,
}: {
  locale: string;
  customerId: string | null;
  categories: NearbyCategory[];
  /** Name of the category being browsed; titles the page in place of "Map Discovery". */
  activeCategoryLabel?: string | null;
  providers: NearbyProvider[];
  availableLanguages: string[];
  availableSpecialties: string[];
  availableCurrencies: NearbyCurrencyOption[];
  filters: NearbyFiltersInput;
  mapCenter: { lat: number; lng: number; zoom: number };
  expandedBeyondFilters?: boolean;
  /**
   * Which view to open on. Arriving from a category means "show me what is in
   * this category", so those links ask for the list; the map is one tap away on
   * the header toggle. Landing here directly still opens the map.
   */
  initialView?: "map" | "list";
}) {
  const t = useTranslations("MapDiscovery");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [viewMode, setViewMode] = useState<"map" | "list">(initialView);
  const [selectedProviderId, setSelectedProviderId] = useState<string | null>(
    providers[0]?.id ?? null,
  );
  const [showFilters, setShowFilters] = useState(false);

  // Switching view is instant client state — the providers are already loaded,
  // so routing through the server just to re-render the same data would add a
  // refetch and a flash. But the address bar still has to agree, or a refresh
  // would drop the visitor back into the other view. history.replaceState is
  // supported by the App Router for exactly this: it updates the URL without a
  // server round-trip. replace (not push) so Back returns to where the visitor
  // came from rather than undoing the toggle.
  const toggleViewMode = useCallback(() => {
    const next = viewMode === "map" ? "list" : "map";
    setViewMode(next);

    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    if (next === "list") url.searchParams.set("view", "list");
    else url.searchParams.delete("view");
    window.history.replaceState(null, "", `${url.pathname}${url.search}`);
  }, [viewMode]);

  // Map center + the user's detected country. The server provides an initial
  // center; when the visitor hasn't picked a location we auto-detect theirs
  // (IP-based, no GPS prompt) so the map centers on them and the provider
  // switches automatically: Neshan inside Iran, Mapbox internationally.
  const [center, setCenter] = useState(mapCenter);
  const [detectedCountry, setDetectedCountry] = useState<string | null>(null);
  // The visitor's own position, rendered as a distinct pin on the map.
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(
    initialFilters.lat != null && initialFilters.lng != null
      ? { lat: initialFilters.lat, lng: initialFilters.lng }
      : null,
  );
  // Re-center when the server returns a genuinely new location (e.g. a filter
  // change), but keep the closer zoom the user just got from "locate me": after a
  // GPS navigation the server's mapCenter is the SAME point at a wider zoom, which
  // used to snap the map back out to city level a second after locating.
  useEffect(() => {
    setCenter((prev) =>
      Math.abs(prev.lat - mapCenter.lat) < 1e-4 &&
      Math.abs(prev.lng - mapCenter.lng) < 1e-4
        ? prev
        : mapCenter,
    );
  }, [mapCenter]);

  useEffect(() => {
    // 1) Prefer the location the visitor already chose on the home page.
    const stored = readStoredHomeLocation();
    if (stored && stored.lat != null && stored.lng != null) {
      const precise = isPreciseLocationSource(stored.source);
      logGeo("nearby.stored", {
        lat: stored.lat,
        lng: stored.lng,
        source: stored.source,
        precise,
      });
      setCenter({ lat: stored.lat, lng: stored.lng, zoom: precise ? 12 : 10 });
      if (stored.countryCode) setDetectedCountry(stored.countryCode);

      if (precise) {
        // A trustworthy position (GPS / chosen city): pin it and sort by distance.
        setUserLocation({ lat: stored.lat, lng: stored.lng });
        if (initialFilters.lat == null && initialFilters.lng == null) {
          navigateSmooth(
            startTransition,
            router,
            buildNearbyQuery({ ...initialFilters, lat: stored.lat, lng: stored.lng, distanceKm: DEFAULT_DISTANCE_KM }, viewMode),
          );
        }
      } else if (initialFilters.lat != null || initialFilters.lng != null) {
        // Coarse IP origin leaked into the URL — strip the coords so the server
        // doesn't compute misleading distances; the map still centers via state.
        navigateSmooth(
          startTransition,
          router,
          buildNearbyQuery({ ...initialFilters, lat: null, lng: null }, viewMode),
        );
      }
      return;
    }

    const hasExplicitLocation =
      initialFilters.lat != null ||
      initialFilters.lng != null ||
      initialFilters.countryCode != null ||
      initialFilters.cityCode != null;
    if (hasExplicitLocation) return;

    // 2) Fall back to a best-effort IP lookup (no GPS prompt). IP is only accurate
    //    enough to CENTER the map and pick a country — never to pin the user or
    //    compute distance — so we set neither userLocation nor query coords here.
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/location/client-ip-geo", { cache: "no-store" });
        if (res.status === 204 || !res.ok) return;
        const geo = await res.json();
        if (cancelled || !geo) return;
        if (typeof geo.latitude === "number" && typeof geo.longitude === "number") {
          logGeo("nearby.ip", { lat: geo.latitude, lng: geo.longitude, countryCode: geo.countryCode });
          setCenter({ lat: geo.latitude, lng: geo.longitude, zoom: 10 });
        }
        if (geo.countryCode) setDetectedCountry(String(geo.countryCode));
      } catch {
        // best-effort; fall back to the server-provided center
      }
    })();
    return () => {
      cancelled = true;
    };
    // run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const initialUiFilters = useMemo<UiFilters>(
    () => ({
      categoryId: initialFilters.categoryId ?? "all",
      providerTypeId: initialFilters.providerTypeId ?? "all",
      countryCode: initialFilters.countryCode,
      cityCode: initialFilters.cityCode,
      maxPrice: initialFilters.maxPrice || 5000,
      currencyCode: initialFilters.currencyCode,
      distanceKm: initialFilters.distanceKm || DEFAULT_DISTANCE_KM,
      minRating: initialFilters.minRating || 0,
      verifiedOnly: initialFilters.verifiedOnly,
      languages: initialFilters.languages,
      specialties: initialFilters.specialties,
    }),
    [initialFilters],
  );

  const [uiFilters, setUiFilters] = useState<UiFilters>(initialUiFilters);
  useEffect(() => setUiFilters(initialUiFilters), [initialUiFilters]);
  useEffect(() => {
    if (!providers.some((provider) => provider.id === selectedProviderId)) {
      setSelectedProviderId(providers[0]?.id ?? null);
    }
  }, [providers, selectedProviderId]);

  const form = useForm<FilterFormValues>({
    defaultValues: {
      countryCode: initialUiFilters.countryCode,
      cityCode: initialUiFilters.cityCode,
      maxPrice: initialUiFilters.maxPrice,
      currencyCode: initialUiFilters.currencyCode,
      distanceKm: initialUiFilters.distanceKm,
      minRating: initialUiFilters.minRating,
      verifiedOnly: initialUiFilters.verifiedOnly,
      languages: initialUiFilters.languages,
      specialties: initialUiFilters.specialties,
    },
  });

  useEffect(() => {
    form.reset({
      countryCode: initialUiFilters.countryCode,
      cityCode: initialUiFilters.cityCode,
      maxPrice: initialUiFilters.maxPrice,
      currencyCode: initialUiFilters.currencyCode,
      distanceKm: initialUiFilters.distanceKm,
      minRating: initialUiFilters.minRating,
      verifiedOnly: initialUiFilters.verifiedOnly,
      languages: initialUiFilters.languages,
      specialties: initialUiFilters.specialties,
    });
  }, [form, initialUiFilters]);

  const watched = form.watch();
  const selectedCountryCode = watched.countryCode ?? null;
  const selectedProvider =
    providers.find((provider) => provider.id === selectedProviderId) ?? null;

  // Whether a single category is being browsed. "all" is the unfiltered state,
  // not a category. Drives both the page title and whether the category picker
  // is shown. Deliberately not a lookup in `categories`: that list omits parent
  // categories that have no providers of their own (Beauty, Tourism), and those
  // are reachable from the home page — the name comes from the server instead.
  const isCategoryView = Boolean(
    (uiFilters.categoryId && uiFilters.categoryId !== "all") ||
      (uiFilters.providerTypeId && uiFilters.providerTypeId !== "all"),
  );

  const selectedCurrency = useMemo(() => {
    const selected = availableCurrencies.find(
      (currency) => currency.code === (watched.currencyCode ?? null),
    );
    return selected ?? availableCurrencies[0] ?? fallbackCurrencyOption();
  }, [availableCurrencies, watched.currencyCode]);

  const pricePrefix = watched.currencyCode ? selectedCurrency.symbol : "";

  const loadCountryOptions = useCallback(
    (args: { search: string; page: number; pageSize: number }) =>
      loadMapDiscoveryLocationOptions({
        kind: "country",
        locale,
        search: args.search,
        page: args.page,
        pageSize: args.pageSize,
      }),
    [locale],
  );

  const loadCountryByValue = useCallback(
    (value: string) =>
      loadMapDiscoveryLocationByValue({ kind: "country", locale, value }),
    [locale],
  );

  const loadCityOptions = useCallback(
    (args: { search: string; page: number; pageSize: number }) =>
      loadMapDiscoveryLocationOptions({
        kind: "city",
        locale,
        countryCode: selectedCountryCode,
        search: args.search,
        page: args.page,
        pageSize: args.pageSize,
      }),
    [locale, selectedCountryCode],
  );

  const loadCityByValue = useCallback(
    (value: string) =>
      loadMapDiscoveryLocationByValue({
        kind: "city",
        locale,
        value,
        countryCode: selectedCountryCode,
      }),
    [locale, selectedCountryCode],
  );

  const applyCategory = (categoryId: string) => {
    const nextCategoryId = categoryId === "all" ? "all" : categoryId;
    setUiFilters((prev) => ({ ...prev, categoryId: nextCategoryId }));

    navigateSmooth(
      startTransition,
      router,
      buildNearbyQuery({
        ...initialFilters,
        categoryId: nextCategoryId === "all" ? null : nextCategoryId,
        providerTypeId: uiFilters.providerTypeId === "all" ? null : uiFilters.providerTypeId,
        countryCode: uiFilters.countryCode,
        cityCode: uiFilters.cityCode,
        minPrice: 0,
        maxPrice: uiFilters.maxPrice,
        currencyCode: uiFilters.currencyCode,
        distanceKm: uiFilters.distanceKm,
        minRating: uiFilters.minRating,
        verifiedOnly: uiFilters.verifiedOnly,
        languages: uiFilters.languages,
        specialties: uiFilters.specialties,
      }, viewMode),
    );
  };

  const applyFilters = form.handleSubmit((values) => {
    const nextUi: UiFilters = {
      categoryId: uiFilters.categoryId,
      providerTypeId: uiFilters.providerTypeId,
      countryCode: values.countryCode,
      cityCode: values.cityCode,
      maxPrice: values.maxPrice,
      currencyCode: values.currencyCode,
      distanceKm: values.distanceKm,
      minRating: values.minRating,
      verifiedOnly: values.verifiedOnly,
      languages: values.languages,
      specialties: values.specialties,
    };
    setUiFilters(nextUi);
    setShowFilters(false);
    navigateSmooth(
      startTransition,
      router,
      buildNearbyQuery({
        ...initialFilters,
        categoryId: nextUi.categoryId === "all" ? null : nextUi.categoryId,
        providerTypeId: nextUi.providerTypeId === "all" ? null : nextUi.providerTypeId,
        countryCode: nextUi.countryCode,
        cityCode: nextUi.cityCode,
        minPrice: 0,
        maxPrice: nextUi.maxPrice,
        currencyCode: nextUi.currencyCode,
        distanceKm: nextUi.distanceKm,
        minRating: nextUi.minRating,
        verifiedOnly: nextUi.verifiedOnly,
        languages: nextUi.languages,
        specialties: nextUi.specialties,
      }, viewMode),
    );
  });

  const clearFilters = () => {
    const cleared: UiFilters = {
      categoryId: "all",
      providerTypeId: "all",
      countryCode: null,
      cityCode: null,
      maxPrice: 5000,
      currencyCode: null,
      distanceKm: DEFAULT_DISTANCE_KM,
      minRating: 0,
      verifiedOnly: false,
      languages: [],
      specialties: [],
    };
    form.reset({
      countryCode: null,
      cityCode: null,
      maxPrice: 5000,
      currencyCode: null,
      distanceKm: DEFAULT_DISTANCE_KM,
      minRating: 0,
      verifiedOnly: false,
      languages: [],
      specialties: [],
    });
    setUiFilters(cleared);
    navigateSmooth(
      startTransition,
      router,
      buildNearbyQuery({
        ...initialFilters,
        categoryId: cleared.categoryId === "all" ? null : cleared.categoryId,
        providerTypeId: cleared.providerTypeId === "all" ? null : cleared.providerTypeId,
        countryCode: null,
        cityCode: null,
        minPrice: 0,
        maxPrice: 5000,
        currencyCode: null,
        distanceKm: DEFAULT_DISTANCE_KM,
        minRating: 0,
        verifiedOnly: false,
        languages: [],
        specialties: [],
      }, viewMode),
    );
  };

  const [isLocating, setIsLocating] = useState(false);

  const requestCurrentLocation = () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      logGeo("nearby.gps.unsupported", {});
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLocating(false);
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        logGeo("nearby.gps.success", {
          lat,
          lng,
          accuracyM: Math.round(position.coords.accuracy),
        });
        // A real GPS fix supersedes any coarse IP center and drives distance sort.
        setUserLocation({ lat, lng });
        setCenter({ lat, lng, zoom: 14 });
        navigateSmooth(
          startTransition,
          router,
          buildNearbyQuery({
            ...initialFilters,
            categoryId:
              uiFilters.categoryId === "all" ? null : uiFilters.categoryId,
            providerTypeId: uiFilters.providerTypeId === "all" ? null : uiFilters.providerTypeId,
            countryCode: uiFilters.countryCode,
            cityCode: uiFilters.cityCode,
            minPrice: 0,
            maxPrice: uiFilters.maxPrice,
            currencyCode: uiFilters.currencyCode,
            distanceKm: uiFilters.distanceKm,
            minRating: uiFilters.minRating,
            verifiedOnly: uiFilters.verifiedOnly,
            languages: uiFilters.languages,
            specialties: uiFilters.specialties,
            lat,
            lng,
          }, viewMode),
        );
      },
      (error) => {
        setIsLocating(false);
        // Permission denied / unavailable / timeout: keep the current view rather
        // than snapping the user to a wrong fallback point.
        logGeo("nearby.gps.error", { code: error.code, message: error.message });
      },
      GEO_OPTIONS,
    );
  };

  const activeFilters = {
    countryCode: watched.countryCode ?? null,
    cityCode: watched.cityCode ?? null,
    priceRange: [0, watched.maxPrice ?? 5000] as [number, number],
    currencyCode: watched.currencyCode ?? null,
    distanceKm: watched.distanceKm ?? DEFAULT_DISTANCE_KM,
    minRating: watched.minRating ?? 0,
    verifiedOnly: watched.verifiedOnly ?? false,
    languages: watched.languages ?? [],
    specialties: watched.specialties ?? [],
  };

  const hasActiveFilters =
    uiFilters.categoryId !== "all" ||
    uiFilters.providerTypeId !== "all" ||
    uiFilters.countryCode != null ||
    uiFilters.cityCode != null ||
    uiFilters.currencyCode != null ||
    uiFilters.verifiedOnly ||
    uiFilters.minRating > 0 ||
    uiFilters.languages.length > 0 ||
    uiFilters.specialties.length > 0 ||
    uiFilters.maxPrice !== 5000 ||
    uiFilters.distanceKm !== DEFAULT_DISTANCE_KM;

  // The currently-applied display radius, shown in the hint below the filter
  // button so visitors know where the radius is set and that they can change it.
  const appliedDistanceLabel = isUnlimitedDistance(uiFilters.distanceKm)
    ? t("filters.unlimited")
    : `${uiFilters.distanceKm} km`;

  return (
    <div className="relative min-h-screen bg-white">
      {isPending && <PendingOverlay />}

      <div className="sticky top-0 z-50 bg-white border-b border-gray-100">
        <div className="px-5 pt-3 pb-4">
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => router.back()}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
            >
              <ChevronLeft size={24} className="text-gray-700" />
            </button>

            <div className="flex-1">
              <h1 className="text-xl font-bold text-gray-900">
                {(isCategoryView && activeCategoryLabel) || t("title")}
              </h1>
              <p className="text-sm text-gray-600">
                {t("providersNearby", { count: providers.length })}
              </p>
            </div>

            {/* Arriving from a category lands on the list, so this is how the
                visitor gets to the map. An icon alone did not say that — it
                carries its destination as text. */}
            <button
              onClick={toggleViewMode}
              aria-label={viewMode === "map" ? t("showList") : t("showMap")}
              className="flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-[#083f30] px-3.5 text-sm font-semibold text-white transition-colors hover:bg-[#0a5a44]"
            >
              {viewMode === "map" ? (
                <>
                  <List size={18} />
                  {t("showList")}
                </>
              ) : (
                <>
                  <MapPin size={18} />
                  {t("showMap")}
                </>
              )}
            </button>
          </div>

          {/* Hidden once a category is open: arriving from a category card is a
              request for that category, and a row of every other category is an
              invitation to leave it. The page title names the category instead.
              Without one selected this is the only way to pick, so it stays. */}
          {!isCategoryView && (
          <div className="flex gap-2 overflow-x-auto hide-scrollbar -mx-5 px-5 mb-3">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => applyCategory(cat.id)}
                className={`flex items-center gap-2 rounded-full py-2 text-sm font-medium whitespace-nowrap transition-all ${
                  cat.id !== "all" && cat.image ? "pl-2 pr-4" : "px-4"
                } ${
                  uiFilters.categoryId === cat.id
                    ? "bg-[#083f30] text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {cat.id !== "all" && cat.image ? (
                  <span className="relative h-6 w-6 flex-none overflow-hidden rounded-full bg-white/30">
                    <ImageWithFallback
                      fill
                      src={mediaUrl(cat.image)}
                      alt=""
                      sizes="24px"
                      className="object-cover"
                      fallbackClassName="h-full w-full"
                    />
                  </span>
                ) : null}
                <span>{cat.label}</span>
              </button>
            ))}
          </div>
          )}

          <div className="grid grid-cols-[1fr_auto] gap-2">
            <button
              onClick={() => setShowFilters(true)}
              className="h-10 rounded-xl border border-gray-200 bg-gray-50 px-4 flex items-center justify-center gap-2 transition-colors hover:bg-gray-100"
            >
              <SlidersHorizontal size={18} className="text-gray-700" />
              <span className="text-sm font-medium text-gray-700">
                {t("advancedFilters")}
              </span>
              {hasActiveFilters && (
                <span className="h-2 w-2 rounded-full bg-[#083f30]" />
              )}
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowFilters(true)}
            className="mt-2 flex w-full items-center gap-2 rounded-xl bg-[#083f30]/5 px-3 py-2 text-start transition-colors hover:bg-[#083f30]/10"
          >
            <MapPin size={16} className="shrink-0 text-[#083f30]" />
            <span className="text-xs leading-snug text-[#083f30]">
              {t("distanceHint", { distance: appliedDistanceLabel })}
            </span>
          </button>
        </div>
      </div>

      {viewMode === "map" ? (
        <>
          <NearbyMap
            providers={providers}
            selectedProvider={selectedProvider}
            onSelectProvider={setSelectedProviderId}
            center={center}
            userLocation={userLocation}
            countryCode={uiFilters.countryCode ?? detectedCountry}
          />

          <button
            onClick={requestCurrentLocation}
            disabled={isLocating}
            aria-label={t("useMyLocation")}
            className={`absolute right-4 z-30 w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all border border-gray-200 hover:bg-gray-50 disabled:opacity-70 ${
              selectedProvider
                ? "bottom-56"
                : "bottom-[calc(env(safe-area-inset-bottom)_+_5.5rem)]"
            }`}
          >
            {isLocating ? (
              <Loader2 size={20} className="text-[#083f30] animate-spin" />
            ) : (
              <Navigation size={20} className="text-[#083f30]" />
            )}
          </button>

          <div className="absolute bottom-[calc(env(safe-area-inset-bottom)_+_5.5rem)] left-2 text-xs text-gray-500 bg-white/80 px-2 py-1 rounded z-20">
            {t(
              resolveMapProvider({
                countryCode: uiFilters.countryCode ?? detectedCountry,
                coordinates: { latitude: center.lat, longitude: center.lng },
              }) === "mapbox"
                ? "mapProviders.mapboxMap"
                : "mapProviders.neshanMap",
            )}
          </div>

          {selectedProvider && (
            <div className="absolute bottom-24 left-0 right-0 px-5 z-40">
              <div
                onClick={() => router.push(providerHref(selectedProvider.id))}
                className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden cursor-pointer"
              >
                <div className="flex gap-4 p-4">
                  <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl bg-gray-100">
                    <ImageWithFallback
                      fill
                      src={mediaUrl(selectedProvider.image)}
                      alt={selectedProvider.name}
                      sizes="80px"
                      className="object-cover"
                      fallbackClassName="h-full w-full"
                    />
                    {selectedProvider.verified && (
                      <div className="absolute -bottom-1.5 -right-1.5 w-6 h-6 bg-[#083f30] rounded-full flex items-center justify-center shadow-lg">
                        <BadgeCheck size={14} className="text-[#eacb7f]" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 mb-1 line-clamp-1">
                      {selectedProvider.name}
                    </h3>
                    <div className="flex items-center gap-1.5 mb-2">
                      <MapPin size={14} className="text-gray-400" />
                      <span className="text-sm text-gray-600">
                        {selectedProvider.location}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 mb-2">
                      <Star
                        size={14}
                        className="fill-yellow-400 text-yellow-400"
                      />
                      <span className="font-bold text-sm">
                        {selectedProvider.rating}
                      </span>
                      <span className="text-xs text-gray-500">
                        ({selectedProvider.reviews.toLocaleString()})
                      </span>
                    </div>
                    <div className="flex gap-1.5">
                      {selectedProvider.specialties
                        .slice(0, 2)
                        .map((specialty) => (
                          <span
                            key={specialty}
                            className="text-xs px-2 py-0.5 bg-green-50 text-green-700 rounded-md font-medium"
                          >
                            {specialty}
                          </span>
                        ))}
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedProviderId(null);
                    }}
                    className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                  >
                    <X size={16} className="text-gray-600" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="px-5 py-4 space-y-3 pb-28">
          {expandedBeyondFilters && providers.length > 0 && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              {t("expandedNote")}
            </div>
          )}
          {providers.length === 0 && (
            <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-8 text-center text-sm text-gray-600">
              {t("noResults")}
            </div>
          )}
          {providers.map((provider) => (
            <div
              key={provider.id}
              onClick={() => router.push(providerHref(provider.id))}
              className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-lg transition-all cursor-pointer"
            >
              <div className="flex gap-4 p-4">
                <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-xl bg-gray-100">
                  <ImageWithFallback
                    fill
                    src={mediaUrl(provider.image)}
                    alt={provider.name}
                    sizes="96px"
                    className="object-cover"
                    fallbackClassName="h-full w-full"
                  />
                  {provider.verified && (
                    <div className="absolute -bottom-1.5 -right-1.5 w-7 h-7 bg-[#083f30] rounded-full flex items-center justify-center shadow-lg">
                      <BadgeCheck size={16} className="text-[#eacb7f]" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-900 mb-1 line-clamp-1">
                    {provider.name}
                  </h3>
                  <div className="flex items-center gap-1.5 mb-2">
                    <MapPin size={14} className="text-gray-400" />
                    <span className="text-sm text-gray-600">
                      {provider.location}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <Star
                      size={14}
                      className="fill-yellow-400 text-yellow-400"
                    />
                    <span className="font-bold text-sm">{provider.rating}</span>
                    <span className="text-xs text-gray-500">
                      {t("reviewsCount", { count: provider.reviews })}
                    </span>
                  </div>
                  <div className="flex gap-1.5 flex-wrap">
                    {provider.specialties.map((specialty) => (
                      <span
                        key={specialty}
                        className="text-xs px-2 py-0.5 bg-green-50 text-green-700 rounded-md font-medium"
                      >
                        {specialty}
                      </span>
                    ))}
                  </div>
                </div>

                <FavoriteButton
                  customerId={customerId}
                  entityId={provider.id}
                  favoriteType="provider"
                  active={provider.isFavorited}
                  path="/n/app/mobile/map-discovery"
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {showFilters && (
        <div className="fixed inset-0 z-[80] bg-black/50 flex items-end animate-in fade-in duration-200">
          <form
            onSubmit={applyFilters}
            className="w-full bg-white rounded-t-3xl max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom duration-300"
          >
            <div className="sticky top-0 bg-white border-b border-gray-200 px-5 py-4 z-10">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl font-bold text-gray-900">
                  {t("advancedFilters")}
                </h2>
                <button
                  type="button"
                  onClick={() => setShowFilters(false)}
                  className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
                >
                  <X size={20} className="text-gray-600" />
                </button>
              </div>
              <p className="text-sm text-gray-600">
                {t("refineSearchResults")}
              </p>
            </div>

            <div className="px-5 py-6 space-y-6">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Globe size={20} className="text-[#083f30]" />
                  <h3 className="font-bold text-gray-900">
                    {t("filters.location")}
                  </h3>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <AsyncSearchableSingleSelect
                    label={t("filters.country")}
                    value={activeFilters.countryCode}
                    placeholder={t("filters.selectCountry")}
                    searchPlaceholder={t("filters.searchCountries")}
                    emptyText={t("filters.noCountriesFound")}
                    loadOptions={loadCountryOptions}
                    loadByValue={loadCountryByValue}
                    onChange={(value) => {
                      form.setValue("countryCode", value, {
                        shouldDirty: true,
                      });
                      form.setValue("cityCode", null, { shouldDirty: true });
                    }}
                  />

                  <AsyncSearchableSingleSelect
                    label={t("filters.city")}
                    value={activeFilters.cityCode}
                    disabled={!activeFilters.countryCode}
                    placeholder={
                      activeFilters.countryCode
                        ? t("filters.selectCity")
                        : t("filters.selectCountryFirst")
                    }
                    searchPlaceholder={t("filters.searchCities")}
                    emptyText={
                      activeFilters.countryCode
                        ? t("filters.noCitiesFound")
                        : t("filters.selectCountryFirst")
                    }
                    loadOptions={loadCityOptions}
                    loadByValue={loadCityByValue}
                    onChange={(value) =>
                      form.setValue("cityCode", value, { shouldDirty: true })
                    }
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <DollarSign size={20} className="text-[#083f30]" />
                    <h3 className="font-bold text-gray-900">
                      {t("filters.priceRange")}
                    </h3>
                  </div>
                  <span className="text-sm font-semibold text-[#083f30]">
                    {pricePrefix}0 - {pricePrefix}
                    {activeFilters.priceRange[1].toLocaleString("en")}
                  </span>
                </div>

                <div className="mb-4">
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Currency
                  </label>
                  <select
                    value={activeFilters.currencyCode ?? ""}
                    onChange={(event) =>
                      form.setValue(
                        "currencyCode",
                        event.target.value || null,
                        { shouldDirty: true },
                      )
                    }
                    className="h-12 w-full rounded-2xl border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-900 outline-none transition focus:border-[#083f30] focus:ring-2 focus:ring-[#083f30]/10"
                  >
                    <option value="">All currencies</option>
                    {availableCurrencies.map((currency) => (
                      <option key={currency.code} value={currency.code}>
                        {currency.symbol} {currency.code} — {currency.label} (
                        {currency.count})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <input
                    dir="ltr"
                    type="range"
                    min="0"
                    max="10000"
                    step="100"
                    value={activeFilters.priceRange[1]}
                    onChange={(e) =>
                      form.setValue("maxPrice", Number(e.target.value), {
                        shouldDirty: true,
                      })
                    }
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    style={{
                      direction: "ltr",
                      background: `linear-gradient(to right, #083f30 0%, #083f30 ${(activeFilters.priceRange[1] / 10000) * 100}%, #e5e7eb ${(activeFilters.priceRange[1] / 10000) * 100}%, #e5e7eb 100%)`,
                    }}
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>{pricePrefix}0</span>
                    <span>{pricePrefix}10,000+</span>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <MapPin size={20} className="text-[#083f30]" />
                    <h3 className="font-bold text-gray-900">
                      {t("filters.distance")}
                    </h3>
                  </div>
                  <span className="text-sm font-semibold text-[#083f30]">
                    {isUnlimitedDistance(activeFilters.distanceKm)
                      ? t("filters.unlimited")
                      : `${activeFilters.distanceKm} km`}
                  </span>
                </div>
                {/* Force LTR on the track + labels so the thumb, the filled
                    gradient and the min/max captions stay aligned on RTL locales.
                    Without this the labels flip and the slider feels reversed —
                    dragging toward the "near" end appeared to reveal providers. */}
                <div dir="ltr" className="space-y-2">
                  <input
                    dir="ltr"
                    type="range"
                    min={MIN_DISTANCE_KM}
                    max={MAX_DISTANCE_KM}
                    value={activeFilters.distanceKm}
                    onChange={(e) =>
                      form.setValue("distanceKm", Number(e.target.value), {
                        shouldDirty: true,
                      })
                    }
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    style={{
                      direction: "ltr",
                      background: `linear-gradient(to right, #083f30 0%, #083f30 ${(activeFilters.distanceKm / MAX_DISTANCE_KM) * 100}%, #e5e7eb ${(activeFilters.distanceKm / MAX_DISTANCE_KM) * 100}%, #e5e7eb 100%)`,
                    }}
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>{t("filters.oneKm")}</span>
                    <span>{t("filters.unlimited")}</span>
                  </div>
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  {t("filters.distanceCaption")}
                </p>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Star size={20} className="text-[#083f30]" />
                  <h3 className="font-bold text-gray-900">
                    {t("filters.minimumRating")}
                  </h3>
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {[0, 3.0, 3.5, 4.0, 4.5].map((rating) => (
                    <button
                      type="button"
                      key={rating}
                      onClick={() =>
                        form.setValue("minRating", rating, {
                          shouldDirty: true,
                        })
                      }
                      className={`h-12 rounded-xl flex flex-col items-center justify-center font-semibold transition-all ${activeFilters.minRating === rating ? "bg-[#083f30] text-white shadow-md" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
                    >
                      <span className="text-sm">
                        {rating === 0 ? t("filters.any") : `${rating}+`}
                      </span>
                      {rating > 0 && (
                        <Star size={12} className="fill-current" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <button
                  type="button"
                  onClick={() =>
                    form.setValue("verifiedOnly", !activeFilters.verifiedOnly, {
                      shouldDirty: true,
                    })
                  }
                  className={`w-full p-4 rounded-2xl border-2 transition-all flex items-center justify-between ${activeFilters.verifiedOnly ? "bg-green-50 border-green-200" : "bg-white border-gray-200 hover:border-gray-300"}`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center ${activeFilters.verifiedOnly ? "bg-green-600" : "bg-gray-100"}`}
                    >
                      <BadgeCheck
                        size={24}
                        className={
                          activeFilters.verifiedOnly
                            ? "text-white"
                            : "text-gray-400"
                        }
                      />
                    </div>
                    <div className="text-left">
                      <h3 className="font-bold text-gray-900">
                        {t("filters.verifiedProvidersOnly")}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {t("filters.showOnlyAccreditedProviders")}
                      </p>
                    </div>
                  </div>
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${activeFilters.verifiedOnly ? "bg-green-600" : "bg-gray-200"}`}
                  >
                    {activeFilters.verifiedOnly && (
                      <Check size={16} className="text-white" />
                    )}
                  </div>
                </button>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Globe size={20} className="text-[#083f30]" />
                  <h3 className="font-bold text-gray-900">
                    {t("filters.languagesSpoken")}
                  </h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {availableLanguages.map((lang) => (
                    <button
                      type="button"
                      key={lang}
                      onClick={() => {
                        const current = activeFilters.languages;
                        const next = current.includes(lang)
                          ? current.filter((item) => item !== lang)
                          : [...current, lang];
                        form.setValue("languages", next, { shouldDirty: true });
                      }}
                      className={`px-4 py-2 rounded-xl font-medium transition-all ${activeFilters.languages.includes(lang) ? "bg-[#083f30] text-white shadow-md" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
                    >
                      {languageLabel(lang, locale)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Award size={20} className="text-[#083f30]" />
                  <h3 className="font-bold text-gray-900">
                    {t("filters.specialties")}
                  </h3>
                </div>
                <SpecialtyMultiSelect
                  values={activeFilters.specialties}
                  options={availableSpecialties}
                  onChange={(next) =>
                    form.setValue("specialties", next, { shouldDirty: true })
                  }
                  placeholder={t("filters.selectSpecialties")}
                  searchPlaceholder={t("filters.searchSpecialties")}
                  emptyText={t("filters.noSpecialtiesFound")}
                  selectedCountLabel={(count) =>
                    t("filters.specialtiesSelected", { count })
                  }
                />
              </div>
            </div>

            <div className="sticky bottom-0 bg-white border-t border-gray-200 px-5 pt-4 pb-[calc(env(safe-area-inset-bottom)+5rem)]">
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={clearFilters}
                  className="flex-1 h-12 rounded-xl bg-gray-100 text-gray-900 font-bold hover:bg-gray-200 transition-colors"
                >
                  {t("clearAll")}
                </button>
                <button
                  type="submit"
                  className="flex-1 h-12 rounded-xl bg-gradient-to-r from-[#083f30] to-[#0a5a44] text-white font-bold hover:shadow-lg transition-all"
                >
                  {t("applyFilters")}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
