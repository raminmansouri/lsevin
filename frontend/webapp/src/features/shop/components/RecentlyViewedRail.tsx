"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import { getRecentlyViewedAction } from "../actions/product-personal.actions";
import { ProductCard, shopCardLabels } from "./ProductCard";
import type { ProductCard as ProductCardModel } from "../types/domain";

/**
 * Self-fetching "recently viewed" rail for cookie-free (ISR) storefront pages.
 * Renders nothing until it has something, so it's safe to drop unconditionally.
 */
export function RecentlyViewedRail({
  locale,
  excludeSlug,
  limit = 6,
}: {
  locale: string;
  excludeSlug?: string;
  limit?: number;
}) {
  const t = useTranslations("Shop");
  const labels = shopCardLabels(t as never);
  const [items, setItems] = useState<ProductCardModel[] | null>(null);

  useEffect(() => {
    let alive = true;
    getRecentlyViewedAction({ excludeSlug, limit })
      .then((rows) => {
        if (alive) setItems(rows);
      })
      .catch(() => alive && setItems([]));
    return () => {
      alive = false;
    };
  }, [excludeSlug, limit]);

  if (!items || !items.length) return null;

  return (
    <section className="mt-2 bg-white px-4 py-3">
      <h2 className="mb-2.5 text-[15px] font-extrabold text-neutral-900">{t("recentlyViewed")}</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {items.slice(0, limit).map((p) => (
          <ProductCard key={p.id} product={p} locale={locale} labels={labels} />
        ))}
      </div>
    </section>
  );
}
