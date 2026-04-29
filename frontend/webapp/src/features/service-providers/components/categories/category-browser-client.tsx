"use client";

import { useMemo, useState, type CSSProperties } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Search,
  Sparkles,
} from "lucide-react";

import { hasLexicalContent, LexicalRenderer } from "@/components/editor/lexical-renderer";
import { ImageWithFallback } from "@/components/ui/image-with-fallback";
import { env } from "@/config/env/client";
import { Link, useRouter } from "@/i18n/navigation";
import type {
  CategoryBrowserCategory,
  CategoryBrowserGroup,
} from "@/features/service-providers/actions/categories/get-category-browser-groups";

const ALLOWED_GRADIENTS = [
  "from-red-500/90 to-red-600/90",
  "from-red-500/90 to-red-700/90",
  "from-blue-500/90 to-blue-600/90",
  "from-blue-500/90 to-blue-700/90",
  "from-pink-500/90 to-pink-600/90",
  "from-pink-500/90 to-rose-700/90",
  "from-purple-500/90 to-purple-600/90",
  "from-purple-500/90 to-purple-700/90",
  "from-cyan-500/90 to-cyan-600/90",
  "from-cyan-500/90 to-cyan-700/90",
  "from-green-500/90 to-green-600/90",
  "from-emerald-500/90 to-emerald-600/90",
  "from-emerald-500/90 to-emerald-700/90",
  "from-rose-500/90 to-rose-600/90",
  "from-amber-500/90 to-amber-600/90",
  "from-orange-500/90 to-orange-600/90",
  "from-orange-500/90 to-orange-700/90",
  "from-teal-500/90 to-teal-600/90",
  "from-teal-500/90 to-teal-700/90",
  "from-indigo-500/90 to-indigo-600/90",
  "from-violet-500/90 to-violet-600/90",
] as const;

const FALLBACK_GRADIENTS = ALLOWED_GRADIENTS.slice(0, 8);
const ALLOWED_GRADIENT_SET = new Set<string>(ALLOWED_GRADIENTS);

function buildCategoryImageSrc(value?: string | null) {
  const media = value?.trim();
  if (!media) return null;

  return `${env.NEXT_PUBLIC_FILES_URL}/${media.replace(/^\//, "")}`;
}

function getCategoryHref(category: CategoryBrowserCategory) {
  return `/n/app/mobile/map-discovery?categoryId=${encodeURIComponent(category.id)}`;
}

function getGradientClass(category: CategoryBrowserCategory, index: number) {
  if (category.gradient && ALLOWED_GRADIENT_SET.has(category.gradient)) {
    return category.gradient;
  }

  return FALLBACK_GRADIENTS[index % FALLBACK_GRADIENTS.length];
}

function getGradientStyle(category: CategoryBrowserCategory) {
  if (!category.gradient || category.gradient.includes("from-")) return undefined;

  return {
    background: category.gradient,
  } as CSSProperties;
}

function CategoryMedia({ category }: { category: CategoryBrowserCategory }) {
  const image = category.image ?? category.iconUrl;
  const imageSrc = buildCategoryImageSrc(image);

  if (!imageSrc) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
        {category.icon ? (
          <span className="text-4xl" aria-hidden="true">
            {category.icon}
          </span>
        ) : (
          <span className="text-3xl font-bold text-gray-300" aria-hidden="true">
            {category.name.slice(0, 1).toUpperCase()}
          </span>
        )}
      </div>
    );
  }

  return (
    <ImageWithFallback
      fill
      src={imageSrc}
      alt={category.name}
      className="object-cover transition-transform duration-500 group-hover:scale-110"
      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
      fallbackClassName="rounded-2xl"
    />
  );
}

function CategoryDescription({ description }: { description?: string | null }) {
  if (description && hasLexicalContent(description)) {
    return (
      <LexicalRenderer
        content={description}
        className="mb-2 line-clamp-2 text-xs leading-4 text-white/85"
      />
    );
  }

  return <p className="mb-2 line-clamp-2 text-xs leading-4 text-white/85">-</p>;
}

function CategoryCard({
  category,
  index,
}: {
  category: CategoryBrowserCategory;
  index: number;
}) {
  const gradientClass = getGradientClass(category, index);
  const gradientStyle = getGradientStyle(category);

  return (
    <Link
      href={getCategoryHref(category)}
      className="group relative aspect-[4/3] overflow-hidden rounded-2xl shadow-sm transition-all hover:shadow-xl active:scale-95"
      aria-label={`Open ${category.name}`}
    >
      <CategoryMedia category={category} />
      <div
        className={`absolute inset-0 bg-gradient-to-t ${gradientClass}`}
        style={gradientStyle}
      />

      <div className="relative z-10 flex h-full flex-col justify-end p-4">
        <h3 className="mb-1 text-base font-bold leading-tight text-white">
          {category.name}
        </h3>
        <CategoryDescription description={category.description} />
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-xs text-white/90">
            {category.count.toLocaleString()} providers
          </p>
          <ChevronRight size={16} className="shrink-0 text-white/90" />
        </div>
      </div>
    </Link>
  );
}

function EmptyState({ hasQuery }: { hasQuery: boolean }) {
  return (
    <div className="rounded-3xl border border-dashed border-gray-200 bg-gray-50 px-5 py-12 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm">
        <Search className="h-6 w-6 text-[#083f30]" />
      </div>
      <h2 className="mb-2 text-lg font-bold text-gray-900">
        {hasQuery ? "No matching categories" : "No categories available"}
      </h2>
      <p className="mx-auto max-w-xs text-sm leading-6 text-gray-600">
        {hasQuery
          ? "Try a different keyword or browse all available categories."
          : "Active categories will appear here once they are configured in the admin panel."}
      </p>
    </div>
  );
}

export function CategoryBrowserClient({
  categoryGroups,
}: {
  categoryGroups: CategoryBrowserGroup[];
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const filteredGroups = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return categoryGroups;

    return categoryGroups
      .map((group) => ({
        ...group,
        categories: group.categories.filter((category) => {
          return [category.name, category.description]
            .filter(Boolean)
            .some((value) => value.toLowerCase().includes(normalizedQuery));
        }),
      }))
      .filter((group) => group.categories.length > 0);
  }, [categoryGroups, query]);

  const categoryCount = categoryGroups.reduce(
    (sum, group) => sum + group.categories.length,
    0
  );
  const providerCount = categoryGroups.reduce(
    (sum, group) =>
      sum + group.categories.reduce((groupSum, category) => groupSum + category.count, 0),
    0
  );

  return (
    <div className="min-h-screen bg-white pb-24">
      <div className="sticky top-0 z-40 border-b border-gray-100 bg-white/95 px-5 pb-4 pt-3 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-gray-100"
            aria-label="Go back"
          >
            <ChevronLeft size={24} className="text-gray-700" />
          </button>

          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
            <p className="text-sm text-gray-600">
              {categoryCount.toLocaleString()} categories • {providerCount.toLocaleString()} providers
            </p>
          </div>
        </div>

        <div className="mt-4 flex h-12 items-center gap-3 rounded-2xl border border-gray-100 bg-gray-50 px-4">
          <Search size={19} className="shrink-0 text-[#083f30]" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search categories..."
            className="h-full min-w-0 flex-1 bg-transparent text-sm font-medium text-gray-900 outline-none placeholder:text-gray-500"
          />
        </div>
      </div>

      <main className="px-5 py-6">
        {filteredGroups.length === 0 ? (
          <EmptyState hasQuery={query.trim().length > 0} />
        ) : (
          <div className="space-y-8">
            {filteredGroups.map((group) => {
              const groupProviderCount = group.categories.reduce(
                (sum, category) => sum + category.count,
                0
              );

              return (
                <section key={group.id}>
                  <div className="mb-4 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <h2 className="truncate text-xl font-bold text-gray-900">
                        {group.title}
                      </h2>
                      <p className="text-xs font-medium text-gray-500">
                        {group.categories.length.toLocaleString()} categories
                      </p>
                    </div>
                    <span className="shrink-0 text-sm font-medium text-gray-500">
                      {groupProviderCount.toLocaleString()} providers
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                    {group.categories.map((category, categoryIndex) => (
                      <CategoryCard
                        key={category.id}
                        category={category}
                        index={categoryIndex}
                      />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </main>

      <div className="px-5 pb-8">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#083f30] to-[#0a5a44] p-6">
          <div className="relative z-10">
            <div className="mb-3 flex items-center gap-2">
              <Sparkles size={18} className="text-[#eacb7f]" />
              <span className="text-xs font-bold uppercase tracking-wide text-[#eacb7f]">
                Smart discovery
              </span>
            </div>
            <h3 className="mb-2 text-lg font-bold text-white">
              Can&apos;t find what you&apos;re looking for?
            </h3>
            <p className="mb-4 text-sm leading-6 text-white/90">
              Use smart search to find treatments, providers, packages, and nearby services.
            </p>
            <Link
              href="/n/app/mobile/search"
              className="inline-flex rounded-xl bg-[#eacb7f] px-6 py-3 text-sm font-bold text-[#083f30] shadow-lg transition-all hover:bg-[#e0b654] hover:shadow-xl active:scale-95"
            >
              Search Now
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
