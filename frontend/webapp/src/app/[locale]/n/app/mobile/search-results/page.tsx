"use client";

import { useEffect, useState } from "react";
import {
  ArrowUpDown,
  BadgeCheck,
  ChevronLeft,
  Filter,
  Heart,
  MapPin,
  SlidersHorizontal,
  Star,
  X,
} from "lucide-react";
import { useSearchParams } from "next/navigation";

import { useFetchSearchResults } from "@/features/service-providers/api/client/fetch-search-results";
import {
  SearchResultsCategory,
  SearchResultsFilter,
  SearchResultsItem,
} from "@/features/service-providers/types";
import { useNavigate } from "@/hooks/use-navigate";

export default function SearchResults() {
  const navigate = useNavigate();
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("relevance");
  const [showFilters, setShowFilters] = useState(false);

  const { data } = useFetchSearchResults();

  useEffect(() => {
    // Auto-focus on mount
    if (data?.results) setResults(data?.results);
    if (data?.categories) setCategories(data?.categories);
    if (data?.filters) setFilters(data?.filters);
  }, [data]);

  const [results, setResults] = useState<SearchResultsItem[]>([]);
  const [filters, setFilters] = useState<SearchResultsFilter[]>([]);

  const [categories, setCategories] = useState<SearchResultsCategory[]>([
    // { id: 'all', label: 'All Results' },
    // { id: 'clinics', label: 'Clinics' },
    // { id: 'treatments', label: 'Treatments' },
    // { id: 'doctors', label: 'Doctors' },
    // { id: 'packages', label: 'Packages' },
  ]);

  const sortOptions = [
    { value: "relevance", label: "Most Relevant" },
    { value: "rating", label: "Highest Rated" },
    { value: "price-low", label: "Price: Low to High" },
    { value: "price-high", label: "Price: High to Low" },
    { value: "popular", label: "Most Popular" },
  ];

  /* const results = [
    {
      id: 1,
      type: 'treatment',
      name: 'Premium Hair Transplant Package',
      provider: 'Istanbul Medical Center',
      image: '/unsplash_images/photo-1622296089863-eb7fc530daa8__w=600&h=400&fit=crop.jpg',
      location: 'Istanbul, Turkey',
      rating: 4.9,
      reviews: 2847,
      price: 2499,
      originalPrice: 3200,
      verified: true,
      tags: ['All-Inclusive', 'Best Value']
    },
    {
      id: 2,
      type: 'clinic',
      name: 'Dubai Smile Clinic',
      provider: 'Dental Excellence',
      image: '/unsplash_images/photo-1629909613654-28e377c37b09__w=600&h=400&fit=crop.jpg',
      location: 'Dubai, UAE',
      rating: 4.9,
      reviews: 1523,
      verified: true,
      specialties: ['Veneers', 'Implants', 'Whitening']
    },
    {
      id: 3,
      type: 'treatment',
      name: 'IVF Treatment Complete Cycle',
      provider: 'Cyprus Fertility Center',
      image: '/unsplash_images/photo-1584515979956-d9f6e5d09982__w=600&h=400&fit=crop.jpg',
      location: 'Nicosia, Cyprus',
      rating: 4.8,
      reviews: 456,
      price: 3800,
      verified: true,
      tags: ['Premium']
    },
    {
      id: 4,
      type: 'treatment',
      name: 'Hollywood Smile Veneers',
      provider: 'Bangkok Dental Studio',
      image: '/unsplash_images/photo-1588776814546-1ffcf47267a5__w=600&h=400&fit=crop.jpg',
      location: 'Bangkok, Thailand',
      rating: 4.9,
      reviews: 892,
      price: 2800,
      originalPrice: 3500,
      verified: true,
      tags: ['Top Rated']
    },
    {
      id: 5,
      type: 'clinic',
      name: 'Bali Wellness Resort',
      provider: 'Holistic Health',
      image: '/unsplash_images/photo-1540555700478-4be289fbecef__w=600&h=400&fit=crop.jpg',
      location: 'Ubud, Bali',
      rating: 5.0,
      reviews: 234,
      verified: true,
      specialties: ['Spa', 'Yoga', 'Detox']
    },
  ]; */

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="sticky top-0 z-40 border-b border-gray-100 bg-white">
        <div className="px-5 pt-3 pb-4">
          <div className="mb-4 flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-gray-100"
            >
              <ChevronLeft size={24} className="text-gray-700" />
            </button>

            <div className="flex-1">
              <h1 className="line-clamp-1 font-bold text-gray-900">
                "{query}"
              </h1>
              <p className="text-sm text-gray-600">
                {results.length} results found
              </p>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="hide-scrollbar -mx-5 mb-3 flex gap-2 overflow-x-auto px-5">
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
                {cat.label}
              </button>
            ))}
          </div>

          {/* Filter & Sort Row */}
          <div className="flex gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 transition-colors hover:bg-gray-100"
            >
              <SlidersHorizontal size={18} className="text-gray-700" />
              <span className="text-sm font-medium text-gray-700">Filters</span>
            </button>

            <div className="relative flex-1">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="h-10 w-full appearance-none rounded-xl border border-gray-200 bg-gray-50 px-4 pr-10 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 focus:border-[#083f30] focus:outline-none"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <ArrowUpDown
                size={16}
                className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-gray-500"
              />
            </div>
          </div>
        </div>

        {/* Active Filters */}
        {showFilters && (
          <div className="flex flex-wrap gap-2 px-5 pb-3">

            {filters?.map(filter=>{

return  <div className="flex items-center gap-1.5 rounded-full bg-[#083f30] px-3 py-1.5 text-xs font-medium text-white">
              <span>{filter.label}</span>
              <button className="rounded-full p-0.5 hover:bg-white/20">
                <X size={12} />
              </button>
            </div>
            })}

          {/*   <div className="flex items-center gap-1.5 rounded-full bg-[#083f30] px-3 py-1.5 text-xs font-medium text-white">
              <span>Verified Only</span>
              <button className="rounded-full p-0.5 hover:bg-white/20">
                <X size={12} />
              </button>
            </div>
            <div className="flex items-center gap-1.5 rounded-full bg-[#083f30] px-3 py-1.5 text-xs font-medium text-white">
              <span>4+ Stars</span>
              <button className="rounded-full p-0.5 hover:bg-white/20">
                <X size={12} />
              </button>
            </div> */}
          </div>
        )}
      </div>

      {/* Results */}
      <div className="space-y-4 px-5 py-4">
        {results.map((result) => (
          <div
            key={result.id}
            onClick={() =>
              navigate(
                result.type === "clinic"
                  ? `/app/clinic/${result.id}`
                  : `/app/treatment/${result.id}`
              )
            }
            className="cursor-pointer overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all hover:shadow-lg"
          >
            <div className="flex gap-4 p-4">
              {/* Image */}
              <div className="relative flex-shrink-0">
                <img
                  src={result.image}
                  alt={result.name}
                  className="h-28 w-28 rounded-xl object-cover"
                />
                {result.verified && (
                  <div className="absolute -right-1.5 -bottom-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-[#083f30] shadow-lg">
                    <BadgeCheck size={16} className="text-[#eacb7f]" />
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-start justify-between gap-2">
                  <h3 className="line-clamp-2 leading-tight font-bold text-gray-900">
                    {result.name}
                  </h3>
                  <button className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gray-50 transition-colors hover:bg-gray-100">
                    <Heart size={16} className="text-gray-600" />
                  </button>
                </div>

                <p className="mb-2 line-clamp-1 text-sm text-gray-600">
                  {result.provider}
                </p>

                <div className="mb-2 flex items-center gap-1.5">
                  <MapPin size={14} className="flex-shrink-0 text-gray-400" />
                  <span className="line-clamp-1 text-sm text-gray-600">
                    {result.location}
                  </span>
                </div>

                {/* Rating */}
                <div className="mb-3 flex items-center gap-1.5">
                  <Star size={14} className="fill-yellow-400 text-yellow-400" />
                  <span className="text-sm font-bold text-gray-900">
                    {result.rating}
                  </span>
                  <span className="text-xs text-gray-500">
                    ({result.reviews.toLocaleString()} reviews)
                  </span>
                </div>

                {/* Tags or Specialties */}
                {result.tags && (
                  <div className="mb-2 flex flex-wrap gap-1.5">
                    {result.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="rounded-md bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {result.specialties && (
                  <div className="mb-2 flex flex-wrap gap-1.5">
                    {result.specialties.slice(0, 2).map((specialty, idx) => (
                      <span
                        key={idx}
                        className="rounded-md bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700"
                      >
                        {specialty}
                      </span>
                    ))}
                  </div>
                )}

                {/* Price */}
                {result.price && (
                  <div className="flex items-center gap-2">
                    {result.originalPrice && (
                      <span className="text-xs text-gray-400 line-through">
                        ${result.originalPrice.toLocaleString()}
                      </span>
                    )}
                    <span className="font-bold text-[#083f30]">
                      ${result.price.toLocaleString()}
                    </span>
                    {result.originalPrice && (
                      <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs font-bold text-green-600">
                        Save $
                        {(result.originalPrice - result.price).toLocaleString()}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* No Results State */}
      {results.length === 0 && (
        <div className="px-5 py-16 text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gray-100">
            <Filter size={32} className="text-gray-400" />
          </div>
          <h3 className="mb-2 font-bold text-gray-900">No results found</h3>
          <p className="mb-6 text-gray-600">
            Try adjusting your filters or search terms
          </p>
          <button
            onClick={() => navigate("/app/search")}
            className="rounded-xl bg-[#083f30] px-6 py-3 font-semibold text-white transition-colors hover:bg-[#0a5a44]"
          >
            New Search
          </button>
        </div>
      )}
    </div>
  );
}
