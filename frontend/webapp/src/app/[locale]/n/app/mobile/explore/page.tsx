<<<<<<< HEAD
import { getLocale } from "next-intl/server";

import ExploreClient from "./ExploreClient";
import { getExplorePageData, parseExploreFilters } from "./explore.data";

type SearchParams =
  | Promise<Record<string, string | string[] | undefined>>
  | Record<string, string | string[] | undefined>;

export default async function Explore({
  searchParams,
}: {
  searchParams?: SearchParams;
}) {
  const locale = await getLocale().catch(() => "en");
  const rawSearchParams = await Promise.resolve(searchParams ?? {});
  const filters = parseExploreFilters(rawSearchParams);
  const data = await getExplorePageData({ locale, filters });

  return (
    <ExploreClient
      customerId={data.customerId}
      categories={data.categories}
      providerTypes={data.providerTypes}
      featuredProviders={data.featuredProviders}
      trendingServices={data.trendingServices}
      sponsoredProviders={data.sponsoredProviders}
      availableLanguages={data.availableLanguages}
      availableCurrencies={data.availableCurrencies}
      locale={locale}
      filters={filters}
    />
=======
"use client";

import { useEffect, useState } from "react";
import {
  Award,
  BadgeCheck,
  Check,
  ChevronRight,
  Clock,
  DollarSign,
  Filter,
  Globe,
  Heart,
  MapPin,
  Search,
  SlidersHorizontal,
  Sparkles,
  Star,
  TrendingUp,
  Users,
  X,
} from "lucide-react";

import { useFetchExplore } from "@/features/service-providers/api/client/fetch-explore";
import {
  ExploreCategory,
  ExploreFeaturedProvider,
  ExploreSponsoredProvider,
  ExploreTrendingService,
} from "@/features/service-providers/types";
import { useNavigate } from "@/hooks/use-navigate";

export default function Explore() {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showFilters, setShowFilters] = useState(false);

  // Filter states
  const [filters, setFilters] = useState({
    priceRange: [0, 5000],
    distance: 10,
    minRating: 0,
    verifiedOnly: false,
    languages: [] as string[],
    responseTime: "any" as "any" | "fast" | "instant",
  });

  const [categories, setcategories] = useState<ExploreCategory[]>([]);
  const [featuredProviders, setFeaturedProviders] = useState<
    ExploreFeaturedProvider[]
  >([]);
  const [trendingServices, setTrendingServices] = useState<
    ExploreTrendingService[]
  >([]);
  const [sponsoredProviders, setSponsoredProviders] = useState<
    ExploreSponsoredProvider[]
  >([]);

  const { data ,refetch} = useFetchExplore(filters);

  useEffect(() => {
    // Auto-focus on mount
    if (data?.categories) setcategories(data?.categories);

    if (data?.featuredProviders) setFeaturedProviders(data?.featuredProviders);

    if (data?.sponsoredProviders)
      setSponsoredProviders(data?.sponsoredProviders);

    if (data?.trendingServices) setTrendingServices(data?.trendingServices);
  }, [data]);


  useEffect(() => {
    // Auto-focus on mount
    refetch();
  }, [filters]);

  return (
    <div className="min-h-screen bg-white pb-24">
      {/* Premium Header */}
      <div className="sticky top-0 z-40 border-b border-gray-100 bg-white bg-white/95 px-5 pt-3 pb-4 backdrop-blur-xl">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Explore</h1>
            <p className="mt-0.5 text-sm text-gray-600">
              Discover healthcare worldwide
            </p>
          </div>

          <button
            onClick={() => navigate("/n/app/mobile/search/map")}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-100 transition-colors hover:bg-gray-200"
          >
            <MapPin size={22} className="text-[#083f30]" />
          </button>
        </div>

        {/* Search + Filter */}
        <div className="flex gap-2">
          <button
            onClick={() => navigate("/n/app/mobile/search")}
            className="flex h-12 flex-1 items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 px-4 transition-colors hover:border-[#083f30]"
          >
            <Search size={20} className="text-gray-400" />
            <span className="text-sm font-medium text-gray-500">
              Search services...
            </span>
          </button>

          <button
            onClick={() => setShowFilters(true)}
            className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-[#083f30] transition-colors hover:bg-[#0a5a44]"
          >
            <SlidersHorizontal size={20} className="text-white" />
            {(filters.verifiedOnly ||
              filters.minRating > 0 ||
              filters.languages.length > 0) && (
              <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full border-2 border-white bg-[#eacb7f]" />
            )}
          </button>
        </div>

        {/* Category Pills */}
        <div className="hide-scrollbar -mx-5 mt-3 flex gap-2 overflow-x-auto px-5 pb-1">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`rounded-full px-4 py-2 text-sm font-medium whitespace-nowrap transition-all ${
                selectedCategory === cat.id
                  ? "bg-[#083f30] text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {cat.label} <span className="opacity-70">({cat.count})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Featured Providers */}
      <div className="py-6">
        <div className="mb-4 px-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award size={22} className="text-[#083f30]" />
              <h2 className="text-xl font-bold text-gray-900">
                Featured Providers
              </h2>
            </div>
            <button
              onClick={() => navigate("/n/app/mobile/clinics")}
              className="flex items-center gap-1 text-sm font-semibold text-[#083f30] hover:underline"
            >
              View All
              <ChevronRight size={16} />
            </button>
          </div>
          <p className="mt-1 text-sm text-gray-600">
            Verified and top-rated healthcare providers
          </p>
        </div>

        <div className="space-y-3 px-5">
          {featuredProviders.map((provider) => (
            <div
              key={provider.id}
              onClick={() => navigate(`/n/app/mobile/clinic/${provider.id}`)}
              className="cursor-pointer overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all hover:shadow-lg"
            >
              <div className="flex gap-4 p-4">
                {/* Image */}
                <div className="relative flex-shrink-0">
                  <img
                    src={provider.image}
                    alt={provider.name}
                    className="h-24 w-24 rounded-xl object-cover"
                  />
                  {provider.verified && (
                    <div className="absolute -right-1.5 -bottom-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-[#083f30] shadow-lg">
                      <BadgeCheck size={16} className="text-[#eacb7f]" />
                    </div>
                  )}

                  {/* Badge */}
                  <div className="absolute top-2 left-2 rounded-md bg-white/95 px-2 py-0.5 backdrop-blur-sm">
                    <span className="text-xs font-bold text-[#083f30]">
                      {provider.badge}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <h3 className="mb-1 line-clamp-1 font-bold text-gray-900">
                    {provider.name}
                  </h3>
                  <div className="mb-2 flex items-center gap-1.5">
                    <MapPin size={14} className="flex-shrink-0 text-gray-400" />
                    <span className="line-clamp-1 text-sm text-gray-600">
                      {provider.location}
                    </span>
                  </div>

                  {/* Rating */}
                  <div className="mb-2 flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <Star
                        size={14}
                        className="fill-yellow-400 text-yellow-400"
                      />
                      <span className="text-sm font-bold text-gray-900">
                        {provider.rating}
                      </span>
                      <span className="text-xs text-gray-500">
                        ({provider.reviews.toLocaleString()})
                      </span>
                    </div>
                    <span className="text-gray-300">•</span>
                    <div className="flex items-center gap-1">
                      <Users size={14} className="text-gray-400" />
                      <span className="text-xs text-gray-600">
                        {provider.bookings}
                      </span>
                    </div>
                  </div>

                  {/* Specialties */}
                  <div className="mb-2 flex flex-wrap gap-1.5">
                    {provider.specialties.slice(0, 2).map((specialty) => (
                      <span
                        key={specialty}
                        className="rounded-md bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700"
                      >
                        {specialty}
                      </span>
                    ))}
                    {provider.specialties.length > 2 && (
                      <span className="rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                        +{provider.specialties.length - 2}
                      </span>
                    )}
                  </div>

                  {/* Response Time */}
                  <div className="flex items-center gap-1">
                    <Clock size={12} className="text-green-600" />
                    <span className="text-xs font-medium text-green-700">
                      Responds {provider.responseTime}
                    </span>
                  </div>
                </div>

                {/* Favorite */}
                <button className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gray-50 transition-colors hover:bg-gray-100">
                  <Heart size={18} className="text-gray-600" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sponsored Banner */}
      <div className="px-5 py-4">
        <div className="relative overflow-hidden rounded-2xl shadow-lg">
          <img
            src={sponsoredProviders?.[0]?.image}
            alt="Sponsored"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-purple-900/90 via-purple-800/80 to-transparent" />

          <div className="relative z-10 p-6">
            <span className="mb-3 inline-block rounded-full bg-white/20 px-3 py-1 text-xs font-bold tracking-wide text-white uppercase backdrop-blur-sm">
              {sponsoredProviders?.[0]?.tag}
            </span>
            <h3 className="mb-2 text-xl font-bold text-white">
              {sponsoredProviders?.[0]?.name}
            </h3>
            <p className="mb-4 text-sm text-white/90">
              {sponsoredProviders?.[0]?.subtitle}
            </p>
            <div className="flex items-center gap-3">
              <button className="rounded-xl bg-white px-6 py-3 text-sm font-bold text-purple-900 shadow-lg transition-all hover:bg-gray-100">
                Learn More
              </button>
              <span className="text-2xl font-bold text-white">
                ${sponsoredProviders?.[0]?.price}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Trending Services */}
      <div className="py-6">
        <div className="mb-4 px-5">
          <div className="mb-1 flex items-center gap-2">
            <TrendingUp size={22} className="text-orange-500" />
            <h2 className="text-xl font-bold text-gray-900">
              Trending Services
            </h2>
          </div>
          <p className="text-sm text-gray-600">Most booked this week</p>
        </div>

        <div className="hide-scrollbar flex gap-4 overflow-x-auto px-5 pb-2">
          {trendingServices.map((service) => (
            <div
              key={service.id}
              onClick={() => navigate(`/n/app/mobile/treatment/${service.id}`)}
              className="w-64 flex-none cursor-pointer overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-md transition-all hover:shadow-xl"
            >
              <div className="relative aspect-[16/10]">
                <img
                  src={service.image}
                  alt={service.name}
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

                {/* Growth Badge */}
                <div className="absolute top-3 left-3 flex items-center gap-1 rounded-full bg-green-500 px-2 py-1">
                  <TrendingUp size={12} className="text-white" />
                  <span className="text-xs font-bold text-white">
                    {service.growth}
                  </span>
                </div>

                {/* Favorite */}
                <button className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 backdrop-blur-sm">
                  <Heart size={16} className="text-gray-700" />
                </button>
              </div>

              <div className="p-4">
                <h3 className="mb-1 line-clamp-1 font-bold text-gray-900">
                  {service.name}
                </h3>
                <p className="mb-3 line-clamp-1 text-sm text-gray-600">
                  {service.provider}
                </p>

                <div className="mb-3 flex items-center gap-1">
                  <MapPin size={12} className="text-gray-400" />
                  <span className="text-xs text-gray-500">
                    {service.location}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Star
                      size={14}
                      className="fill-yellow-400 text-yellow-400"
                    />
                    <span className="text-sm font-bold">{service.rating}</span>
                    <span className="text-xs text-gray-500">
                      ({service.reviews})
                    </span>
                  </div>

                  <div className="text-right">
                    {service.originalPrice && (
                      <div className="text-xs text-gray-400 line-through">
                        ${service.originalPrice}
                      </div>
                    )}
                    <div className="font-bold text-[#083f30]">
                      ${service.price}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Browse by Categories */}
      <div className="px-5 py-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Browse Categories</h2>
          <button
            onClick={() => navigate("/n/app/mobile/categories")}
            className="flex items-center gap-1 text-sm font-semibold text-[#083f30] hover:underline"
          >
            View All
            <ChevronRight size={16} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {[
            {
              label: "Medical",
              image:
                "/unsplash_images/photo-1631217868264-e5b90bb7e133__w=400&h=300&fit=crop.jpg",
              count: 482,
            },
            {
              label: "Beauty & Spa",
              image:
                "/unsplash_images/photo-1560066984-138dadb4c035__w=400&h=300&fit=crop.jpg",
              count: 231,
            },
            {
              label: "Fitness",
              image:
                "/unsplash_images/photo-1534438327276-14e5300c3a48__w=400&h=300&fit=crop.jpg",
              count: 156,
            },
            {
              label: "Hotels",
              image:
                "/unsplash_images/photo-1566073771259-6a8506099945__w=400&h=300&fit=crop.jpg",
              count: 189,
            },
          ].map((cat, idx) => (
            <button
              key={idx}
              onClick={() => navigate("/n/app/mobile/categories")}
              className="group relative aspect-[4/3] overflow-hidden rounded-2xl shadow-sm transition-all hover:shadow-xl"
            >
              <img
                src={cat.image}
                alt={cat.label}
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />

              <div className="relative z-10 flex h-full flex-col justify-end p-4">
                <h3 className="mb-1 text-lg font-bold text-white">
                  {cat.label}
                </h3>
                <p className="text-xs text-white/90">{cat.count} providers</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Advanced Filters Modal */}
      {showFilters && (
        <div className="animate-in fade-in fixed inset-0 z-50 flex items-end bg-black/50 duration-200">
          <div className="animate-in slide-in-from-bottom max-h-[85vh] w-full overflow-y-auto rounded-t-3xl bg-white duration-300">
            {/* Header */}
            <div className="sticky top-0 z-10 border-b border-gray-200 bg-white px-5 py-4">
              <div className="mb-2 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">
                  Advanced Filters
                </h2>
                <button
                  onClick={() => setShowFilters(false)}
                  className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-gray-100"
                >
                  <X size={20} className="text-gray-600" />
                </button>
              </div>
              <p className="text-sm text-gray-600">
                Find exactly what you're looking for
              </p>
            </div>

            {/* Filters Content */}
            <div className="space-y-6 px-5 py-6">
              {/* Price Range */}
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign size={20} className="text-[#083f30]" />
                    <h3 className="font-bold text-gray-900">Price Range</h3>
                  </div>
                  <span className="text-sm font-semibold text-[#083f30]">
                    ${filters.priceRange[0]} - ${filters.priceRange[1]}
                  </span>
                </div>
                <div className="space-y-2">
                  <input
                    type="range"
                    min="0"
                    max="10000"
                    step="100"
                    value={filters.priceRange[1]}
                    onChange={(e) =>
                      setFilters({
                        ...filters,
                        priceRange: [0, parseInt(e.target.value)],
                      })
                    }
                    className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-200"
                    style={{
                      background: `linear-gradient(to right, #083f30 0%, #083f30 ${(filters.priceRange[1] / 10000) * 100}%, #e5e7eb ${(filters.priceRange[1] / 10000) * 100}%, #e5e7eb 100%)`,
                    }}
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>$0</span>
                    <span>$10,000+</span>
                  </div>
                </div>
              </div>

              {/* Minimum Rating */}
              <div>
                <div className="mb-3 flex items-center gap-2">
                  <Star size={20} className="text-[#083f30]" />
                  <h3 className="font-bold text-gray-900">Minimum Rating</h3>
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {[0, 3.0, 3.5, 4.0, 4.5].map((rating) => (
                    <button
                      key={rating}
                      onClick={() =>
                        setFilters({ ...filters, minRating: rating })
                      }
                      className={`flex h-12 flex-col items-center justify-center rounded-xl font-semibold transition-all ${
                        filters.minRating === rating
                          ? "bg-[#083f30] text-white shadow-md"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      <span className="text-sm">
                        {rating === 0 ? "Any" : `${rating}+`}
                      </span>
                      {rating > 0 && (
                        <Star size={12} className="fill-current" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Response Time */}
              <div>
                <div className="mb-3 flex items-center gap-2">
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
                      key={option.value}
                      onClick={() =>
                        setFilters({
                          ...filters,
                          responseTime: option.value as any,
                        })
                      }
                      className={`h-12 rounded-xl font-semibold transition-all ${
                        filters.responseTime === option.value
                          ? "bg-[#083f30] text-white shadow-md"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Verified Only */}
              <div>
                <button
                  onClick={() =>
                    setFilters({
                      ...filters,
                      verifiedOnly: !filters.verifiedOnly,
                    })
                  }
                  className={`flex w-full items-center justify-between rounded-2xl border-2 p-4 transition-all ${
                    filters.verifiedOnly
                      ? "border-green-200 bg-green-50"
                      : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                        filters.verifiedOnly ? "bg-green-600" : "bg-gray-100"
                      }`}
                    >
                      <BadgeCheck
                        size={24}
                        className={
                          filters.verifiedOnly ? "text-white" : "text-gray-400"
                        }
                      />
                    </div>
                    <div className="text-left">
                      <h3 className="font-bold text-gray-900">
                        Verified Providers Only
                      </h3>
                      <p className="text-sm text-gray-600">
                        Show only accredited clinics
                      </p>
                    </div>
                  </div>
                  <div
                    className={`flex h-6 w-6 items-center justify-center rounded-full transition-colors ${
                      filters.verifiedOnly ? "bg-green-600" : "bg-gray-200"
                    }`}
                  >
                    {filters.verifiedOnly && (
                      <Check size={16} className="text-white" />
                    )}
                  </div>
                </button>
              </div>

              {/* Languages */}
              <div>
                <div className="mb-3 flex items-center gap-2">
                  <Globe size={20} className="text-[#083f30]" />
                  <h3 className="font-bold text-gray-900">Languages Spoken</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {[
                    "English",
                    "Arabic",
                    "Turkish",
                    "German",
                    "French",
                    "Spanish",
                    "Russian",
                    "Chinese",
                  ].map((lang) => (
                    <button
                      key={lang}
                      onClick={() => {
                        if (filters.languages.includes(lang)) {
                          setFilters({
                            ...filters,
                            languages: filters.languages.filter(
                              (l) => l !== lang
                            ),
                          });
                        } else {
                          setFilters({
                            ...filters,
                            languages: [...filters.languages, lang],
                          });
                        }
                      }}
                      className={`rounded-xl px-4 py-2 font-medium transition-all ${
                        filters.languages.includes(lang)
                          ? "bg-[#083f30] text-white shadow-md"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              </div>

              {/* Service Types */}
              <div>
                <div className="mb-3 flex items-center gap-2">
                  <Award size={20} className="text-[#083f30]" />
                  <h3 className="font-bold text-gray-900">Popular Services</h3>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    "Hair Transplant",
                    "Dental Veneers",
                    "IVF Treatment",
                    "Cosmetic Surgery",
                    "Botox & Fillers",
                    "Wellness Retreats",
                  ].map((service) => (
                    <button
                      key={service}
                      className="h-12 rounded-xl bg-gray-100 px-3 text-sm font-medium text-gray-700 transition-all hover:bg-gray-200"
                    >
                      {service}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="sticky bottom-0 border-t border-gray-200 bg-white px-5 py-4">
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setFilters({
                      priceRange: [0, 5000],
                      distance: 10,
                      minRating: 0,
                      verifiedOnly: false,
                      languages: [],
                      responseTime: "any",
                    });
                  }}
                  className="h-12 flex-1 rounded-xl bg-gray-100 font-bold text-gray-900 transition-colors hover:bg-gray-200"
                >
                  Clear All
                </button>
                <button
                  onClick={() => setShowFilters(false)}
                  className="h-12 flex-1 rounded-xl bg-gradient-to-r from-[#083f30] to-[#0a5a44] font-bold text-white transition-all hover:shadow-lg"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965
  );
}
