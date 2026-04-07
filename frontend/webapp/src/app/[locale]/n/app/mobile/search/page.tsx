"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowUpRight,
  Clock,
  Search as SearchIcon,
  TrendingUp,
  X,
} from "lucide-react";

import {
  useGetServiceHistory,
} from "@/features/service-providers/api/client/fetch-search-history";
import { useNavigate } from "@/hooks/use-navigate";

export default async function Search() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [recentSearches, setRecentSearches] = useState([
    // "Hair Transplant in Istanbul",
    // "Dental Veneers Dubai",
    // "IVF Cyprus",
    // "Spa Bali",
  ]);

  const [popularCategories, setPopularCategories] = useState([
    // { label: "Medical Tourism", icon: "🏥" },
    // { label: "Dental Care", icon: "🦷" },
    // { label: "Cosmetic Surgery", icon: "💉" },
    // { label: "Wellness & Spa", icon: "🧘" },
    // { label: "Fertility", icon: "👶" },
    // { label: "Fitness", icon: "💪" },
  ]);

  const [trendingSearches, setTrendingSearches] = useState(
    [
    // { query: "Hair Transplant", trend: "+45%" },
    // { query: "Dental Veneers", trend: "+38%" },
    // { query: "IVF Treatment", trend: "+32%" },
    // { query: "Rhinoplasty", trend: "+28%" },
    // { query: "Laser Eye Surgery", trend: "+25%" },
    // { query: "Weight Loss Surgery", trend: "+22%" },
  ]);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Auto-focus on mount
    inputRef.current?.focus();
  }, []);

  const { data } = useGetServiceHistory();

  useEffect(() => {
    // Auto-focus on mount
    if (data?.recentSearches) setRecentSearches(data?.recentSearches);
    if (data?.popularCategories) setPopularCategories(data?.popularCategories);
    if (data?.trendingSearches) setTrendingSearches(data?.trendingSearches);
  }, [data]);

  const handleSearch = (query: string) => {
    if (query.trim()) {
      navigate(`/n/app/mobile/search-results?q=${encodeURIComponent(query)}`);
    }
  };

  const handleRemoveRecent = (index: number) => {
    setRecentSearches((prev) => prev.filter((_, i) => i !== index));
  };

  const handleClearAll = () => {
    setRecentSearches([]);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header with Search */}
      <div className="sticky top-0 z-40 border-b border-gray-100 bg-white px-5 pt-3 pb-4">
        <div className="mb-4 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full transition-colors hover:bg-gray-100"
          >
            <X size={24} className="text-gray-700" />
          </button>

          <div className="relative flex-1">
            <SearchIcon
              size={20}
              className="absolute top-1/2 left-4 -translate-y-1/2 text-gray-400"
            />
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch(searchQuery)}
              placeholder="Search treatments, clinics, doctors..."
              className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50 pr-12 pl-12 text-gray-900 placeholder-gray-500 transition-all focus:border-[#083f30] focus:ring-2 focus:ring-[#083f30]/10 focus:outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute top-1/2 right-4 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full bg-gray-200 transition-colors hover:bg-gray-300"
              >
                <X size={14} className="text-gray-600" />
              </button>
            )}
          </div>
        </div>

        {searchQuery && (
          <button
            onClick={() => handleSearch(searchQuery)}
            className="h-11 w-full rounded-xl bg-[#083f30] font-semibold text-white transition-colors hover:bg-[#0a5a44]"
          >
            Search
          </button>
        )}
      </div>

      <div className="px-5 py-6">
        {/* Recent Searches */}
        {recentSearches.length > 0 && (
          <div className="mb-8">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock size={20} className="text-gray-600" />
                <h2 className="font-bold text-gray-900">Recent Searches</h2>
              </div>
              <button
                onClick={handleClearAll}
                className="text-sm font-semibold text-[#083f30] hover:underline"
              >
                Clear All
              </button>
            </div>

            <div className="space-y-2">
              {recentSearches.map((search, index) => (
                <div
                  key={index}
                  className="group flex items-center gap-3 rounded-xl p-3 transition-colors hover:bg-gray-50"
                >
                  <button
                    onClick={() => handleSearch(search)}
                    className="flex flex-1 items-center gap-3 text-left"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 transition-colors group-hover:bg-gray-200">
                      <Clock size={18} className="text-gray-600" />
                    </div>
                    <span className="font-medium text-gray-900">{search}</span>
                  </button>
                  <button
                    onClick={() => handleRemoveRecent(index)}
                    className="flex h-8 w-8 items-center justify-center rounded-full opacity-0 transition-colors group-hover:opacity-100 hover:bg-gray-200"
                  >
                    <X size={16} className="text-gray-500" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Trending Searches */}
        <div className="mb-8">
          <div className="mb-4 flex items-center gap-2">
            <TrendingUp size={20} className="text-orange-500" />
            <h2 className="font-bold text-gray-900">Trending Now</h2>
          </div>

          <div className="space-y-2">
            {trendingSearches.map((item, index) => (
              <button
                key={index}
                onClick={() => handleSearch(item.query)}
                className="group flex w-full items-center justify-between rounded-xl p-3 transition-colors hover:bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-50 transition-colors group-hover:bg-orange-100">
                    <TrendingUp size={18} className="text-orange-600" />
                  </div>
                  <span className="font-medium text-gray-900">
                    {item.query}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-green-50 px-2 py-1 text-xs font-bold text-green-600">
                    {item.trend}
                  </span>
                  <ArrowUpRight
                    size={18}
                    className="text-gray-400 transition-colors group-hover:text-[#083f30]"
                  />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Popular Categories */}
        <div>
          <h2 className="mb-4 font-bold text-gray-900">Popular Categories</h2>

          <div className="grid grid-cols-2 gap-3">
            {popularCategories.map((category, index) => (
              <button
                key={index}
                onClick={() => handleSearch(category.label)}
                className="group rounded-2xl bg-gray-50 p-4 transition-colors hover:bg-gray-100"
              >
                <div className="mb-2 text-3xl">{category.icon}</div>
                <div className="text-sm font-semibold text-gray-900 transition-colors group-hover:text-[#083f30]">
                  {category.label}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Quick Tips */}
        <div className="mt-8 rounded-2xl border border-blue-100 bg-blue-50 p-4">
          <h3 className="mb-2 font-bold text-blue-900">Search Tips</h3>
          <ul className="space-y-1 text-sm text-blue-800">
            <li>• Try searching by treatment name, condition, or specialty</li>
            <li>• Add a location for more specific results</li>
            <li>• Use quotes for exact phrase matches</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
