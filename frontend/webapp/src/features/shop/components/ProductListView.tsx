import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import { searchProducts } from "../api/catalog.repository";
import { ProductGrid } from "./home-sections";

type SearchParams = Record<string, string | string[] | undefined>;

const SORTS = ["popularity", "newest", "price_asc", "price_desc", "rating"] as const;

function one(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

export async function ProductListView({
  locale,
  basePath,
  searchParams,
  fixed,
  heading,
  brands,
}: {
  locale: string;
  basePath: string;
  searchParams: SearchParams;
  fixed?: { category?: string; q?: string };
  heading?: string;
  /** Brand facet for the filter bar (SHP-V02-005). Omit to hide the brand row. */
  brands?: Array<{ slug: string; name: string; productCount: number }>;
}) {
  const t = await getTranslations("Shop");

  const sort = (one(searchParams.sort) ?? "popularity") as (typeof SORTS)[number];
  const page = Math.max(1, Number(one(searchParams.page) ?? "1") || 1);
  const q = fixed?.q ?? one(searchParams.q) ?? "";
  const inStockOnly = one(searchParams.inStockOnly) === "1";
  const discountedOnly = one(searchParams.onSale) === "1";
  const minRating = Number(one(searchParams.minRating) ?? "0") || 0;
  const brand = one(searchParams.brand) || undefined;
  const minPrice = Number(one(searchParams.minPrice) ?? "0") || 0;
  const maxPrice = Number(one(searchParams.maxPrice) ?? "0") || 0;

  const pageSize = 24;
  const { items, total } = await searchProducts({
    q,
    category: fixed?.category,
    brand,
    sort,
    page,
    pageSize,
    inStockOnly,
    discountedOnly,
    minRating,
    minPrice,
    maxPrice,
  });

  // Current filter state, so every generated link keeps the other filters intact
  // and only patches what the control changes.
  const state: Record<string, string> = {};
  if (!fixed?.q && q) state.q = q;
  if (sort !== "popularity") state.sort = sort;
  if (inStockOnly) state.inStockOnly = "1";
  if (discountedOnly) state.onSale = "1";
  if (minRating) state.minRating = String(minRating);
  if (brand) state.brand = brand;
  if (minPrice) state.minPrice = String(minPrice);
  if (maxPrice) state.maxPrice = String(maxPrice);

  const qs = (patch: Record<string, string | number | undefined>) => {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries({ ...state, ...patch })) {
      if (v !== undefined && v !== "" && v !== 0 && v !== "0") sp.set(k, String(v));
    }
    const s = sp.toString();
    return s ? `${basePath}?${s}` : basePath;
  };

  const sortLabel: Record<string, string> = {
    popularity: t("sortRelevance"),
    newest: t("sortNewest"),
    price_asc: t("sortPriceAsc"),
    price_desc: t("sortPriceDesc"),
    rating: t("sortRating"),
  };

  const chip = (active: boolean) =>
    `shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold ${
      active ? "bg-[#083f30] text-white" : "bg-white text-neutral-600 ring-1 ring-black/[0.06]"
    }`;

  const hasActiveFilters =
    inStockOnly || discountedOnly || minRating > 0 || !!brand || minPrice > 0 || maxPrice > 0 || sort !== "popularity";

  return (
    <div className="pb-24">
      {heading ? <h1 className="px-4 pt-3 text-lg font-extrabold text-neutral-900">{heading}</h1> : null}

      {/* sort */}
      <div className="no-scrollbar mt-2 flex gap-2 overflow-x-auto px-4 pb-1">
        {SORTS.map((s) => (
          <Link key={s} href={qs({ sort: s === "popularity" ? undefined : s, page: undefined })} className={chip(sort === s)}>
            {sortLabel[s]}
          </Link>
        ))}
      </div>

      {/* availability / deal / rating toggles */}
      <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 pb-1">
        <Link href={qs({ inStockOnly: inStockOnly ? undefined : "1", page: undefined })} className={chip(inStockOnly)}>
          {t("inStockOnly")}
        </Link>
        <Link href={qs({ onSale: discountedOnly ? undefined : "1", page: undefined })} className={chip(discountedOnly)}>
          {t("onSale")}
        </Link>
        <Link href={qs({ minRating: minRating >= 4 ? undefined : 4, page: undefined })} className={chip(minRating >= 4)}>
          {t("rating4plus")}
        </Link>
        {hasActiveFilters ? (
          <Link href={fixed?.q ? `${basePath}?q=${encodeURIComponent(q)}` : basePath} className={chip(false)}>
            {t("clearFilters")}
          </Link>
        ) : null}
      </div>

      {/* brand facet */}
      {brands && brands.length > 1 ? (
        <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 pb-1">
          <Link href={qs({ brand: undefined, page: undefined })} className={chip(!brand)}>
            {t("allBrands")}
          </Link>
          {brands.map((b) => (
            <Link key={b.slug} href={qs({ brand: b.slug, page: undefined })} className={chip(brand === b.slug)}>
              {b.name}
            </Link>
          ))}
        </div>
      ) : null}

      {/* price range */}
      <form method="get" action={basePath} className="flex items-center gap-2 px-4 pb-2 pt-1">
        {Object.entries(state)
          .filter(([k]) => k !== "minPrice" && k !== "maxPrice")
          .map(([k, v]) => (
            <input key={k} type="hidden" name={k} value={v} />
          ))}
        <input
          name="minPrice"
          type="number"
          inputMode="decimal"
          min={0}
          defaultValue={minPrice || ""}
          placeholder={t("minPrice")}
          className="h-8 w-20 rounded-lg border border-black/[0.08] bg-white px-2 text-xs"
        />
        <span className="text-xs text-neutral-400">—</span>
        <input
          name="maxPrice"
          type="number"
          inputMode="decimal"
          min={0}
          defaultValue={maxPrice || ""}
          placeholder={t("maxPrice")}
          className="h-8 w-20 rounded-lg border border-black/[0.08] bg-white px-2 text-xs"
        />
        <button className="h-8 rounded-lg bg-[#083f30] px-3 text-xs font-semibold text-white">{t("apply")}</button>
      </form>

      <p className="px-4 pb-2 text-xs text-neutral-500">{t("itemsCount", { count: total })}</p>

      {items.length ? (
        <div className="px-4">
          <ProductGrid products={items} locale={locale} />
          <div className="mt-4 flex items-center justify-center gap-3">
            {page > 1 ? (
              <Link href={qs({ page: page - 1 })} className="rounded-full bg-white px-4 py-2 text-xs font-semibold text-[#083f30] ring-1 ring-black/[0.06]">
                ‹
              </Link>
            ) : null}
            {page * pageSize < total ? (
              <Link href={qs({ page: page + 1 })} className="rounded-full bg-[#083f30] px-5 py-2 text-xs font-semibold text-white">
                {t("loadMore")}
              </Link>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="mx-4 rounded-2xl bg-white p-10 text-center">
          <p className="text-sm font-semibold text-neutral-700">{t("noResults")}</p>
          <p className="mt-1 text-xs text-neutral-500">{t("noResultsHint")}</p>
          <Link href={basePath} className="mt-3 inline-block text-xs font-semibold text-[#083f30]">
            {t("clearFilters")}
          </Link>
        </div>
      )}
    </div>
  );
}
