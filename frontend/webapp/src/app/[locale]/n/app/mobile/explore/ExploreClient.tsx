"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { env } from "@/config/env/client";
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

import { ImageWithFallback } from "../../components/figma/ImageWithFallback";

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
  ExploreFeaturedProvider,
  ExploreFiltersInput,
  ExploreProviderType,
  ExploreSponsoredProvider,
  ExploreTrendingService,
} from "./explore.data";

type FilterFormValues = {
  countryCode: string | null;
  cityCode: string | null;
  maxPrice: number;
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
  minRating: number;
  verifiedOnly: boolean;
  languages: string[];
  responseTime: "any" | "fast" | "instant";
};

function buildExploreQuery(next: ExploreFiltersInput) {
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
  if (next.minRating > 0) params.set("minRating", String(next.minRating));
  if (next.verifiedOnly) params.set("verifiedOnly", "1");
  if (next.languages.length > 0) params.set("languages", next.languages.join(","));
  if (next.responseTime !== "any") params.set("responseTime", next.responseTime);
  if (next.sort && next.sort !== "recommended") params.set("sort", next.sort);

  const query = params.toString();
  return query ? `/n/app/mobile/explore?${query}` : "/n/app/mobile/explore";
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

function resolveMediaSrc(src: string | null | undefined) {
  const value = src?.trim();

  if (!value || value === "/placeholder.svg") return "/placeholder.svg";
  if (value.startsWith("data:") || value.startsWith("blob:") || /^https?:\/\//i.test(value)) {
    return value;
  }

  const baseUrl = env.NEXT_PUBLIC_FILES_URL?.replace(/\/$/, "");
  return baseUrl ? `${baseUrl}/${value.replace(/^\/+/, "")}` : value;
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
  locale,
  filters: initialFilters,
}: {
  customerId: string | null;
  categories: ExploreCategory[];
  providerTypes: ExploreProviderType[];
  featuredProviders: ExploreFeaturedProvider[];
  trendingServices: ExploreTrendingService[];
  sponsoredProviders: ExploreSponsoredProvider[];
  availableLanguages: string[];
  locale: string;
  filters: ExploreFiltersInput;
}) {
  const router = useRouter();
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
      minRating: watched.minRating ?? 0,
      verifiedOnly: watched.verifiedOnly ?? false,
      languages: watched.languages ?? [],
      responseTime: watched.responseTime ?? "any",
    }),
    [watched],
  );

  const selectedCountryCode = watched.countryCode ?? null;

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
      minRating: 0,
      verifiedOnly: false,
      languages: [],
      responseTime: "any",
    };

    form.reset({
      countryCode: null,
      cityCode: null,
      maxPrice: 5000,
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
        minRating: 0,
        verifiedOnly: false,
        languages: [],
        responseTime: "any",
      }),
    );
  };

  const searchLabel = initialFilters.q ? initialFilters.q : "Search services...";
  const visibleProviderTypes = showAllProviderTypes
    ? providerTypes
    : providerTypes.slice(0, 4);

  return (
    <div className="relative min-h-screen bg-white pb-24">
      {isPending && <ExplorePendingOverlay />}

      <div className="bg-white px-5 pt-3 pb-4 border-b border-gray-100 sticky top-0 z-40 backdrop-blur-xl bg-white/95">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Explore</h1>
            <p className="text-sm text-gray-600 mt-0.5">Discover healthcare worldwide</p>
          </div>

          <button
            onClick={() => router.push("/en/n/app/mobile/map-discovery")}
            className="w-11 h-11 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
          >
            <MapPin size={22} className="text-[#083f30]" />
          </button>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() =>
              router.push(
                buildExploreQuery(initialFilters).replace("/n/app/mobile/explore", "/en/n/app/mobile/search"),
              )
            }
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
              <h2 className="text-xl font-bold text-gray-900">Featured Providers</h2>
            </div>
            <button
              onClick={() =>
                router.push(
                  buildExploreQuery(initialFilters).replace("/n/app/mobile/explore", "/app/clinics"),
                )
              }
              className="text-sm font-semibold text-[#083f30] hover:underline flex items-center gap-1"
            >
              View All
              <ChevronRight size={16} />
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-1">Verified and top-rated healthcare providers</p>
        </div>

        <div className="space-y-3 px-5">
          {featuredProviders.map((provider) => (
            <div
              key={`featured-provider-${provider.id}`}
              onClick={() => router.push(`/en/n/app/mobile/provider/${provider.id}`)}
              className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-lg transition-all cursor-pointer"
            >
              <div className="flex gap-4 p-4">
                <div className="relative flex-shrink-0">
                  <ImageWithFallback
                    src={resolveMediaSrc(provider.image)}
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
                    <span className="text-xs font-medium text-green-700">Responds {provider.responseTime}</span>
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
              src={resolveMediaSrc(sponsoredProviders[0].image)}
              alt="Sponsored"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-purple-900/90 via-purple-800/80 to-transparent" />

            <div className="relative z-10 p-6">
              <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-bold text-white uppercase tracking-wide mb-3">
                {sponsoredProviders[0].tag}
              </span>
              <h3 className="text-xl font-bold text-white mb-2">{sponsoredProviders[0].name}</h3>
              <p className="text-white/90 text-sm mb-4">{sponsoredProviders[0].subtitle}</p>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => router.push(`/en/n/app/mobile/provider/${sponsoredProviders[0].id}`)}
                  className="bg-white text-purple-900 px-6 py-3 rounded-xl font-bold text-sm hover:bg-gray-100 transition-all shadow-lg"
                >
                  Learn More
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
            <h2 className="text-xl font-bold text-gray-900">Trending Services</h2>
          </div>
          <p className="text-sm text-gray-600">Most booked this week</p>
        </div>

        <div className="flex gap-4 overflow-x-auto hide-scrollbar px-5 pb-2">
          {trendingServices.map((service) => (
            <div
              key={`trending-service-${service.id}`}
              onClick={() => router.push(`/en/n/app/mobile/service/${service.id}`)}
              className="flex-none w-64 bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all cursor-pointer border border-gray-100"
            >
              <div className="relative aspect-[16/10]">
                <ImageWithFallback
                  src={resolveMediaSrc(service.image)}
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
                      <div className="text-xs text-gray-400 line-through">{formatPrice(service.originalPrice)}</div>
                    )}
                    <div className="font-bold text-[#083f30]">{formatPrice(service.price)}</div>
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
            <h2 className="text-xl font-bold text-gray-900">Browse Provider Types</h2>
            <p className="text-sm text-gray-600 mt-1">Choose the kind of provider you need</p>
          </div>
          {providerTypes.length > 4 && (
            <button
              type="button"
              onClick={() => setShowAllProviderTypes((current) => !current)}
              className="text-sm font-semibold text-[#083f30] hover:underline flex items-center gap-1"
            >
              {showAllProviderTypes ? "Show Less" : "View All"}
              <ChevronRight
                size={16}
                className={showAllProviderTypes ? "rotate-90 transition-transform" : "transition-transform"}
              />
            </button>
          )}
        </div>

        {providerTypes.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-5 text-sm text-gray-500">
            No provider types are available yet.
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
                className={`relative cursor-pointer rounded-2xl overflow-hidden aspect-[4/3] group shadow-sm hover:shadow-xl transition-all ${
                  activeUiFilters.providerTypeId === providerType.id ? "ring-2 ring-[#eacb7f]" : ""
                }`}
              >
                <ImageWithFallback
                  src={resolveMediaSrc(providerType.image)}
                  alt={providerType.label}
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/30 to-black/5" />

                <div className="relative z-10 flex h-full flex-col justify-end p-4">
                  <h3 className="text-white font-bold text-lg mb-1 line-clamp-1">
                    {providerType.label}
                  </h3>
                  <div className="mb-2 line-clamp-2 text-xs leading-5 text-white/90 [&_*]:text-white/90">
                    {providerType.description && hasLexicalContent(providerType.description) ? (
                      <LexicalRenderer
                        content={providerType.description}
                        className="line-clamp-2 text-white/90"
                      />
                    ) : (
                      <p className="line-clamp-2 text-white/90">-</p>
                    )}
                  </div>
                  <p className="text-white/90 text-xs">{providerType.count} providers</p>
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
            onClick={() => router.push("/app/categories")}
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
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end animate-in fade-in duration-200">
          <form
            onSubmit={applyFilters}
            className="w-full bg-white rounded-t-3xl max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom duration-300"
          >
            <div className="sticky top-0 bg-white border-b border-gray-200 px-5 py-4 z-10">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl font-bold text-gray-900">Advanced Filters</h2>
                <button
                  type="button"
                  onClick={() => setShowFilters(false)}
                  className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
                >
                  <X size={20} className="text-gray-600" />
                </button>
              </div>
              <p className="text-sm text-gray-600">Find exactly what you're looking for</p>
            </div>

            <div className="px-5 py-6 space-y-6">
              <div>
                <div className="mb-3 flex items-center gap-2">
                  <MapPin size={20} className="text-[#083f30]" />
                  <h3 className="font-bold text-gray-900">Location</h3>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <LazySearchableSelect
                    label="Country"
                    value={modalFilters.countryCode}
                    placeholder="Select country"
                    searchPlaceholder="Search countries..."
                    emptyText="No countries found."
                    loadOptions={loadCountryOptions}
                    loadByValue={loadSelectedCountry}
                    onChange={(value) => {
                      form.setValue("countryCode", value, { shouldDirty: true });
                      form.setValue("cityCode", null, { shouldDirty: true });
                    }}
                  />
                  <LazySearchableSelect
                    key={modalFilters.countryCode ?? "no-country"}
                    label="City"
                    value={modalFilters.cityCode}
                    disabled={!modalFilters.countryCode}
                    placeholder={modalFilters.countryCode ? "Select city" : "Select country first"}
                    searchPlaceholder="Search cities..."
                    emptyText="No cities found for this country."
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
                    <h3 className="font-bold text-gray-900">Price Range</h3>
                  </div>
                  <span className="text-sm font-semibold text-[#083f30]">
                    $0 - ${modalFilters.priceRange[1]}
                  </span>
                </div>
                <div className="space-y-2">
                  <input
                    type="range"
                    min="0"
                    max="10000"
                    step="100"
                    value={modalFilters.priceRange[1]}
                    onChange={(e) => form.setValue("maxPrice", Number(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, #083f30 0%, #083f30 ${(modalFilters.priceRange[1] / 10000) * 100}%, #e5e7eb ${(modalFilters.priceRange[1] / 10000) * 100}%, #e5e7eb 100%)`,
                    }}
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>$0</span>
                    <span>$10,000+</span>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Star size={20} className="text-[#083f30]" />
                  <h3 className="font-bold text-gray-900">Minimum Rating</h3>
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
                      <span className="text-sm">{rating === 0 ? "Any" : `${rating}+`}</span>
                      {rating > 0 && <Star size={12} className="fill-current" />}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Clock size={20} className="text-[#083f30]" />
                  <h3 className="font-bold text-gray-900">Response Time</h3>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: "any", label: "Any" },
                    { value: "fast", label: "< 1 hour" },
                    { value: "instant", label: "< 30 min" },
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
                      <h3 className="font-bold text-gray-900">Verified Providers Only</h3>
                      <p className="text-sm text-gray-600">Show only accredited clinics</p>
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
                  <h3 className="font-bold text-gray-900">Languages Spoken</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {availableLanguages.map((lang) => (
                    <button
                      type="button"
                      key={lang}
                      onClick={() => {
                        const current = modalFilters.languages;
                        const next = current.includes(lang)
                          ? current.filter((item) => item !== lang)
                          : [...current, lang];
                        form.setValue("languages", next);
                      }}
                      className={`px-4 py-2 rounded-xl font-medium transition-all ${
                        modalFilters.languages.includes(lang)
                          ? "bg-[#083f30] text-white shadow-md"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-white border-t border-gray-200 px-5 py-4">
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={clearFilters}
                  className="flex-1 h-12 rounded-xl bg-gray-100 text-gray-900 font-bold hover:bg-gray-200 transition-colors"
                >
                  Clear All
                </button>
                <button
                  type="submit"
                  className="flex-1 h-12 rounded-xl bg-gradient-to-r from-[#083f30] to-[#0a5a44] text-white font-bold hover:shadow-lg transition-all"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}