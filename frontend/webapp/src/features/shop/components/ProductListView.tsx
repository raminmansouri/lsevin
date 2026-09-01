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
}: {
  locale: string;
  basePath: string;
  searchParams: SearchParams;
  fixed?: { category?: string; q?: string };
  heading?: string;
}) {
  const t = await getTranslations("Shop");

  const sort = (one(searchParams.sort) ?? "popularity") as (typeof SORTS)[number];
  const page = Math.max(1, Number(one(searchParams.page) ?? "1") || 1);
  const q = fixed?.q ?? one(searchParams.q) ?? "";
  const inStockOnly = one(searchParams.inStockOnly) === "1";
  const minPrice = Number(one(searchParams.minPrice) ?? "0") || 0;
  const maxPrice = Number(one(searchParams.maxPrice) ?? "0") || 0;

  const pageSize = 24;
  const { items, total } = await searchProducts({
    q,
    category: fixed?.category,
    sort,
    page,
    pageSize,
    inStockOnly,
    minPrice,
    maxPrice,
  });

  const qs = (patch: Record<string, string | number | undefined>) => {
    const sp = new URLSearchParams();
    const base: Record<string, string> = {};
    if (!fixed?.q && q) base.q = q;
    if (sort !== "popularity") base.sort = sort;
    if (inStockOnly) base.inStockOnly = "1";
    if (minPrice) base.minPrice = String(minPrice);
    if (maxPrice) base.maxPrice = String(maxPrice);
    for (const [k, v] of Object.entries({ ...base, ...patch })) {
      if (v !== undefined && v !== "" && v !== 0) sp.set(k, String(v));
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

  return (
    <div className="pb-24">
      {heading ? <h1 className="px-4 pt-3 text-lg font-extrabold text-neutral-900">{heading}</h1> : null}

      <div className="no-scrollbar mt-2 flex gap-2 overflow-x-auto px-4 pb-2">
        {SORTS.map((s) => (
          <Link
            key={s}
            href={qs({ sort: s === "popularity" ? undefined : s, page: undefined })}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold ${
              sort === s ? "bg-[#083f30] text-white" : "bg-white text-neutral-600 ring-1 ring-black/[0.06]"
            }`}
          >
            {sortLabel[s]}
          </Link>
        ))}
        <Link
          href={qs({ inStockOnly: inStockOnly ? undefined : "1", page: undefined } as never)}
          className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold ${
            inStockOnly ? "bg-[#083f30] text-white" : "bg-white text-neutral-600 ring-1 ring-black/[0.06]"
          }`}
        >
          {t("inStockOnly")}
        </Link>
      </div>

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
