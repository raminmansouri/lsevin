"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { searchShopProductsAction } from "../actions/catalog.actions";
import type { ProductCard as ProductCardModel } from "../types/domain";
import { ProductCard, shopCardLabels } from "./ProductCard";

type Filters = Omit<Parameters<typeof searchShopProductsAction>[0], "locale" | "page" | "pageSize">;

export function LoadMoreProducts({
  locale,
  filters,
  startPage,
  total,
  pageSize,
}: {
  locale: string;
  filters: Filters;
  startPage: number;
  total: number;
  pageSize: number;
}) {
  const t = useTranslations("Shop");
  const labels = shopCardLabels(t as never);
  const [items, setItems] = useState<ProductCardModel[]>([]);
  const [page, setPage] = useState(startPage);
  const [pending, start] = useTransition();

  const loadMore = () => {
    start(async () => {
      const res = await searchShopProductsAction({ locale, ...filters, page: page + 1, pageSize });
      setItems((current) => [...current, ...res.items]);
      setPage(page + 1);
    });
  };

  return (
    <div className="xl:hidden">
      {items.length ? (
        <div className="mt-2.5 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((p) => (
            <ProductCard key={p.id} product={p} locale={locale} labels={labels} />
          ))}
        </div>
      ) : null}
      {page * pageSize < total ? (
        <div className="mt-4 flex justify-center">
          <button
            type="button"
            onClick={loadMore}
            disabled={pending}
            className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#083f30] px-6 text-sm font-semibold text-white disabled:opacity-70"
          >
            {pending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
            {t("loadMore")}
          </button>
        </div>
      ) : null}
    </div>
  );
}