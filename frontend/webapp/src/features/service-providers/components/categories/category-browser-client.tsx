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
const ROOT_PARENT_KEY = "__root__";

function parentKey(parentId?: string | null) {
  return parentId || ROOT_PARENT_KEY;
}

function buildCategoryImageSrc(value?: string | null) {
  const media = value?.trim();
  if (!media) return null;

  if (/^https?:\/\//i.test(media)) return media;

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

function sortCategories(categories: CategoryBrowserCategory[]) {
  return [...categories].sort((a, b) => {
    const orderDelta = a.displayOrder - b.displayOrder;
    if (orderDelta !== 0) return orderDelta;
    return a.name.localeCompare(b.name);
  });
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

  if (description?.trim()) {
    return <p className="mb-2 line-clamp-2 text-xs leading-4 text-white/85">{description}</p>;
  }

  return <p className="mb-2 line-clamp-2 text-xs leading-4 text-white/85">-</p>;
}

function CategoryCardContent({
  category,
  hasChildren,
  index,
}: {
  category: CategoryBrowserCategory;
  hasChildren: boolean;
  index: number;
}) {
  const gradientClass = getGradientClass(category, index);
  const gradientStyle = getGradientStyle(category);
  const childCount = Math.max(category.childCount, 0);
  const metaLabel = hasChildren
    ? `${childCount.toLocaleString()} subcategories`
    : category.count > 0
      ? `${category.count.toLocaleString()} providers`
      : category.serviceCount > 0
        ? `${category.serviceCount.toLocaleString()} services`
        : "Explore";

  return (
    <>
      <CategoryMedia category={category} />
      <div
        className={`absolute inset-0 bg-gradient-to-t ${gradientClass}`}
        style={gradientStyle}
      />

      <div className="relative z-10 flex h-full flex-col justify-end p-4 text-left">
        <h3 className="mb-1 text-base font-bold leading-tight text-white">
          {category.name}
        </h3>
        <CategoryDescription description={category.description} />
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-xs text-white/90">{metaLabel}</p>
          <ChevronRight size={16} className="shrink-0 text-white/90" />
        </div>
      </div>
    </>
  );
}

function CategoryCard({
  category,
  hasChildren,
  index,
  onOpenCategory,
}: {
  category: CategoryBrowserCategory;
  hasChildren: boolean;
  index: number;
  onOpenCategory: (category: CategoryBrowserCategory) => void;
}) {
  const className =
    "group relative block aspect-[4/3] w-full overflow-hidden rounded-2xl shadow-sm transition-all hover:shadow-xl active:scale-95";

  if (hasChildren) {
    return (
      <button
        type="button"
        onClick={() => onOpenCategory(category)}
        className={className}
        aria-label={`Open ${category.name} subcategories`}
      >
        <CategoryCardContent category={category} hasChildren={hasChildren} index={index} />
      </button>
    );
  }

  return (
    <Link
      href={getCategoryHref(category)}
      className={className}
      aria-label={`Open ${category.name}`}
    >
      <CategoryCardContent category={category} hasChildren={hasChildren} index={index} />
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
  const [path, setPath] = useState<CategoryBrowserCategory[]>([]);
  const currentParent = path.length > 0 ? path[path.length - 1] : null;

  const allCategories = useMemo(
    () => categoryGroups.flatMap((group) => group.categories),
    [categoryGroups]
  );

  const categoryById = useMemo(() => {
    const map = new Map<string, CategoryBrowserCategory>();
    for (const category of allCategories) map.set(category.id, category);
    return map;
  }, [allCategories]);

  const categoriesByParent = useMemo(() => {
    const map = new Map<string, CategoryBrowserCategory[]>();

    for (const category of allCategories) {
      const key = parentKey(category.parentId);
      const categories = map.get(key) ?? [];
      categories.push(category);
      map.set(key, categories);
    }

    for (const [key, categories] of map.entries()) {
      map.set(key, sortCategories(categories));
    }

    return map;
  }, [allCategories]);

  const buildPathToCategory = (category: CategoryBrowserCategory) => {
    const nextPath: CategoryBrowserCategory[] = [];
    let current: CategoryBrowserCategory | undefined = category;

    while (current) {
      nextPath.unshift(current);
      current = current.parentId ? categoryById.get(current.parentId) : undefined;
    }

    return nextPath;
  };

  const hasQuery = query.trim().length > 0;
  const normalizedQuery = query.trim().toLowerCase();
  const searchedCategories = useMemo(() => {
    if (!normalizedQuery) return [];

    return sortCategories(
      allCategories.filter((category) =>
        [category.name, category.description]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(normalizedQuery))
      )
    );
  }, [allCategories, normalizedQuery]);

  const filteredGroups = useMemo(() => {
    if (hasQuery) {
      return searchedCategories.length
        ? [{ id: "search", title: "Search results", categories: searchedCategories }]
        : [];
    }

    if (currentParent) {
      return [
        {
          id: currentParent.id,
          title: currentParent.name,
          categories: categoriesByParent.get(currentParent.id) ?? [],
        },
      ].filter((group) => group.categories.length > 0);
    }

    return categoryGroups
      .map((group) => ({
        ...group,
        categories: sortCategories(group.categories.filter((category) => !category.parentId)),
      }))
      .filter((group) => group.categories.length > 0);
  }, [categoriesByParent, categoryGroups, currentParent, hasQuery, searchedCategories]);

  const categoryCount = allCategories.length;
  const providerCount = allCategories.reduce((sum, category) => sum + category.count, 0);

  function openCategory(category: CategoryBrowserCategory) {
    setQuery("");
    setPath(buildPathToCategory(category));
  }

  function handleBack() {
    if (hasQuery) {
      setQuery("");
      return;
    }

    if (path.length > 0) {
      setPath((currentPath) => currentPath.slice(0, -1));
      return;
    }

    router.back();
  }

  return (
    <div className="min-h-screen bg-white pb-24">
      <div className="sticky top-0 z-40 border-b border-gray-100 bg-white/95 px-5 pb-4 pt-3 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleBack}
            className="flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-gray-100"
            aria-label="Go back"
          >
            <ChevronLeft size={24} className="text-gray-700" />
          </button>

          <div className="min-w-0 flex-1">
            <h1 className="truncate text-2xl font-bold text-gray-900">
              {hasQuery ? "Search categories" : currentParent?.name || "Categories"}
            </h1>
            <p className="text-sm text-gray-600">
              {categoryCount.toLocaleString()} categories • {providerCount.toLocaleString()} providers
            </p>
          </div>
        </div>

        {path.length > 0 ? (
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-semibold text-gray-500">
            <button
              type="button"
              onClick={() => setPath([])}
              className="rounded-full bg-gray-100 px-3 py-1 text-[#083f30]"
            >
              All categories
            </button>
            {path.map((category, index) => (
              <button
                key={category.id}
                type="button"
                onClick={() => setPath(path.slice(0, index + 1))}
                className="rounded-full bg-gray-100 px-3 py-1 text-gray-700"
              >
                {category.name}
              </button>
            ))}
          </div>
        ) : null}

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
          <EmptyState hasQuery={hasQuery} />
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
                    {group.categories.map((category, categoryIndex) => {
                      const hasChildren = (categoriesByParent.get(category.id)?.length ?? 0) > 0;

                      return (
                        <CategoryCard
                          key={category.id}
                          category={category}
                          hasChildren={hasChildren}
                          index={categoryIndex}
                          onOpenCategory={openCategory}
                        />
                      );
                    })}
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
