"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { hasLexicalContent, LexicalRenderer } from "@/components/editor/lexical-renderer";
import {
  Search,
  SlidersHorizontal,
  MapPin,
  Star,
  TrendingUp,
  BadgeCheck,
  ChevronRight,
  Award,
  Users,
  Clock,
  X,
  Check,
  DollarSign,
  Globe,
} from "lucide-react";


import FavoriteButton from "./FavoriteButton";
import LazySearchableSelect from "./LazySearchableSelect";
import {
  getExploreCityOptionAction,
  getExploreCountryOptionAction,
  searchExploreCityOptionsAction,
  searchExploreCountryOptionsAction,
} from "./explore-location.actions";
import type {
  ExploreCategory,
  ExploreCurrencyOption,
  ExploreFeaturedProvider,
  ExploreFiltersInput,
  ExploreLanguageOption,
  ExploreProviderType,
  ExploreSponsoredProvider,
  ExploreTrendingService,
} from "./explore.data";
import { resolveHomeMediaUrl } from "@/features/home/components/home-media";
import { ImageWithFallback } from "@/components/ui/image-with-fallback";

type FilterFormValues = {
  countryCode: string | null;
  cityCode: string | null;
  maxPrice: number;
  currencyCode: string | null;
  minRating: number;
  verifiedOnly: boolean;
  responseTime: "any" | "fast" | "instant";
  languages: string[];
};

type OptimisticUiFilters = {
  categoryId: string;
  providerTypeId: string;
  countryCode: string | null;
  cityCode: string | null;
  maxPrice: number;
  currencyCode: string | null;
  minRating: number;
  verifiedOnly: boolean;
  languages: string[];
  responseTime: "any" | "fast" | "instant";
};

const MOBILE_BASE_PATH = "/n/app/mobile";
const EXPLORE_PATH = `${MOBILE_BASE_PATH}/explore`;
const MAP_DISCOVERY_PATH = `${MOBILE_BASE_PATH}/map-discovery`;

function buildMobilePath(path: string) {
  return `${MOBILE_BASE_PATH}${path.startsWith("/") ? path : `/${path}`}`;
}

function buildFilteredMobilePath(path: string, next: ExploreFiltersInput) {
  const params = new URLSearchParams();

  if (next.q) params.set("q", next.q);
  if (next.categoryId && next.categoryId !== "all") params.set("categoryId", next.categoryId);
  if (next.providerTypeId && next.providerTypeId !== "all") {
    params.set("providerTypeId", next.providerTypeId);
  }
  if (next.countryCode) params.set("country", next.countryCode);
  if (next.cityCode) params.set("city", next.cityCode);
  if (next.minPrice > 0) params.set("minPrice", String(next.minPrice));
  if (next.maxPrice > 0 && next.maxPrice !== 5000) params.set("maxPrice", String(next.maxPrice));
  if (next.currencyCode) params.set("currency", next.currencyCode);
  if (next.minRating > 0) params.set("minRating", String(next.minRating));
  if (next.verifiedOnly) params.set("verifiedOnly", "1");
  if (next.languages.length > 0) params.set("languages", next.languages.join(","));
  if (next.responseTime !== "any") params.set("responseTime", next.responseTime);
  if (next.sort && next.sort !== "recommended") params.set("sort", next.sort);

  const query = params.toString();
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return query ? `${MOBILE_BASE_PATH}${normalizedPath}?${query}` : `${MOBILE_BASE_PATH}${normalizedPath}`;
}

function buildExploreQuery(next: ExploreFiltersInput) {
  return buildFilteredMobilePath("/explore", next);
}

function buildMapDiscoveryQuery(next: ExploreFiltersInput) {
  return buildFilteredMobilePath("/map-discovery", next);
}

function formatPrice(value: number | null, currency: string = "USD") {
  if (value == null) return null;

  try {
    return new Intl.NumberFormat("en", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `$${value.toLocaleString("en")}`;
  }
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

  // A bare media-library UUID should have been resolved by the server query.
  // Sending it to <Image> creates a broken request like /<uuid>, so fail safe.
  if (!raw || BARE_UUID_RE.test(raw)) return fallback;

  return resolveHomeMediaUrl(raw) || fallback;
}

function MaybeLexicalText({
  content,
  className,
  fallback = "-",
}: {
  content: string | null | undefined;
  className?: string;
  fallback?: string;
}) {
  const value = content?.trim();

  if (!value) return <p className={className}>{fallback}</p>;

  if (hasLexicalContent(value)) {
    return <LexicalRenderer content={value} className={className} />;
  }

  return <p className={className}>{value}</p>;
}

function navigateSmooth(
  startTransition: React.TransitionStartFunction,
  router: ReturnType<typeof useRouter>,
  href: string,
) {
  startTransition(() => {
    router.replace(href, { scroll: false });
  });
}

function ExplorePendingOverlay() {
  return (
    <div className="pointer-events-none absolute inset-0 z-30 bg-white/55 backdrop-blur-[1px]">
      <div className="px-5 py-6 space-y-6">
        <div className="space-y-3">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 p-4 animate-pulse"
            >
              <div className="flex gap-4">
                <div className="w-24 h-24 rounded-xl bg-gray-200 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="h-5 w-2/3 bg-gray-200 rounded mb-2" />
                  <div className="h-4 w-1/2 bg-gray-100 rounded mb-2" />
                  <div className="h-4 w-3/4 bg-gray-100 rounded mb-3" />
                  <div className="flex gap-2 mb-3">
                    <div className="h-6 w-20 bg-gray-100 rounded-md" />
                    <div className="h-6 w-16 bg-gray-100 rounded-md" />
                  </div>
                  <div className="h-4 w-28 bg-gray-100 rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-2xl overflow-hidden animate-pulse">
          <div className="h-40 bg-gray-200" />
        </div>

        <div className="flex gap-4 overflow-hidden px-0">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="flex-none w-64 bg-white rounded-2xl overflow-hidden shadow-md border border-gray-100 animate-pulse"
            >
              <div className="aspect-[16/10] bg-gray-200" />
              <div className="p-4">
                <div className="h-5 w-3/4 bg-gray-200 rounded mb-2" />
                <div className="h-4 w-1/2 bg-gray-100 rounded mb-3" />
                <div className="h-4 w-2/3 bg-gray-100 rounded mb-3" />
                <div className="flex justify-between">
                  <div className="h-4 w-20 bg-gray-100 rounded" />
                  <div className="h-5 w-16 bg-gray-200 rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ExploreClient({
  customerId,
  categories,
  providerTypes,
  featuredProviders,
  trendingServices,
  sponsoredProviders,
  availableLanguages,
  availableCurrencies,
  locale,
  filters: initialFilters,
}: {
  customerId: string | null;
  categories: ExploreCategory[];
  providerTypes: ExploreProviderType[];
  featuredProviders: ExploreFeaturedProvider[];
  trendingServices: ExploreTrendingService[];
  sponsoredProviders: ExploreSponsoredProvider[];
  availableLanguages: ExploreLanguageOption[];
  availableCurrencies: ExploreCurrencyOption[];
  locale: string;
  filters: ExploreFiltersInput;
}) {
  const router = useRouter();
  const t = useTranslations("Explore");
  const [isPending, startTransition] = useTransition();
  const [showFilters, setShowFilters] = useState(false);
  const [showAllProviderTypes, setShowAllProviderTypes] = useState(false);

  const initialUiFilters = useMemo<OptimisticUiFilters>(
    () => ({
      categoryId: initialFilters.categoryId ?? "all",
      providerTypeId: initialFilters.providerTypeId ?? "all",
      countryCode: initialFilters.countryCode,
      cityCode: initialFilters.cityCode,
      maxPrice: initialFilters.maxPrice || 5000,
      currencyCode: initialFilters.currencyCode,
      minRating: initialFilters.minRating || 0,
      verifiedOnly: initialFilters.verifiedOnly,
      languages: initialFilters.languages,
      responseTime: initialFilters.responseTime,
    }),
    [initialFilters],
  );

  const [uiFilters, setUiFilters] = useState<OptimisticUiFilters>(initialUiFilters);

  useEffect(() => {
    setUiFilters(initialUiFilters);
  }, [initialUiFilters]);

  const form = useForm<FilterFormValues>({
    defaultValues: {
      countryCode: initialUiFilters.countryCode,
      cityCode: initialUiFilters.cityCode,
      maxPrice: initialUiFilters.maxPrice,
      currencyCode: initialUiFilters.currencyCode,
      minRating: initialUiFilters.minRating,
      verifiedOnly: initialUiFilters.verifiedOnly,
      languages: initialUiFilters.languages,
      responseTime: initialUiFilters.responseTime,
    },
  });

  useEffect(() => {
    form.reset({
      countryCode: initialUiFilters.countryCode,
      cityCode: initialUiFilters.cityCode,
      maxPrice: initialUiFilters.maxPrice,
      currencyCode: initialUiFilters.currencyCode,
      minRating: initialUiFilters.minRating,
      verifiedOnly: initialUiFilters.verifiedOnly,
      languages: initialUiFilters.languages,
      responseTime: initialUiFilters.responseTime,
    });
  }, [form, initialUiFilters]);

  const watched = form.watch();

  const modalFilters = useMemo(
    () => ({
      countryCode: watched.countryCode ?? null,
      cityCode: watched.cityCode ?? null,
      priceRange: [0, watched.maxPrice ?? 5000] as [number, number],
      currencyCode: watched.currencyCode ?? null,
      minRating: watched.minRating ?? 0,
      verifiedOnly: watched.verifiedOnly ?? false,
      languages: watched.languages ?? [],
      responseTime: watched.responseTime ?? "any",
    }),
    [watched],
  );

  const selectedCountryCode = watched.countryCode ?? null;

  const selectedCurrency = useMemo(() => {
    const selected = availableCurrencies.find((currency) => currency.code === modalFilters.currencyCode);
    return selected ?? availableCurrencies[0] ?? { code: "USD", label: t("currencies.usDollar"), symbol: "$", count: 0 };
  }, [availableCurrencies, modalFilters.currencyCode, t]);

  const languageLabelByValue = useMemo(() => {
    return new Map(availableLanguages.map((language) => [language.value, language.label]));
  }, [availableLanguages]);

  const selectedLanguageLabels = modalFilters.languages.map((value) => ({
    value,
    label: languageLabelByValue.get(value) ?? value,
  }));

  const pricePrefix = modalFilters.currencyCode ? selectedCurrency.symbol : "";

  const loadCountryOptions = useCallback(
    (args: { search: string; page: number; pageSize: number }) =>
      searchExploreCountryOptionsAction({ locale, ...args }),
    [locale],
  );

  const loadSelectedCountry = useCallback(
    (value: string) => getExploreCountryOptionAction({ locale, value }),
    [locale],
  );

  const loadCityOptions = useCallback(
    (args: { search: string; page: number; pageSize: number }) =>
      searchExploreCityOptionsAction({ locale, countryCode: selectedCountryCode, ...args }),
    [locale, selectedCountryCode],
  );

  const loadSelectedCity = useCallback(
    (value: string) =>
      getExploreCityOptionAction({ locale, countryCode: selectedCountryCode, value }),
    [locale, selectedCountryCode],
  );

  const activeUiFilters = uiFilters;

  const hasActiveFilters =
    activeUiFilters.verifiedOnly ||
    activeUiFilters.minRating > 0 ||
    activeUiFilters.languages.length > 0 ||
    activeUiFilters.responseTime !== "any" ||
    activeUiFilters.providerTypeId !== "all" ||
    Boolean(activeUiFilters.countryCode) ||
    Boolean(activeUiFilters.cityCode) ||
    Boolean(activeUiFilters.currencyCode) ||
    activeUiFilters.maxPrice !== 5000;

  const applyCategory = (categoryId: string) => {
    const nextCategoryId = categoryId === "all" ? "all" : categoryId;

    setUiFilters((prev) => ({
      ...prev,
      categoryId: nextCategoryId,
    }));

    navigateSmooth(
      startTransition,
      router,
      buildExploreQuery({
        ...initialFilters,
        categoryId: nextCategoryId === "all" ? null : nextCategoryId,
        providerTypeId:
          activeUiFilters.providerTypeId === "all" ? null : activeUiFilters.providerTypeId,
        countryCode: activeUiFilters.countryCode,
        cityCode: activeUiFilters.cityCode,
        minPrice: 0,
        maxPrice: activeUiFilters.maxPrice,
        currencyCode: activeUiFilters.currencyCode,
        minRating: activeUiFilters.minRating,
        verifiedOnly: activeUiFilters.verifiedOnly,
        languages: activeUiFilters.languages,
        responseTime: activeUiFilters.responseTime,
      }),
    );
  };

  const applyProviderType = (providerTypeId: string) => {
    const nextProviderTypeId = providerTypeId === "all" ? "all" : providerTypeId;

    setUiFilters((prev) => ({
      ...prev,
      providerTypeId: nextProviderTypeId,
    }));

    navigateSmooth(
      startTransition,
      router,
      buildExploreQuery({
        ...initialFilters,
        categoryId: activeUiFilters.categoryId === "all" ? null : activeUiFilters.categoryId,
        providerTypeId: nextProviderTypeId === "all" ? null : nextProviderTypeId,
        countryCode: activeUiFilters.countryCode,
        cityCode: activeUiFilters.cityCode,
        minPrice: 0,
        maxPrice: activeUiFilters.maxPrice,
        currencyCode: activeUiFilters.currencyCode,
        minRating: activeUiFilters.minRating,
        verifiedOnly: activeUiFilters.verifiedOnly,
        languages: activeUiFilters.languages,
        responseTime: activeUiFilters.responseTime,
      }),
    );
  };

  const applyFilters = form.handleSubmit((values) => {
    const nextUiFilters: OptimisticUiFilters = {
      categoryId: activeUiFilters.categoryId,
      providerTypeId: activeUiFilters.providerTypeId,
      countryCode: values.countryCode ?? null,
      cityCode: values.cityCode ?? null,
      maxPrice: values.maxPrice,
      currencyCode: values.currencyCode ?? null,
      minRating: values.minRating,
      verifiedOnly: values.verifiedOnly,
      languages: values.languages,
      responseTime: values.responseTime,
    };

    setUiFilters(nextUiFilters);
    setShowFilters(false);

    navigateSmooth(
      startTransition,
      router,
      buildExploreQuery({
        ...initialFilters,
        categoryId: nextUiFilters.categoryId === "all" ? null : nextUiFilters.categoryId,
        providerTypeId:
          nextUiFilters.providerTypeId === "all" ? null : nextUiFilters.providerTypeId,
        countryCode: nextUiFilters.countryCode,
        cityCode: nextUiFilters.cityCode,
        minPrice: 0,
        maxPrice: nextUiFilters.maxPrice,
        currencyCode: nextUiFilters.currencyCode,
        minRating: nextUiFilters.minRating,
        verifiedOnly: nextUiFilters.verifiedOnly,
        languages: nextUiFilters.languages,
        responseTime: nextUiFilters.responseTime,
      }),
    );
  });

  const clearFilters = () => {
    const cleared: OptimisticUiFilters = {
      categoryId: activeUiFilters.categoryId,
      providerTypeId: activeUiFilters.providerTypeId,
      countryCode: null,
      cityCode: null,
      maxPrice: 5000,
      currencyCode: null,
      minRating: 0,
      verifiedOnly: false,
      languages: [],
      responseTime: "any",
    };

    form.reset({
      countryCode: null,
      cityCode: null,
      maxPrice: 5000,
      currencyCode: null,
      minRating: 0,
      verifiedOnly: false,
      languages: [],
      responseTime: "any",
    });

    setUiFilters(cleared);

    navigateSmooth(
      startTransition,
      router,
      buildExploreQuery({
        ...initialFilters,
        categoryId: cleared.categoryId === "all" ? null : cleared.categoryId,
        providerTypeId: cleared.providerTypeId === "all" ? null : cleared.providerTypeId,
        countryCode: cleared.countryCode,
        cityCode: cleared.cityCode,
        minPrice: 0,
        maxPrice: 5000,
        currencyCode: null,
        minRating: 0,
        verifiedOnly: false,
        languages: [],
        responseTime: "any",
      }),
    );
  };

  const currentFilters = useMemo<ExploreFiltersInput>(
    () => ({
      ...initialFilters,
      categoryId: activeUiFilters.categoryId === "all" ? null : activeUiFilters.categoryId,
      providerTypeId:
        activeUiFilters.providerTypeId === "all" ? null : activeUiFilters.providerTypeId,
      countryCode: activeUiFilters.countryCode,
      cityCode: activeUiFilters.cityCode,
      minPrice: 0,
      maxPrice: activeUiFilters.maxPrice,
      currencyCode: activeUiFilters.currencyCode,
      minRating: activeUiFilters.minRating,
      verifiedOnly: activeUiFilters.verifiedOnly,
      languages: activeUiFilters.languages,
      responseTime: activeUiFilters.responseTime,
    }),
    [activeUiFilters, initialFilters],
  );

  const searchLabel = initialFilters.q ? initialFilters.q : t("search.placeholder");
  const visibleProviderTypes = showAllProviderTypes
    ? providerTypes
    : providerTypes.slice(0, 4);

  return (
    <div className="relative min-h-screen bg-white pb-24">
      {isPending && <ExplorePendingOverlay />}

      <div className="bg-white px-5 pt-3 pb-4 border-b border-gray-100 sticky top-0 z-40 backdrop-blur-xl bg-white/95">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t("header.title")}</h1>
            <p className="text-sm text-gray-600 mt-0.5">{t("header.subtitle")}</p>
          </div>

          <button
            onClick={() => router.push(MAP_DISCOVERY_PATH)}
            className="w-11 h-11 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
          >
            <MapPin size={22} className="text-[#083f30]" />
          </button>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => router.push(buildMapDiscoveryQuery(currentFilters))}
            className="flex-1 h-12 bg-gray-50 rounded-xl px-4 flex items-center gap-3 border border-gray-100 hover:border-[#083f30] transition-colors"
          >
            <Search size={20} className="text-gray-400" />
            <span className="text-gray-500 text-sm font-medium truncate">{searchLabel}</span>
          </button>

          <button
            onClick={() => setShowFilters(true)}
            className="w-12 h-12 bg-[#083f30] rounded-xl flex items-center justify-center hover:bg-[#0a5a44] transition-colors relative"
          >
            <SlidersHorizontal size={20} className="text-white" />
            {hasActiveFilters && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-[#eacb7f] rounded-full border-2 border-white" />
            )}
          </button>
        </div>

        <div className="flex gap-2 overflow-x-auto hide-scrollbar mt-3 pb-1 -mx-5 px-5">
          {categories.map((cat) => (
            <button
              key={`category-${cat.id}`}
              onClick={() => applyCategory(cat.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                activeUiFilters.categoryId === cat.id
                  ? "bg-[#083f30] text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {cat.label} <span className="opacity-70">({cat.count})</span>
            </button>
          ))}
        </div>
      </div>

      <div className="py-6">
        <div className="px-5 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award size={22} className="text-[#083f30]" />
              <h2 className="text-xl font-bold text-gray-900">{t("featured.title")}</h2>
            </div>
            <button
              onClick={() => router.push(buildMapDiscoveryQuery(currentFilters))}
              className="text-sm font-semibold text-[#083f30] hover:underline flex items-center gap-1"
            >
              {t("actions.viewAll")}
              <ChevronRight size={16} />
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-1">{t("featured.subtitle")}</p>
        </div>

        <div className="space-y-3 px-5">
          {featuredProviders.map((provider) => (
            <div
              key={`featured-provider-${provider.id}`}
              onClick={() => router.push(buildMobilePath(`/provider/${provider.id}`))}
              className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-lg transition-all cursor-pointer"
            >
              
              <div className="flex gap-4 p-4">
                <div className="relative flex-shrink-0">
                  <ImageWithFallback
                       width={200}
                height={200}
                    src={mediaUrl(provider.image)}
                    alt={provider.name}
                    className="w-24 h-24 rounded-xl object-cover"
                  />
                  {provider.verified && (
                    <div className="absolute -bottom-1.5 -right-1.5 w-7 h-7 bg-[#083f30] rounded-full flex items-center justify-center shadow-lg">
                      <BadgeCheck size={16} className="text-[#eacb7f]" />
                    </div>
                  )}

                  <div className="absolute top-2 left-2 px-2 py-0.5 bg-white/95 backdrop-blur-sm rounded-md">
                    <span className="text-xs font-bold text-[#083f30]">{provider.badge}</span>
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-900 mb-1 line-clamp-1">{provider.name}</h3>
                  <div className="flex items-center gap-1.5 mb-2">
                    <MapPin size={14} className="text-gray-400 flex-shrink-0" />
                    <span className="text-sm text-gray-600 line-clamp-1">{provider.location}</span>
                  </div>

                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex items-center gap-1">
                      <Star size={14} className="fill-yellow-400 text-yellow-400" />
                      <span className="font-bold text-sm text-gray-900">{provider.rating}</span>
                      <span className="text-xs text-gray-500">({provider.reviews.toLocaleString()})</span>
                    </div>
                    <span className="text-gray-300">•</span>
                    <div className="flex items-center gap-1">
                      <Users size={14} className="text-gray-400" />
                      <span className="text-xs text-gray-600">{provider.bookings}</span>
                    </div>
                  </div>

                  <div className="flex gap-1.5 flex-wrap mb-2">
                    {provider.specialties.slice(0, 2).map((specialty, specialtyIndex) => (
                      <span
                        key={`specialty-${provider.id}-${specialty}-${specialtyIndex}`}
                        className="text-xs px-2 py-0.5 bg-green-50 text-green-700 rounded-md font-medium"
                      >
                        {specialty}
                      </span>
                    ))}
                    {provider.specialties.length > 2 && (
                      <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md font-medium">
                        +{provider.specialties.length - 2}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <Clock size={12} className="text-green-600" />
                    <span className="text-xs font-medium text-green-700">{t("provider.responds", { time: provider.responseTime })}</span>
                  </div>
                </div>

                <FavoriteButton
                  customerId={customerId}
                  entityId={provider.id}
                  favoriteType="provider"
                  active={provider.isFavorited}
                  path="/n/app/mobile/explore"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {sponsoredProviders[0] && (
        <div className="px-5 py-4">
          <div className="relative rounded-2xl overflow-hidden shadow-lg">
            <ImageWithFallback
                 width={200}
                height={200}
              src={mediaUrl(sponsoredProviders[0].image)}
              alt={t("sponsored.alt")}
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-purple-900/90 via-purple-800/80 to-transparent" />

            <div className="relative z-10 p-6">
              <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-bold text-white uppercase tracking-wide mb-3">
                {sponsoredProviders[0].tag}
              </span>
              <h3 className="text-xl font-bold text-white mb-2">{sponsoredProviders[0].name}</h3>
              <MaybeLexicalText
                content={sponsoredProviders[0].subtitle}
                className="text-white/90 text-sm mb-4 line-clamp-3 [&_*]:text-white/90"
                fallback=""
              />
              <div className="flex items-center gap-3">
                <button
                  onClick={() => router.push(buildMobilePath(`/provider/${sponsoredProviders[0].id}`))}
                  className="bg-white text-purple-900 px-6 py-3 rounded-xl font-bold text-sm hover:bg-gray-100 transition-all shadow-lg"
                >
                  {t("actions.learnMore")}
                </button>
                {sponsoredProviders[0].price != null && (
                  <span className="text-2xl font-bold text-white">
                    {formatPrice(sponsoredProviders[0].price, sponsoredProviders[0].currency)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="py-6">
        <div className="px-5 mb-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp size={22} className="text-orange-500" />
            <h2 className="text-xl font-bold text-gray-900">{t("trending.title")}</h2>
          </div>
          <p className="text-sm text-gray-600">{t("trending.subtitle")}</p>
        </div>

        <div className="flex gap-4 overflow-x-auto hide-scrollbar px-5 pb-2">
          {trendingServices.map((service) => (
            <div
              key={`trending-service-${service.id}`}
              onClick={() => router.push(buildMobilePath(`/service/${service.id}`))}
              className="flex-none w-64 bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all cursor-pointer border border-gray-100"
            >
              
              <div className="relative aspect-[16/10]">
                <ImageWithFallback
                     width={200}
                height={200}
                  src={mediaUrl(service.image)}
                  alt={service.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

                {service.growth && (
                  <div className="absolute top-3 left-3 flex items-center gap-1 px-2 py-1 bg-green-500 rounded-full">
                    <TrendingUp size={12} className="text-white" />
                    <span className="text-xs font-bold text-white">{service.growth}</span>
                  </div>
                )}

                <div className="absolute top-3 right-3" onClick={(e) => e.stopPropagation()}>
                  <FavoriteButton
                    customerId={customerId}
                    entityId={service.id}
                    favoriteType="service"
                    active={service.isFavorited}
                    path="/n/app/mobile/explore"
                  />
                </div>
              </div>

              <div className="p-4">
                <h3 className="font-bold text-gray-900 mb-1 line-clamp-1">{service.name}</h3>
                <p className="text-sm text-gray-600 mb-3 line-clamp-1">{service.provider}</p>

                <div className="flex items-center gap-1 mb-3">
                  <MapPin size={12} className="text-gray-400" />
                  <span className="text-xs text-gray-500">{service.location}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Star size={14} className="fill-yellow-400 text-yellow-400" />
                    <span className="font-bold text-sm">{service.rating}</span>
                    <span className="text-xs text-gray-500">({service.reviews})</span>
                  </div>

                  <div className="text-right">
                    {service.originalPrice && (
                      <div className="text-xs text-gray-400 line-through">{formatPrice(service.originalPrice, service.currency)}</div>
                    )}
                    <div className="font-bold text-[#083f30]">{formatPrice(service.price, service.currency)}</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="px-5 py-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{t("providerTypes.title")}</h2>
            <p className="text-sm text-gray-600 mt-1">{t("providerTypes.subtitle")}</p>
          </div>
          {providerTypes.length > 4 && (
            <button
              type="button"
              onClick={() => setShowAllProviderTypes((current) => !current)}
              className="text-sm font-semibold text-[#083f30] hover:underline flex items-center gap-1"
            >
              {showAllProviderTypes ? t("actions.showLess") : t("actions.viewAll")}
              <ChevronRight
                size={16}
                className={showAllProviderTypes ? "rotate-90 transition-transform" : "transition-transform"}
              />
            </button>
          )}
        </div>

        {providerTypes.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-5 text-sm text-gray-500">
            {t("providerTypes.empty")}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {visibleProviderTypes.map((providerType) => (
              <article
                key={`provider-type-${providerType.id}`}
                role="button"
                tabIndex={0}
                onClick={() => applyProviderType(providerType.id)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    applyProviderType(providerType.id);
                  }
                }}
                className={`flex cursor-pointer items-center gap-3 rounded-2xl border border-gray-100 bg-white p-3 shadow-sm transition-all hover:shadow-lg ${
                  activeUiFilters.providerTypeId === providerType.id ? "ring-2 ring-[#eacb7f]" : ""
                }`}
              >
                
                <div className="relative h-14 w-14 flex-none overflow-hidden rounded-xl bg-gray-100">
                  <ImageWithFallback
                    fill
                    src={mediaUrl(providerType.image)}
                    alt={providerType.label}
                    sizes="56px"
                    className="object-cover"
                    fallbackClassName="h-full w-full"
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="mb-1 line-clamp-1 text-sm font-bold text-gray-900">
                    {providerType.label}
                  </h3>
                  <div className="mb-1 line-clamp-2 text-xs leading-5 text-gray-600 [&_*]:text-gray-600">
                    <MaybeLexicalText
                      content={providerType.description}
                      className="line-clamp-2 text-gray-600"
                    />
                  </div>
                  <p className="text-xs font-medium text-[#083f30]">{t("counts.providers", { count: providerType.count })}</p>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {/*
        Previous bottom category browse grid kept intentionally.
        Boss may ask to switch this section back from provider types to categories.

      <div className="px-5 py-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Browse Categories</h2>
          <button
            onClick={() => router.push(EXPLORE_PATH)}
            className="text-sm font-semibold text-[#083f30] hover:underline flex items-center gap-1"
          >
            View All
            <ChevronRight size={16} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {categories
            .filter((cat) => cat.id !== "all")
            .slice(0, 4)
            .map((cat) => (
              <button
                key={`category-${cat.id}`}
                onClick={() => applyCategory(cat.id)}
                className="relative rounded-2xl overflow-hidden aspect-[4/3] group shadow-sm hover:shadow-xl transition-all"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-[#083f30] via-[#0a5a44] to-[#eacb7f]" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />

                <div className="relative z-10 h-full flex flex-col justify-end p-4">
                  <h3 className="text-white font-bold text-lg mb-1">{cat.label}</h3>
                  <p className="text-white/90 text-xs">{cat.count} providers</p>
                </div>
              </button>
            ))}
        </div>
      </div>
      */}

      {showFilters && (
        <div className="fixed inset-0 z-[80] bg-black/50 flex items-end animate-in fade-in duration-200">
          <form
            onSubmit={applyFilters}
            className="w-full bg-white rounded-t-3xl max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom duration-300"
          >
            <div className="sticky top-0 bg-white border-b border-gray-200 px-5 py-4 z-10">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl font-bold text-gray-900">{t("filters.title")}</h2>
                <button
                  type="button"
                  onClick={() => setShowFilters(false)}
                  className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
                >
                  <X size={20} className="text-gray-600" />
                </button>
              </div>
              <p className="text-sm text-gray-600">{t("filters.subtitle")}</p>
            </div>

            <div className="px-5 py-6 space-y-6">
              <div>
                <div className="mb-3 flex items-center gap-2">
                  <MapPin size={20} className="text-[#083f30]" />
                  <h3 className="font-bold text-gray-900">{t("filters.location")}</h3>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <LazySearchableSelect
                    label={t("filters.country")}
                    value={modalFilters.countryCode}
                    placeholder={t("filters.selectCountry")}
                    searchPlaceholder={t("filters.searchCountries")}
                    emptyText={t("filters.noCountries")}
                    loadOptions={loadCountryOptions}
                    loadByValue={loadSelectedCountry}
                    onChange={(value) => {
                      form.setValue("countryCode", value, { shouldDirty: true });
                      form.setValue("cityCode", null, { shouldDirty: true });
                    }}
                  />
                  <LazySearchableSelect
                    key={modalFilters.countryCode ?? "no-country"}
                    label={t("filters.city")}
                    value={modalFilters.cityCode}
                    disabled={!modalFilters.countryCode}
                    placeholder={modalFilters.countryCode ? t("filters.selectCity") : t("filters.selectCountryFirst")}
                    searchPlaceholder={t("filters.searchCities")}
                    emptyText={t("filters.noCitiesForCountry")}
                    loadOptions={loadCityOptions}
                    loadByValue={loadSelectedCity}
                    onChange={(value) => form.setValue("cityCode", value, { shouldDirty: true })}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <DollarSign size={20} className="text-[#083f30]" />
                    <h3 className="font-bold text-gray-900">{t("filters.priceRange")}</h3>
                  </div>
                  <span className="text-sm font-semibold text-[#083f30]">
                    {pricePrefix}0 - {pricePrefix}
                    {modalFilters.priceRange[1].toLocaleString(locale)}
                  </span>
                </div>

                <div className="mb-4">
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                    {t("filters.currency")}
                  </label>
                  <select
                    value={modalFilters.currencyCode ?? ""}
                    onChange={(event) => {
                      form.setValue("currencyCode", event.target.value || null, { shouldDirty: true });
                    }}
                    className="h-12 w-full rounded-2xl border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-900 outline-none transition focus:border-[#083f30] focus:ring-2 focus:ring-[#083f30]/10"
                  >
                    <option value="">{t("filters.allCurrencies")}</option>
                    {availableCurrencies.map((currency) => (
                      <option key={currency.code} value={currency.code}>
                        {currency.symbol} {currency.code} — {currency.label} ({currency.count})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <input
                    type="range"
                    dir="ltr"
                    min="0"
                    max="10000"
                    step="100"
                    value={modalFilters.priceRange[1]}
                    onChange={(e) => form.setValue("maxPrice", Number(e.target.value), { shouldDirty: true })}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    style={{
                      direction: "ltr",
                      background: `linear-gradient(to right, #083f30 0%, #083f30 ${(modalFilters.priceRange[1] / 10000) * 100}%, #e5e7eb ${(modalFilters.priceRange[1] / 10000) * 100}%, #e5e7eb 100%)`,
                    }}
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>{pricePrefix}0</span>
                    <span>{pricePrefix}10,000+</span>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Star size={20} className="text-[#083f30]" />
                  <h3 className="font-bold text-gray-900">{t("filters.minimumRating")}</h3>
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {[0, 3.0, 3.5, 4.0, 4.5].map((rating) => (
                    <button
                      type="button"
                      key={rating}
                      onClick={() => form.setValue("minRating", rating)}
                      className={`h-12 rounded-xl flex flex-col items-center justify-center font-semibold transition-all ${
                        modalFilters.minRating === rating
                          ? "bg-[#083f30] text-white shadow-md"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      <span className="text-sm">{rating === 0 ? t("filters.any") : `${rating}+`}</span>
                      {rating > 0 && <Star size={12} className="fill-current" />}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Clock size={20} className="text-[#083f30]" />
                  <h3 className="font-bold text-gray-900">{t("filters.responseTime")}</h3>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: "any", label: t("filters.response.any") },
                    { value: "fast", label: t("filters.response.fast") },
                    { value: "instant", label: t("filters.response.instant") },
                  ].map((option) => (
                    <button
                      type="button"
                      key={option.value}
                      onClick={() =>
                        form.setValue(
                          "responseTime",
                          option.value as FilterFormValues["responseTime"],
                        )
                      }
                      className={`h-12 rounded-xl font-semibold transition-all ${
                        modalFilters.responseTime === option.value
                          ? "bg-[#083f30] text-white shadow-md"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <button
                  type="button"
                  onClick={() => form.setValue("verifiedOnly", !modalFilters.verifiedOnly)}
                  className={`w-full p-4 rounded-2xl border-2 transition-all flex items-center justify-between ${
                    modalFilters.verifiedOnly
                      ? "bg-green-50 border-green-200"
                      : "bg-white border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        modalFilters.verifiedOnly ? "bg-green-600" : "bg-gray-100"
                      }`}
                    >
                      <BadgeCheck
                        size={24}
                        className={modalFilters.verifiedOnly ? "text-white" : "text-gray-400"}
                      />
                    </div>
                    <div className="text-left">
                      <h3 className="font-bold text-gray-900">{t("filters.verifiedOnly")}</h3>
                      <p className="text-sm text-gray-600">{t("filters.verifiedOnlyDescription")}</p>
                    </div>
                  </div>
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${
                      modalFilters.verifiedOnly ? "bg-green-600" : "bg-gray-200"
                    }`}
                  >
                    {modalFilters.verifiedOnly && <Check size={16} className="text-white" />}
                  </div>
                </button>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Globe size={20} className="text-[#083f30]" />
                  <h3 className="font-bold text-gray-900">{t("filters.languagesSpoken")}</h3>
                </div>

                <select
                  value=""
                  onChange={(event) => {
                    const value = event.target.value;
                    if (!value) return;

                    const current = modalFilters.languages;
                    if (!current.includes(value)) {
                      form.setValue("languages", [...current, value], { shouldDirty: true });
                    }
                  }}
                  className="h-12 w-full rounded-2xl border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-900 outline-none transition focus:border-[#083f30] focus:ring-2 focus:ring-[#083f30]/10"
                >
                  <option value="">{t("filters.selectLanguage")}</option>
                  {availableLanguages.map((language) => (
                    <option key={language.value} value={language.value}>
                      {language.label} ({language.count})
                    </option>
                  ))}
                </select>

                {selectedLanguageLabels.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {selectedLanguageLabels.map((language) => (
                      <button
                        key={language.value}
                        type="button"
                        onClick={() => {
                          form.setValue(
                            "languages",
                            modalFilters.languages.filter((item) => item !== language.value),
                            { shouldDirty: true },
                          );
                        }}
                        className="inline-flex items-center gap-2 rounded-xl bg-[#083f30] px-3 py-2 text-sm font-semibold text-white shadow-sm"
                      >
                        {language.label}
                        <X size={14} />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="sticky bottom-0 z-20 bg-white border-t border-gray-200 px-5 pb-[calc(env(safe-area-inset-bottom)+5.75rem)] pt-4 sm:pb-4">
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={clearFilters}
                  className="flex-1 h-12 rounded-xl bg-gray-100 text-gray-900 font-bold hover:bg-gray-200 transition-colors"
                >
                  {t("actions.clearAll")}
                </button>
                <button
                  type="submit"
                  className="flex-1 h-12 rounded-xl bg-gradient-to-r from-[#083f30] to-[#0a5a44] text-white font-bold hover:shadow-lg transition-all"
                >
                  {t("actions.applyFilters")}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}