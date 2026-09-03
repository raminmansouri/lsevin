"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import {
  ArrowUpRight,
  Clock,
  Image as ImageIcon,
  Loader2,
  Search as SearchIcon,
  Sparkles,
  TrendingUp,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";

import { ImageWithFallback } from "@/components/ui/image-with-fallback";
import { env } from "@/config/env/client";
import { useNavigate } from "@/hooks/use-navigate";

import {
  clearSearchHistoryAction,
  getRecentSearchesAction,
  recordSearchTermAction,
} from "../../actions/search";
import type {
  SearchHistoryPopularCategoryVm,
  SearchHistoryResponse,
  SearchHistoryTrendingSearchVm,
} from "../../types";

type MobileSearchPageClientProps = {
  initialData: SearchHistoryResponse;
};

function isLikelyImageUrl(value?: string | null) {
  if (!value) return false;
  return /\.(avif|gif|jpe?g|png|webp|svg)$/i.test(value) || value.includes("/");
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function resolveMediaUrl(value?: string | null) {
  const cleaned = value?.trim().replace(/\\/g, "/");
  if (!cleaned || UUID_RE.test(cleaned)) return "";
  if (/^(https?:)?\/\//i.test(cleaned) || cleaned.startsWith("data:")) return cleaned;

  const base = env.NEXT_PUBLIC_FILES_URL?.replace(/\/+$/, "") || "";
  const path = cleaned.replace(/^\/+/, "");

  return base ? `${base}/${path}` : `/${path}`;
}

function normalizeTerm(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

export function MobileSearchPageClient({ initialData }: MobileSearchPageClientProps) {
  const t = useTranslations("MobileSearch");
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();
  const [searchQuery, setSearchQuery] = useState("");
  const [recentSearches, setRecentSearches] = useState<string[]>(
    initialData.recentSearches ?? []
  );

  // The page shell is statically rendered, so it can't read the visitor's
  // identity — pull their recent searches on the client instead.
  useEffect(() => {
    let alive = true;
    getRecentSearchesAction()
      .then((rows) => {
        if (alive && Array.isArray(rows) && rows.length) setRecentSearches(rows);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const popularCategories = useMemo(
    () => initialData.popularCategories ?? [],
    [initialData.popularCategories]
  );

  const trendingSearches = useMemo(
    () => initialData.trendingSearches ?? [],
    [initialData.trendingSearches]
  );

  const visibleRecentSearches = useMemo(() => {
    const query = normalizeTerm(searchQuery).toLocaleLowerCase();
    if (!query) return recentSearches;
    return recentSearches.filter((item) => item.toLocaleLowerCase().includes(query));
  }, [recentSearches, searchQuery]);

  const visibleTrendingSearches = useMemo(() => {
    const query = normalizeTerm(searchQuery).toLocaleLowerCase();
    if (!query) return trendingSearches;
    return trendingSearches.filter((item) => item.query.toLocaleLowerCase().includes(query));
  }, [searchQuery, trendingSearches]);

  const visibleCategories = useMemo(() => {
    const query = normalizeTerm(searchQuery).toLocaleLowerCase();
    if (!query) return popularCategories;
    return popularCategories.filter((item) => item.label.toLocaleLowerCase().includes(query));
  }, [popularCategories, searchQuery]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const goBack = () => {
    navigate(-1);
  };

  const navigateToResults = (query: string) => {
    const normalized = normalizeTerm(query);
    if (!normalized) return;

    startTransition(async () => {
      const result = await recordSearchTermAction({ term: normalized });
      const nextTerm = result.ok && result.term ? result.term : normalized;

      setRecentSearches((current) =>
        [
          nextTerm,
          ...current.filter(
            (item) => item.toLocaleLowerCase() !== nextTerm.toLocaleLowerCase()
          ),
        ].slice(0, 8)
      );

      navigate(`/n/app/mobile/search-results?q=${encodeURIComponent(nextTerm)}`);
    });
  };

  const handleRemoveRecent = (term: string) => {
    setRecentSearches((current) =>
      current.filter((item) => item.toLocaleLowerCase() !== term.toLocaleLowerCase())
    );

    startTransition(async () => {
      await clearSearchHistoryAction({ term });
    });
  };

  const handleClearAll = () => {
    setRecentSearches([]);

    startTransition(async () => {
      await clearSearchHistoryAction();
    });
  };

  return (
    <div className="min-h-screen bg-white pb-10">
      <div className="sticky top-0 z-40 border-b border-gray-100 bg-white/95 px-5 pt-3 pb-4 backdrop-blur-xl">
        <div className="mb-4 flex items-center gap-3">
          <button
            type="button"
            onClick={goBack}
            aria-label={t("closeSearch")}
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full transition-colors hover:bg-gray-100 active:scale-95"
          >
            <X size={24} className="text-gray-700" />
          </button>

          <div className="relative flex-1">
            <SearchIcon
              size={20}
              className="absolute top-1/2 left-4 -translate-y-1/2 text-gray-400 rtl:right-4 rtl:left-auto"
            />
            <input
              ref={inputRef}
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") navigateToResults(searchQuery);
              }}
              placeholder={t("searchPlaceholder")}
              className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50 pr-12 pl-12 text-gray-900 placeholder-gray-500 transition-all focus:border-[#083f30] focus:ring-2 focus:ring-[#083f30]/10 focus:outline-none rtl:pr-12 rtl:pl-12"
              autoComplete="off"
              spellCheck={false}
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                aria-label={t("clearSearchText")}
                className="absolute top-1/2 right-4 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full bg-gray-200 transition-colors hover:bg-gray-300 rtl:right-auto rtl:left-4"
              >
                <X size={14} className="text-gray-600" />
              </button>
            ) : null}
          </div>
        </div>

        {searchQuery ? (
          <button
            type="button"
            onClick={() => navigateToResults(searchQuery)}
            disabled={isPending}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#083f30] font-semibold text-white transition-colors hover:bg-[#0a5a44] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isPending ? <Loader2 size={18} className="animate-spin" /> : <SearchIcon size={18} />}
            {t("search")}
          </button>
        ) : null}
      </div>

      <div className="px-5 py-6">
        {visibleRecentSearches.length > 0 ? (
          <RecentSearchesSection
            searches={visibleRecentSearches}
            onSearch={navigateToResults}
            onRemove={handleRemoveRecent}
            onClearAll={handleClearAll}
          />
        ) : null}

        {visibleTrendingSearches.length > 0 ? (
          <TrendingSearchesSection searches={visibleTrendingSearches} onSearch={navigateToResults} />
        ) : null}

        {visibleCategories.length > 0 ? (
          <PopularCategoriesSection categories={visibleCategories} onSearch={navigateToResults} />
        ) : null}

        {visibleRecentSearches.length === 0 &&
        visibleTrendingSearches.length === 0 &&
        visibleCategories.length === 0 ? (
          <EmptySearchState query={searchQuery} onSearch={navigateToResults} />
        ) : null}

        <SearchTips />
      </div>
    </div>
  );
}

function RecentSearchesSection({
  searches,
  onSearch,
  onRemove,
  onClearAll,
}: {
  searches: string[];
  onSearch: (query: string) => void;
  onRemove: (term: string) => void;
  onClearAll: () => void;
}) {
  const t = useTranslations("MobileSearch");

  return (
    <section className="mb-8" aria-labelledby="recent-searches-title">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock size={20} className="text-gray-600" />
          <h2 id="recent-searches-title" className="font-bold text-gray-900">
            {t("recentSearches")}
          </h2>
        </div>
        <button
          type="button"
          onClick={onClearAll}
          className="text-sm font-semibold text-[#083f30] hover:underline"
        >
          {t("clearAll")}
        </button>
      </div>

      <div className="space-y-2">
        {searches.map((search) => (
          <div
            key={search}
            className="group flex items-center gap-3 rounded-xl p-3 transition-colors hover:bg-gray-50"
          >
            <button
              type="button"
              onClick={() => onSearch(search)}
              className="flex min-w-0 flex-1 items-center gap-3 text-left rtl:text-right"
            >
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 transition-colors group-hover:bg-gray-200">
                <Clock size={18} className="text-gray-600" />
              </div>
              <span className="truncate font-medium text-gray-900">{search}</span>
            </button>
            <button
              type="button"
              onClick={() => onRemove(search)}
              aria-label={t("removeSearch", { term: search })}
              className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full opacity-70 transition-colors hover:bg-gray-200 md:opacity-0 md:group-hover:opacity-100"
            >
              <X size={16} className="text-gray-500" />
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

function TrendingSearchesSection({
  searches,
  onSearch,
}: {
  searches: SearchHistoryTrendingSearchVm[];
  onSearch: (query: string) => void;
}) {
  const t = useTranslations("MobileSearch");

  return (
    <section className="mb-8" aria-labelledby="trending-searches-title">
      <div className="mb-4 flex items-center gap-2">
        <TrendingUp size={20} className="text-orange-500" />
        <h2 id="trending-searches-title" className="font-bold text-gray-900">
          {t("trendingNow")}
        </h2>
      </div>

      <div className="space-y-2">
        {searches.map((item) => {
          const mediaUrl = resolveMediaUrl(item.image);

          return (
            <button
              type="button"
              key={item.query}
              onClick={() => onSearch(item.query)}
              className="group flex w-full items-center justify-between rounded-xl p-3 text-left transition-colors hover:bg-gray-50 rtl:text-right"
            >
              <div className="flex min-w-0 items-center gap-3">
                {mediaUrl ? (
                  <div className="relative h-11 w-11 flex-shrink-0 overflow-hidden rounded-xl bg-gray-100">
                    <ImageWithFallback
                      fill
                      src={mediaUrl}
                      alt={item.query}
                      sizes="44px"
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                ) : (
                  <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-orange-50 transition-colors group-hover:bg-orange-100">
                    <TrendingUp size={18} className="text-orange-600" />
                  </div>
                )}
                <span className="truncate font-medium text-gray-900">{item.query}</span>
              </div>
              <div className="flex flex-shrink-0 items-center gap-2">
                {item.bookings > 0 ? (
                  <span className="flex items-center gap-1 rounded-full bg-green-50 px-2 py-1 text-xs font-bold text-green-600">
                    <TrendingUp size={12} />
                    {t("bookingsCount", { count: item.bookings })}
                  </span>
                ) : null}
                <ArrowUpRight
                  size={18}
                  className="text-gray-400 transition-colors group-hover:text-[#083f30] rtl:-rotate-90"
                />
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function PopularCategoriesSection({
  categories,
  onSearch,
}: {
  categories: SearchHistoryPopularCategoryVm[];
  onSearch: (query: string) => void;
}) {
  const t = useTranslations("MobileSearch");

  return (
    <section aria-labelledby="popular-categories-title">
      <div className="mb-4 flex items-center gap-2">
        <Sparkles size={20} className="text-[#083f30]" />
        <h2 id="popular-categories-title" className="font-bold text-gray-900">
          {t("popularCategories")}
        </h2>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {categories.map((category) => {
          const mediaUrl = resolveMediaUrl(category.image);
          const canRenderIconAsImage = !mediaUrl && isLikelyImageUrl(category.icon);
          const iconImage = canRenderIconAsImage ? resolveMediaUrl(category.icon) : "";

          return (
            <button
              type="button"
              key={category.id || category.label}
              onClick={() => onSearch(category.label)}
              className="group overflow-hidden rounded-2xl bg-gray-50 text-left transition-all hover:bg-gray-100 active:scale-[0.98] rtl:text-right"
            >
              {mediaUrl ? (
                <div className="relative h-24 overflow-hidden bg-gray-100">
                  <ImageWithFallback
                    fill
                    src={mediaUrl}
                    alt={category.label}
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    sizes="(max-width: 768px) 50vw, 220px"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/5 to-transparent" />
                </div>
              ) : null}

              <div className="p-4">
                {!mediaUrl ? (
                  <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-white text-2xl shadow-sm">
                    {iconImage ? (
                      <ImageWithFallback
                        width={28}
                        height={28}
                        src={iconImage}
                        alt=""
                        className="h-7 w-7 object-contain"
                      />
                    ) : category.icon && category.icon.length <= 4 ? (
                      <span>{category.icon}</span>
                    ) : (
                      <ImageIcon size={22} className="text-[#083f30]" />
                    )}
                  </div>
                ) : null}
                <div className="line-clamp-2 text-sm font-semibold text-gray-900 transition-colors group-hover:text-[#083f30]">
                  {category.label}
                </div>
                {typeof category.count === "number" ? (
                  <div className="mt-1 text-xs font-medium text-gray-500">
                    {t("serviceCount", { count: category.count })}
                  </div>
                ) : null}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function EmptySearchState({
  query,
  onSearch,
}: {
  query: string;
  onSearch: (query: string) => void;
}) {
  const t = useTranslations("MobileSearch");
  const normalized = normalizeTerm(query);

  return (
    <div className="rounded-3xl border border-dashed border-gray-200 bg-gray-50 px-5 py-8 text-center">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm">
        <SearchIcon size={22} className="text-[#083f30]" />
      </div>
      <h2 className="font-bold text-gray-900">{t("noSuggestionsFound")}</h2>
      <p className="mt-1 text-sm leading-6 text-gray-600">
        {t("continueToFullResults")}
      </p>
      {normalized ? (
        <button
          type="button"
          onClick={() => onSearch(normalized)}
          className="mt-4 rounded-xl bg-[#083f30] px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-[#0a5a44]"
        >
          {t("searchQuery", { query: normalized })}
        </button>
      ) : null}
    </div>
  );
}

function SearchTips() {
  const t = useTranslations("MobileSearch");

  return (
    <aside className="mt-8 rounded-2xl border border-blue-100 bg-blue-50 p-4">
      <h3 className="mb-2 font-bold text-blue-900">{t("searchTips")}</h3>
      <ul className="space-y-1 text-sm text-blue-800">
        <li>{t("tips.serviceName")}</li>
        <li>{t("tips.countryOrCity")}</li>
        <li>{t("tips.shorterKeywords")}</li>
      </ul>
    </aside>
  );
}

export default MobileSearchPageClient;
