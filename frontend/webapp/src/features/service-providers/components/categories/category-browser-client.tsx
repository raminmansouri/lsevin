"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Search, Sparkles } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { ImageWithFallback } from "@/components/ui/image-with-fallback";
import { env } from "@/config/env/client";
import {
  categoryBrowserHref,
  categoryProvidersHref,
  isTourismCategory,
  TOURS_HOME_PATH,
} from "@/features/categories/utils/category-href";
import { compareByPriority } from "@/features/categories/utils/priority";
import type {
  CategoryBrowserCategory,
  CategoryBrowserGroup,
} from "@/features/service-providers/actions/categories/get-category-browser-groups";
import { Link, useRouter } from "@/i18n/navigation";

const ROOT_PARENT_KEY = "__root__";
const FEATURED_SLUG = "health-treatment-and-beauty";
const FIRST_SLUGS = [FEATURED_SLUG, "tourism", "accommodation"];
const LAST_SLUGS = ["educational-classes"];

function parentKey(parentId?: string | null) {
  return parentId || ROOT_PARENT_KEY;
}

function slugOf(category: CategoryBrowserCategory) {
  return ((category as { slug?: string | null }).slug ?? "").toLowerCase();
}

function slugRank(category: CategoryBrowserCategory) {
  const slug = slugOf(category);
  const first = FIRST_SLUGS.indexOf(slug);
  if (first >= 0) return first;
  if (LAST_SLUGS.includes(slug)) return 1000;
  return 100;
}

export function buildCategoryImageSrc(value?: string | null) {
  const media = value?.trim();
  if (!media) return null;
  if (/^https?:\/\//i.test(media)) return media;
  return `${env.NEXT_PUBLIC_FILES_URL}/${media.replace(/^\//, "")}`;
}

export function sortCategories(categories: CategoryBrowserCategory[]) {
  const byPriority = compareByPriority<CategoryBrowserCategory>((a, b) => a.name.localeCompare(b.name));
  return [...categories].sort((a, b) => slugRank(a) - slugRank(b) || byPriority(a, b));
}

function localizeDigits(text: string, locale: string) {
  return text.replace(/\d+/g, (digits) => [...digits].map((digit) => Number(digit).toLocaleString(locale)).join(""));
}

function CategoryMedia({ category, featured }: { category: CategoryBrowserCategory; featured: boolean }) {
  const imageSrc = buildCategoryImageSrc(category.image ?? category.iconUrl);

  if (!imageSrc) {
    return (
      <div className="absolute inset-0 grid place-items-center bg-gradient-to-br from-[#0a5a44] to-[#062a20]">
        {category.icon ? (
          <span className="text-5xl" aria-hidden="true">
            {category.icon}
          </span>
        ) : (
          <span className="text-5xl font-black text-[#eacb7f]/40" aria-hidden="true">
            {category.name.slice(0, 1)}
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
      className="object-cover transition-transform duration-700 ease-out group-hover:scale-105 group-active:scale-105"
      sizes={featured ? "(max-width: 640px) 100vw, 66vw" : "(max-width: 640px) 50vw, 33vw"}
      fallbackClassName="h-full w-full"
    />
  );
}

function CategoryCardContent({
  category,
  hasChildren,
  featured,
}: {
  category: CategoryBrowserCategory;
  hasChildren: boolean;
  featured: boolean;
}) {
  const locale = useLocale();
  const t = useTranslations("CategoryBrowser");
  const providers = Math.max(category.count, 0);
  const meta = [
    hasChildren ? t("subcategoriesCount", { count: Math.max(category.childCount, 0) }) : null,
    providers > 0 || !hasChildren ? t("providersCount", { count: providers }) : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <>
      <CategoryMedia category={category} featured={featured} />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#03140f]/90 via-[#03140f]/25 to-transparent" />
      <div className="pointer-events-none absolute inset-0 rounded-[26px] ring-1 ring-inset ring-[#eacb7f]/25" />

      {featured ? (
        <span className="absolute start-4 top-4 z-10 inline-flex items-center gap-1.5 rounded-full bg-[#03140f]/45 px-3 py-1.5 text-[11px] font-bold text-[#eacb7f] ring-1 ring-[#eacb7f]/40 backdrop-blur-md">
          <Sparkles size={12} />
          {t("featured")}
        </span>
      ) : null}

      <div className="relative z-10 flex h-full items-end gap-3 p-4 text-start">
        <div className="min-w-0 flex-1">
          <h3
            className={`font-black leading-tight tracking-tight text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.45)] ${
              featured ? "text-[26px]" : "text-[19px]"
            }`}
          >
            {category.name}
          </h3>
          <p className="mt-1.5 truncate text-[12px] font-medium text-white/75">{localizeDigits(meta, locale)}</p>
        </div>
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/15 text-white ring-1 ring-white/30 backdrop-blur-md transition group-hover:bg-[#eacb7f] group-hover:text-[#083f30]">
          <ChevronLeft size={18} className="ltr:rotate-180" />
        </span>
      </div>
    </>
  );
}

function CategoryCard({
  category,
  hasChildren,
  featured,
  onOpenCategory,
  opensTours = false,
}: {
  category: CategoryBrowserCategory;
  hasChildren: boolean;
  featured: boolean;
  onOpenCategory: () => void;
  opensTours?: boolean;
}) {
  const t = useTranslations("CategoryBrowser");
  const className = [
    "group relative block w-full overflow-hidden rounded-[26px] bg-[#062a20] shadow-[0_18px_40px_-22px_rgba(3,20,15,0.65)] transition-transform duration-300 active:scale-[0.97]",
    featured ? "col-span-2 aspect-[16/10] sm:col-span-3 lg:col-span-4 lg:aspect-[21/8]" : "aspect-[3/4]",
  ].join(" ");
  const content = <CategoryCardContent category={category} hasChildren={hasChildren} featured={featured} />;

  if (opensTours) {
    return (
      <Link href={TOURS_HOME_PATH} className={className} aria-label={t("openCategory", { name: category.name })} data-opens-tours="true">
        {content}
      </Link>
    );
  }

  if (hasChildren) {
    return (
      <Link
        href={categoryBrowserHref(category)}
        onClick={onOpenCategory}
        scroll={false}
        className={className}
        aria-label={t("openSubcategories", { name: category.name })}
      >
        {content}
      </Link>
    );
  }

  return (
    <Link href={categoryProvidersHref(category)} className={className} aria-label={t("openCategory", { name: category.name })}>
      {content}
    </Link>
  );
}

function EmptyState({ hasQuery }: { hasQuery: boolean }) {
  const t = useTranslations("CategoryBrowser");
  return (
    <div className="rounded-3xl border border-dashed border-gray-200 bg-gray-50 px-5 py-12 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm">
        <Search className="h-6 w-6 text-[#083f30]" />
      </div>
      <h2 className="mb-2 text-lg font-bold text-gray-900">
        {hasQuery ? t("noMatchingCategories") : t("noCategoriesAvailable")}
      </h2>
      <p className="mx-auto max-w-xs text-sm leading-6 text-gray-600">
        {hasQuery ? t("tryDifferentKeyword") : t("categoriesAppear")}
      </p>
    </div>
  );
}

export function CategoryBrowserClient({
  categoryGroups,
  totalCategories,
  totalProviders,
  tourismCategoryId = null,
  parentId = null,
}: {
  categoryGroups: CategoryBrowserGroup[];
  totalCategories: number;
  totalProviders: number;
  tourismCategoryId?: string | null;
  parentId?: string | null;
}) {
  const t = useTranslations("CategoryBrowser");
  const locale = useLocale();
  const router = useRouter();
  const selectedParentId = parentId;
  const [query, setQuery] = useState("");

  const allCategories = useMemo(() => categoryGroups.flatMap((group) => group.categories), [categoryGroups]);

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
    for (const [key, categories] of map.entries()) map.set(key, sortCategories(categories));
    return map;
  }, [allCategories]);

  const buildPathToCategory = useCallback(
    (category: CategoryBrowserCategory) => {
      const nextPath: CategoryBrowserCategory[] = [];
      let current: CategoryBrowserCategory | undefined = category;
      while (current) {
        nextPath.unshift(current);
        current = current.parentId ? categoryById.get(current.parentId) : undefined;
      }
      return nextPath;
    },
    [categoryById]
  );

  const path = useMemo(() => {
    const target = selectedParentId ? categoryById.get(selectedParentId) : undefined;
    return target ? buildPathToCategory(target) : [];
  }, [selectedParentId, categoryById, buildPathToCategory]);

  function parentHref(id?: string) {
    const category = id ? categoryById.get(id) : undefined;
    return category ? categoryBrowserHref(category) : "/categories";
  }

  const currentParent = path.length > 0 ? path[path.length - 1] : null;
  const isTourism = useCallback(
    (id: string) => isTourismCategory(id, (cid) => categoryById.get(cid)?.parentId, tourismCategoryId),
    [categoryById, tourismCategoryId]
  );

  useEffect(() => {
    if (currentParent && isTourism(currentParent.id)) router.replace(TOURS_HOME_PATH);
  }, [currentParent, isTourism, router]);

  const hasQuery = query.trim().length > 0;
  const normalizedQuery = query.trim().toLowerCase();
  const searchedCategories = useMemo(() => {
    if (!normalizedQuery) return [];
    return sortCategories(
      allCategories.filter((category) =>
        [category.name, category.description].filter(Boolean).some((value) => value.toLowerCase().includes(normalizedQuery))
      )
    );
  }, [allCategories, normalizedQuery]);

  const filteredGroups = useMemo(() => {
    if (hasQuery) {
      return searchedCategories.length ? [{ id: "search", title: t("searchResults"), categories: searchedCategories }] : [];
    }
    if (currentParent) {
      return [
        { id: currentParent.id, title: currentParent.name, categories: categoriesByParent.get(currentParent.id) ?? [] },
      ].filter((group) => group.categories.length > 0);
    }
    return categoryGroups
      .map((group) => ({ ...group, categories: sortCategories(group.categories.filter((category) => !category.parentId)) }))
      .filter((group) => group.categories.length > 0)
      .sort((a, b) => Math.min(...a.categories.map(slugRank)) - Math.min(...b.categories.map(slugRank)));
  }, [categoriesByParent, categoryGroups, currentParent, hasQuery, searchedCategories, t]);

  function openCategory() {
    setQuery("");
  }

  function handleBack() {
    if (hasQuery) {
      setQuery("");
      return;
    }
    if (path.length > 0) {
      router.push(parentHref(path[path.length - 2]?.id), { scroll: false });
      return;
    }
    router.back();
  }

  const atRoot = !hasQuery && !currentParent;

  return (
    <div className="min-h-screen bg-[#f6f8f7] pb-24" data-latin-digits>
      <div className="sticky top-0 z-40 border-b border-gray-100 bg-white/95 px-5 pb-4 pt-3 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleBack}
            className="flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-gray-100"
            aria-label={t("goBack")}
          >
            <ChevronRight size={24} className="text-gray-700 ltr:rotate-180" />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-2xl font-black tracking-tight text-gray-900">
              {hasQuery ? t("searchCategories") : currentParent?.name || t("allCategories")}
            </h1>
            <p className="text-sm text-gray-500">
              {localizeDigits(
                `${t("categoriesCount", { count: totalCategories })} • ${t("providersCount", { count: totalProviders })}`,
                locale
              )}
            </p>
          </div>
        </div>

        {path.length > 0 ? (
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-semibold text-gray-500">
            <Link href={parentHref()} scroll={false} className="rounded-full bg-gray-100 px-3 py-1 text-[#083f30]">
              {t("allCategories")}
            </Link>
            {path.map((category) => (
              <Link
                key={category.id}
                href={parentHref(category.id)}
                scroll={false}
                aria-current={category.id === currentParent?.id ? "page" : undefined}
                className="rounded-full bg-gray-100 px-3 py-1 text-gray-700"
              >
                {category.name}
              </Link>
            ))}
          </div>
        ) : null}

        <div className="mt-4 flex h-12 items-center gap-3 rounded-2xl border border-gray-100 bg-gray-50 px-4">
          <Search size={19} className="shrink-0 text-[#083f30]" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("searchCategories")}
            className="h-full min-w-0 flex-1 bg-transparent text-sm font-medium text-gray-900 outline-none placeholder:text-gray-500"
          />
        </div>
      </div>

      <main className="px-4 py-6">
        {currentParent && !hasQuery && currentParent.count > 0 ? (
          <Link
            href={isTourism(currentParent.id) ? TOURS_HOME_PATH : categoryProvidersHref(currentParent)}
            className="mb-6 flex items-center justify-between gap-3 rounded-2xl border border-[#eacb7f]/40 bg-white px-4 py-3 shadow-sm transition-colors hover:bg-gray-50"
          >
            <span className="min-w-0 text-sm font-bold text-[#083f30]">
              {t("viewAllProviders", { count: currentParent.count, name: currentParent.name })}
            </span>
            <ChevronLeft size={18} className="shrink-0 text-[#083f30] ltr:rotate-180" />
          </Link>
        ) : null}

        {filteredGroups.length === 0 ? (
          <EmptyState hasQuery={hasQuery} />
        ) : (
          <div className="space-y-9">
            {filteredGroups.map((group) => {
              const groupProviderCount = group.categories.reduce((sum, category) => sum + category.count, 0);
              return (
                <section key={group.id}>
                  <div className="mb-4 flex items-center justify-between gap-4 px-1">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span className="h-6 w-1 shrink-0 rounded-full bg-gradient-to-b from-[#eacb7f] to-[#c9a14a]" />
                      <h2 className="truncate text-lg font-black tracking-tight text-gray-900">
                        {group.title === "Other Services" ? t("otherServices") : group.title}
                      </h2>
                    </div>
                    <span className="shrink-0 rounded-full bg-white px-3 py-1 text-xs font-semibold text-gray-500 ring-1 ring-gray-200">
                      {localizeDigits(t("providersCount", { count: groupProviderCount }), locale)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                    {group.categories.map((category) => (
                      <CategoryCard
                        key={category.id}
                        category={category}
                        hasChildren={(categoriesByParent.get(category.id)?.length ?? 0) > 0}
                        featured={atRoot && slugOf(category) === FEATURED_SLUG}
                        onOpenCategory={openCategory}
                        opensTours={isTourism(category.id)}
                      />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </main>

      <div className="px-4 pb-8">
        <div className="relative overflow-hidden rounded-[26px] bg-gradient-to-br from-[#083f30] to-[#0a5a44] p-6 ring-1 ring-inset ring-[#eacb7f]/25">
          <div className="relative z-10">
            <div className="mb-3 flex items-center gap-2">
              <Sparkles size={18} className="text-[#eacb7f]" />
              <span className="text-xs font-bold uppercase tracking-wide text-[#eacb7f]">{t("smartDiscovery")}</span>
            </div>
            <h3 className="mb-2 text-lg font-black text-white">{t("cantFindTitle")}</h3>
            <p className="mb-4 text-sm leading-6 text-white/85">{t("cantFindDescription")}</p>
            <Link
              href="/n/app/mobile/search"
              className="inline-flex rounded-xl bg-[#eacb7f] px-6 py-3 text-sm font-bold text-[#083f30] shadow-lg transition-all hover:bg-[#e0b654] hover:shadow-xl active:scale-95"
            >
              {t("searchNow")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}