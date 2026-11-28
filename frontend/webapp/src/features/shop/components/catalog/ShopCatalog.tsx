"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { ArrowUpDown, Loader2, SlidersHorizontal, X } from "lucide-react";
import { useTranslations } from "next-intl";

import { useRouter } from "@/i18n/navigation";

import type { ShopFacets } from "../../api/catalog.repository";
import { getShopFacetsAction, searchShopProductsAction } from "../../actions/catalog.actions";
import {
  EMPTY_SHOP_FILTERS,
  SHOP_SORTS,
  activeFilterCount,
  shopFiltersInput,
  shopFiltersQuery,
  type ShopFilters,
  type ShopFixed,
  type ShopSort,
} from "../../lib/catalog-filters";
import type { ProductCard as ProductCardModel } from "../../types/domain";
import { ProductCard, shopCardLabels } from "../ProductCard";
import { ShopPagination } from "../ShopPagination";
import { ShopFilterPanel } from "./ShopFilterPanel";
import { DesktopProductCard } from "@/features/web-desktop/shop/DesktopProductCard";

const PAGE_SIZE = 24; // must stay divisible by every grid column count below (2, 3, 4) so no page ends on a half row

export function ShopCatalog({
  locale,
  basePath,
  fixed,
  heading,
  initialFilters,
  initialItems,
  initialTotal,
  initialFacets,
}: {
  locale: string;
  basePath: string;
  fixed: ShopFixed;
  heading?: string;
  initialFilters: ShopFilters;
  initialItems: ProductCardModel[];
  initialTotal: number;
  initialFacets: ShopFacets;
}) {
  const t = useTranslations("Shop");
  const tf = useTranslations("Shop.filter");
  const router = useRouter();
  const number = new Intl.NumberFormat(locale);
  const labels = shopCardLabels(t as never);

  const [filters, setFilters] = useState<ShopFilters>(initialFilters);
  const [items, setItems] = useState(initialItems);
  const [total, setTotal] = useState(initialTotal);
  const [facets, setFacets] = useState(initialFacets);
  const [loadedPage, setLoadedPage] = useState(initialFilters.page);
  const [pending, startTransition] = useTransition();
  const [loadingMore, startMore] = useTransition();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetShown, setSheetShown] = useState(false);
  const firstRender = useRef(true);
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const qs = shopFiltersQuery(filters, fixed);
    router.replace(qs ? `${basePath}?${qs}` : basePath, { scroll: false });
    const input = shopFiltersInput(filters, fixed, locale, PAGE_SIZE);
    startTransition(async () => {
      const [res, nextFacets] = await Promise.all([
        searchShopProductsAction(input),
        getShopFacetsAction({ ...input, fixedCategory: Boolean(fixed.category) }),
      ]);
      setItems(res.items);
      setTotal(res.total);
      setFacets(nextFacets);
      setLoadedPage(filters.page);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  useEffect(() => {
    if (!sheetOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const frame = requestAnimationFrame(() => setSheetShown(true));
    return () => {
      cancelAnimationFrame(frame);
      document.body.style.overflow = previous;
    };
  }, [sheetOpen]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("filters") === "1" && window.matchMedia("(max-width: 1279px)").matches) setSheetOpen(true);
  }, []);

  const closeSheet = () => {
    setSheetShown(false);
    window.setTimeout(() => setSheetOpen(false), 280);
  };

  const patch = (p: Partial<ShopFilters>) => setFilters((f) => ({ ...f, page: 1, ...p }));
  const toggleIn = (key: "brands" | "sellers" | "attrs", value: string) =>
    setFilters((f) => ({ ...f, page: 1, [key]: f[key].includes(value) ? f[key].filter((x) => x !== value) : [...f[key], value] }));
  const clearAll = () => setFilters((f) => ({ ...f, ...EMPTY_SHOP_FILTERS, featuredOnly: f.featuredOnly, bestSellerOnly: f.bestSellerOnly, page: 1 }));

  const loadMore = () => {
    startMore(async () => {
      const res = await searchShopProductsAction(shopFiltersInput(filters, fixed, locale, PAGE_SIZE, loadedPage + 1));
      setItems((current) => [...current, ...res.items]);
      setLoadedPage(loadedPage + 1);
    });
  };

  const goToPage = (page: number) => {
    setFilters((f) => ({ ...f, page }));
    resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const sortLabel: Record<ShopSort, string> = {
    popularity: t("sortRelevance"),
    newest: t("sortNewest"),
    price_asc: t("sortPriceAsc"),
    price_desc: t("sortPriceDesc"),
    rating: t("sortRating"),
    low_stock: tf("sortBestSeller"),
  };

  const chips = useMemo(() => {
    const out: Array<{ key: string; label: string; remove: () => void }> = [];
    const nameOf = (list: Array<{ slug: string; name: string }>, slug: string) => list.find((x) => x.slug === slug)?.name ?? slug;
    const attrLabel = new Map(facets.attributes.flatMap((a) => a.values.map((v) => [v.id, v.label] as const)));
    if (!fixed.category && filters.category) out.push({ key: "cat", label: nameOf(facets.categories, filters.category), remove: () => patch({ category: undefined }) });
    filters.brands.forEach((b) => out.push({ key: `b-${b}`, label: nameOf(facets.brands, b), remove: () => toggleIn("brands", b) }));
    filters.sellers.forEach((s) => out.push({ key: `s-${s}`, label: nameOf(facets.sellers, s), remove: () => toggleIn("sellers", s) }));
    filters.attrs.forEach((a) => out.push({ key: `a-${a}`, label: attrLabel.get(a) ?? "…", remove: () => toggleIn("attrs", a) }));
    if (filters.minPrice || filters.maxPrice) {
      const from = filters.minPrice ? number.format(filters.minPrice) : "…";
      const to = filters.maxPrice ? number.format(filters.maxPrice) : "…";
      out.push({ key: "price", label: `${tf("price")}: ${from} – ${to}`, remove: () => patch({ minPrice: 0, maxPrice: 0 }) });
    }
    if (filters.inStockOnly) out.push({ key: "stock", label: t("inStockOnly"), remove: () => patch({ inStockOnly: false }) });
    if (filters.discountedOnly) out.push({ key: "sale", label: t("onSale"), remove: () => patch({ discountedOnly: false }) });
    if (filters.minRating) out.push({ key: "rating", label: t("rating4plus"), remove: () => patch({ minRating: 0 }) });
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, facets]);

  const activeCount = activeFilterCount(filters, fixed);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const panel = (
    <ShopFilterPanel
      facets={facets}
      filters={filters}
      locale={locale}
      showCategory={!fixed.category}
      onPatch={patch}
      onToggle={toggleIn}
    />
  );

  return (
    <div className="pb-24 xl:mx-auto xl:max-w-[1360px] xl:px-8 xl:pt-4">
      {heading ? <h1 className="px-4 pt-3 font-display text-2xl text-[#0e1a16] xl:px-0 xl:text-[34px]">{heading}</h1> : null}

      <div className="xl:mt-6 xl:grid xl:grid-cols-[300px_minmax(0,1fr)] xl:gap-8">
        <aside className="hidden xl:block">
          <div className="sticky top-28 max-h-[calc(100vh-8rem)] overflow-y-auto rounded-[28px] bg-[#fffdf8] px-5 pb-2 pt-5 shadow-[0_24px_60px_-40px_rgba(6,42,32,0.45)] ring-1 ring-[#eacb7f]/45 [scrollbar-width:thin]">
            <div className="flex items-center justify-between gap-2 border-b border-[#eacb7f]/35 pb-4">
              <span className="flex items-center gap-2 text-lg font-black text-[#083f30]">
                <SlidersHorizontal className="size-5 text-[#c9a55a]" aria-hidden="true" />
                {tf("title")}
              </span>
              {activeCount ? (
                <button type="button" onClick={clearAll} className="text-xs font-bold text-[#8c6b2c] hover:text-[#083f30]">
                  {tf("clearAll")}
                </button>
              ) : null}
            </div>
            {panel}
          </div>
        </aside>

        <section ref={resultsRef} className="min-w-0 scroll-mt-28">
          <div className="flex items-center gap-2 px-4 pt-3 xl:hidden">
            <button
              type="button"
              onClick={() => setSheetOpen(true)}
              className="inline-flex h-10 items-center gap-2 rounded-full bg-[#083f30] px-4 text-sm font-bold text-white shadow-[0_8px_20px_-10px_rgba(8,63,48,0.9)]"
            >
              <SlidersHorizontal className="size-4 text-[#eacb7f]" aria-hidden="true" />
              {tf("title")}
              {activeCount ? (
                <span className="grid h-5 min-w-5 place-items-center rounded-full bg-[#eacb7f] px-1.5 text-[11px] text-[#083f30]">{number.format(activeCount)}</span>
              ) : null}
            </button>
            <label className="relative inline-flex h-10 items-center gap-1.5 rounded-full bg-white px-4 text-sm font-semibold text-[#2b2a25] ring-1 ring-[#eadfc6]">
              <ArrowUpDown className="size-4 text-[#c9a55a]" aria-hidden="true" />
              <span>{sortLabel[filters.sort]}</span>
              <select
                value={filters.sort}
                onChange={(e) => patch({ sort: e.target.value as ShopSort })}
                aria-label={tf("sort")}
                className="absolute inset-0 cursor-pointer opacity-0"
              >
                {SHOP_SORTS.map((s) => (
                  <option key={s} value={s}>
                    {sortLabel[s]}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="hidden items-center justify-between gap-4 xl:flex">
            <p className="text-sm text-[#6b6150]">{t("itemsCount", { count: total })}</p>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="me-1 text-xs font-bold text-[#a3967c]">{tf("sort")}:</span>
              {SHOP_SORTS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => patch({ sort: s })}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition ${
                    filters.sort === s ? "bg-[#083f30] text-[#eacb7f]" : "text-[#56675f] hover:bg-[#f4efe4] hover:text-[#083f30]"
                  }`}
                >
                  {sortLabel[s]}
                </button>
              ))}
            </div>
          </div>

          {chips.length ? (
            <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto px-4 pb-1 xl:flex-wrap xl:overflow-visible xl:px-0">
              {chips.map((chip) => (
                <button
                  key={chip.key}
                  type="button"
                  onClick={chip.remove}
                  className="group inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[#fbf6ea] py-1.5 pe-2 ps-3 text-xs font-bold text-[#083f30] ring-1 ring-[#eacb7f]/70 transition hover:bg-[#083f30] hover:text-[#eacb7f]"
                >
                  {chip.label}
                  <X className="size-3.5 opacity-60 group-hover:opacity-100" aria-hidden="true" />
                </button>
              ))}
              <button type="button" onClick={clearAll} className="shrink-0 px-2 text-xs font-bold text-[#8c6b2c] underline-offset-4 hover:underline">
                {tf("clearAll")}
              </button>
            </div>
          ) : null}

          <p className="px-4 pt-3 text-xs text-[#6b6150] xl:hidden">{t("itemsCount", { count: total })}</p>

          <div className="relative mt-3 px-4 xl:mt-5 xl:px-0">
            {pending ? <div className="absolute inset-x-4 -top-2 h-0.5 overflow-hidden rounded-full bg-[#eacb7f]/30 xl:inset-x-0"><div className="h-full w-1/3 animate-pulse rounded-full bg-[#c9a55a]" /></div> : null}
            {items.length ? (
              <div className={`grid grid-cols-2 gap-2.5 transition-opacity duration-300 sm:grid-cols-3 lg:grid-cols-4 xl:gap-6 ${pending ? "opacity-50" : ""}`}>
                {items.map((p, i) => (
                  <div key={p.id} className="min-w-0">
                    <div className="xl:hidden">
                      <ProductCard product={p} locale={locale} labels={labels} priority={i < 4} />
                    </div>
                    <div className="hidden xl:block">
                      <DesktopProductCard product={p} locale={locale} labels={labels} priority={i < 4} />
                    </div>
                  </div>
                ))}

              </div>
            ) : (
              <div className="rounded-[28px] bg-[#fbf7ee] px-6 py-14 text-center ring-1 ring-[#eacb7f]/40">
                <p className="text-base font-bold text-[#0e1a16]">{t("noResults")}</p>
                <p className="mt-1 text-sm text-[#6b6150]">{t("noResultsHint")}</p>
                {activeCount ? (
                  <button type="button" onClick={clearAll} className="mt-4 rounded-full bg-[#083f30] px-5 py-2 text-sm font-bold text-[#eacb7f]">
                    {tf("clearAll")}
                  </button>
                ) : null}
              </div>
            )}

            {items.length ? (
              <>
                <div className="mt-10 hidden xl:block">
                  <ShopPagination page={filters.page} totalPages={totalPages} locale={locale} onSelect={goToPage} />
                </div>
                {loadedPage * PAGE_SIZE < total ? (
                  <div className="mt-5 flex justify-center xl:hidden">
                    <button
                      type="button"
                      onClick={loadMore}
                      disabled={loadingMore}
                      className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#083f30] px-6 text-sm font-semibold text-white disabled:opacity-70"
                    >
                      {loadingMore ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
                      {t("loadMore")}
                    </button>
                  </div>
                ) : null}
              </>
            ) : null}
          </div>
        </section>
      </div>

      {sheetOpen ? (
        <div className="fixed inset-0 z-[80] xl:hidden" role="dialog" aria-modal="true" aria-label={tf("title")}>
          <button
            type="button"
            aria-label={tf("close")}
            onClick={closeSheet}
            className={`absolute inset-0 bg-[#04130e]/50 backdrop-blur-[2px] transition-opacity duration-300 ${sheetShown ? "opacity-100" : "opacity-0"}`}
          />
          <div
            className={`absolute inset-x-0 bottom-0 flex max-h-[88dvh] flex-col rounded-t-[30px] bg-[#fbf7ee] shadow-[0_-20px_60px_-20px_rgba(0,0,0,0.5)] transition-transform duration-300 ease-out ${
              sheetShown ? "translate-y-0" : "translate-y-full"
            }`}
          >
            <div className="mx-auto mt-2.5 h-1.5 w-12 rounded-full bg-[#d9cfb8]" aria-hidden="true" />
            <div className="flex items-center justify-between gap-2 border-b border-[#eacb7f]/40 px-5 pb-3 pt-3">
              <span className="flex items-center gap-2 text-lg font-black text-[#083f30]">
                <SlidersHorizontal className="size-5 text-[#c9a55a]" aria-hidden="true" />
                {tf("title")}
              </span>
              <div className="flex items-center gap-3">
                {activeCount ? (
                  <button type="button" onClick={clearAll} className="text-xs font-bold text-[#8c6b2c]">
                    {tf("clearAll")}
                  </button>
                ) : null}
                <button type="button" onClick={closeSheet} aria-label={tf("close")} className="grid size-9 place-items-center rounded-full bg-white ring-1 ring-[#eadfc6]">
                  <X className="size-4" aria-hidden="true" />
                </button>
              </div>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-5">{panel}</div>
            <div className="border-t border-[#eacb7f]/40 px-5 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3">
              <button
                type="button"
                onClick={closeSheet}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#083f30] text-base font-bold text-[#eacb7f] shadow-[0_12px_30px_-12px_rgba(8,63,48,0.9)]"
              >
                {pending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
                {tf("showResults", { count: number.format(facets.total) })}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}