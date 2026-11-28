"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";

import { useRouter } from "@/i18n/navigation";

import { searchShopProductsAction } from "../actions/catalog.actions";
import type { ProductCard as ProductCardModel } from "../types/domain";
import { ProductCard, shopCardLabels } from "./ProductCard";
import { ShopPagination } from "./ShopPagination";

const SORTS = ["popularity", "newest", "price_asc", "price_desc", "rating"] as const;
type Sort = (typeof SORTS)[number];

type Filters = {
  sort: Sort;
  page: number;
  brand?: string;
  inStockOnly: boolean;
  discountedOnly: boolean;
  minRating: number;
  minPrice: number;
  maxPrice: number;
};

function parseFilters(sp: URLSearchParams): Filters {
  const sortRaw = sp.get("sort");
  return {
    sort: (SORTS as readonly string[]).includes(sortRaw ?? "") ? (sortRaw as Sort) : "popularity",
    page: Math.max(1, Number(sp.get("page")) || 1),
    brand: sp.get("brand") || undefined,
    inStockOnly: sp.get("inStockOnly") === "1",
    discountedOnly: sp.get("onSale") === "1",
    minRating: Number(sp.get("minRating")) || 0,
    minPrice: Number(sp.get("minPrice")) || 0,
    maxPrice: Number(sp.get("maxPrice")) || 0,
  };
}

const PAGE_SIZE = 24;

/**
 * Client half of the shop list page. The page shell (header, banner, first page
 * of results) is statically rendered; this owns filtering / sorting /
 * pagination, keeping the URL in sync (`router.replace`) for shareability and
 * re-querying through `searchShopProductsAction`.
 */
export function ProductListViewClient({
  locale,
  basePath,
  fixed,
  heading,
  brands,
  initialItems,
  initialTotal,
}: {
  locale: string;
  basePath: string;
  fixed?: { category?: string; q?: string };
  heading?: string;
  brands?: Array<{ slug: string; name: string; productCount: number }>;
  initialItems: ProductCardModel[];
  initialTotal: number;
}) {
  const t = useTranslations("Shop");
  const router = useRouter();
  const sp = useSearchParams();
  const [filters, setFilters] = useState<Filters>(() => parseFilters(new URLSearchParams(sp.toString())));
  const [items, setItems] = useState(initialItems);
  const [total, setTotal] = useState(initialTotal);
  const [pending, startTransition] = useTransition();
  const [loadingMore, startMore] = useTransition();
  const [loadedPage, setLoadedPage] = useState(filters.page);
  const firstRender = useRef(true);

  const sortLabel: Record<Sort, string> = {
    popularity: t("sortRelevance"),
    newest: t("sortNewest"),
    price_asc: t("sortPriceAsc"),
    price_desc: t("sortPriceDesc"),
    rating: t("sortRating"),
  };

  const hasActiveFilters =
    filters.inStockOnly ||
    filters.discountedOnly ||
    filters.minRating > 0 ||
    !!filters.brand ||
    filters.minPrice > 0 ||
    filters.maxPrice > 0 ||
    filters.sort !== "popularity";

  const toQuery = useCallback(
    (f: Filters) => {
      const q = new URLSearchParams();
      if (fixed?.q) q.set("q", fixed.q);
      if (f.sort !== "popularity") q.set("sort", f.sort);
      if (f.page > 1) q.set("page", String(f.page));
      if (f.brand) q.set("brand", f.brand);
      if (f.inStockOnly) q.set("inStockOnly", "1");
      if (f.discountedOnly) q.set("onSale", "1");
      if (f.minRating) q.set("minRating", String(f.minRating));
      if (f.minPrice) q.set("minPrice", String(f.minPrice));
      if (f.maxPrice) q.set("maxPrice", String(f.maxPrice));
      const s = q.toString();
      return s ? `${basePath}?${s}` : basePath;
    },
    [basePath, fixed?.q],
  );

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    router.replace(toQuery(filters), { scroll: false });
    startTransition(async () => {
      const res = await searchShopProductsAction({
        locale,
        category: fixed?.category,
        q: fixed?.q,
        brand: filters.brand,
        sort: filters.sort,
        page: filters.page,
        pageSize: PAGE_SIZE,
        inStockOnly: filters.inStockOnly,
        discountedOnly: filters.discountedOnly,
        minRating: filters.minRating,
        minPrice: filters.minPrice,
        maxPrice: filters.maxPrice,
      });
      setItems(res.items);
      setTotal(res.total);
      setLoadedPage(filters.page);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const patch = (p: Partial<Filters>) => setFilters((f) => ({ ...f, page: 1, ...p }));

  const loadMore = () => {
    startMore(async () => {
      const res = await searchShopProductsAction({
        locale,
        category: fixed?.category,
        q: fixed?.q,
        brand: filters.brand,
        sort: filters.sort,
        page: loadedPage + 1,
        pageSize: PAGE_SIZE,
        inStockOnly: filters.inStockOnly,
        discountedOnly: filters.discountedOnly,
        minRating: filters.minRating,
        minPrice: filters.minPrice,
        maxPrice: filters.maxPrice,
      });
      setItems((current) => [...current, ...res.items]);
      setLoadedPage(loadedPage + 1);
    });
  };

  const chip = (active: boolean) =>
    `shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold ${
      active ? "bg-[#083f30] text-white" : "bg-white text-neutral-600 ring-1 ring-black/[0.06]"
    }`;

  const minRef = useRef<HTMLInputElement>(null);
  const maxRef = useRef<HTMLInputElement>(null);

  const labels = shopCardLabels(t as never);
  const grid = useMemo(
    () => (
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {items.map((p, i) => (
          <ProductCard key={p.id} product={p} locale={locale} labels={labels} priority={i < 2} />
        ))}
      </div>
    ),
    [items, locale, labels],
  );

  return (
    <div className={`pb-24 ${pending ? "opacity-70" : ""}`}>
      {heading ? <h1 className="px-4 pt-3 text-lg font-extrabold text-neutral-900">{heading}</h1> : null}

      <div className="no-scrollbar mt-2 flex gap-2 overflow-x-auto px-4 pb-1">
        {SORTS.map((s) => (
          <button key={s} type="button" onClick={() => patch({ sort: s })} className={chip(filters.sort === s)}>
            {sortLabel[s]}
          </button>
        ))}
      </div>

      <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 pb-1">
        <button type="button" onClick={() => patch({ inStockOnly: !filters.inStockOnly })} className={chip(filters.inStockOnly)}>
          {t("inStockOnly")}
        </button>
        <button type="button" onClick={() => patch({ discountedOnly: !filters.discountedOnly })} className={chip(filters.discountedOnly)}>
          {t("onSale")}
        </button>
        <button type="button" onClick={() => patch({ minRating: filters.minRating >= 4 ? 0 : 4 })} className={chip(filters.minRating >= 4)}>
          {t("rating4plus")}
        </button>
        {hasActiveFilters ? (
          <button
            type="button"
            onClick={() => setFilters({ sort: "popularity", page: 1, inStockOnly: false, discountedOnly: false, minRating: 0, minPrice: 0, maxPrice: 0 })}
            className={chip(false)}
          >
            {t("clearFilters")}
          </button>
        ) : null}
      </div>

      {brands && brands.length > 1 ? (
        <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 pb-1">
          <button type="button" onClick={() => patch({ brand: undefined })} className={chip(!filters.brand)}>
            {t("allBrands")}
          </button>
          {brands.map((b) => (
            <button key={b.slug} type="button" onClick={() => patch({ brand: b.slug })} className={chip(filters.brand === b.slug)}>
              {b.name}
            </button>
          ))}
        </div>
      ) : null}

      <div className="flex items-center gap-2 px-4 pb-2 pt-1">
        <input
          ref={minRef}
          type="number"
          inputMode="decimal"
          min={0}
          defaultValue={filters.minPrice || ""}
          placeholder={t("minPrice")}
          className="h-8 w-20 rounded-lg border border-black/[0.08] bg-white px-2 text-xs"
        />
        <span className="text-xs text-neutral-400">—</span>
        <input
          ref={maxRef}
          type="number"
          inputMode="decimal"
          min={0}
          defaultValue={filters.maxPrice || ""}
          placeholder={t("maxPrice")}
          className="h-8 w-20 rounded-lg border border-black/[0.08] bg-white px-2 text-xs"
        />
        <button
          type="button"
          onClick={() => patch({ minPrice: Number(minRef.current?.value) || 0, maxPrice: Number(maxRef.current?.value) || 0 })}
          className="h-8 rounded-lg bg-[#083f30] px-3 text-xs font-semibold text-white"
        >
          {t("apply")}
        </button>
      </div>

      <p className="px-4 pb-2 text-xs text-neutral-500">{t("itemsCount", { count: total })}</p>

      {items.length ? (
        <div className="px-4">
          {grid}
          <div className="mt-8 hidden xl:block">
            <ShopPagination
              page={filters.page}
              totalPages={Math.ceil(total / PAGE_SIZE)}
              locale={locale}
              onSelect={(p) => {
                setFilters((f) => ({ ...f, page: p }));
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            />
          </div>
          {loadedPage * PAGE_SIZE < total ? (
            <div className="mt-4 flex justify-center xl:hidden">
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
        </div>
      ) : (
        <div className="mx-4 rounded-2xl bg-white p-10 text-center">
          <p className="text-sm font-semibold text-neutral-700">{t("noResults")}</p>
          <p className="mt-1 text-xs text-neutral-500">{t("noResultsHint")}</p>
        </div>
      )}
    </div>
  );
}
