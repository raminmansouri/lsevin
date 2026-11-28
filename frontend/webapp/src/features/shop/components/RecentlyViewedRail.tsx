"use client";

import { useEffect, useState } from "react";
import { History } from "lucide-react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";

import { getRecentlyViewedAction } from "../actions/product-personal.actions";
import { shopImageSrc } from "../lib/image";
import type { ProductCard as ProductCardModel } from "../types/domain";

export function RecentlyViewedRail({
  locale: _locale,
  excludeSlug,
  limit = 12,
}: {
  locale: string;
  excludeSlug?: string;
  limit?: number;
}) {
  const t = useTranslations("Shop");
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
    <section className="mx-4 mt-3 rounded-2xl bg-[#fffdf8] px-3 py-3 ring-1 ring-[#eacb7f]/40 xl:mx-0 xl:px-5">
      <h2 className="mb-3 flex items-center gap-1.5 text-sm font-bold text-[#2b2a25]">
        <History className="size-4 text-[#c9a55a]" aria-hidden="true" />
        {t("recentlyViewed")}
      </h2>
      <ul className="no-scrollbar -mx-1 flex gap-3 overflow-x-auto px-1 pb-0.5 xl:gap-4">
        {items.slice(0, limit).map((p) => (
          <li key={p.id} className="w-24 shrink-0 sm:w-28 xl:w-32">
            <Link href={`/products/${p.slug}`} className="group block" title={p.name}>
              <span className="block aspect-square w-full overflow-hidden rounded-2xl bg-white ring-1 ring-[#eadfc6] transition group-hover:ring-[#c9a55a]">
                {p.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={shopImageSrc(p.imageUrl)} alt="" loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                ) : null}
              </span>
              <span className="mt-1.5 line-clamp-2 text-[11px] leading-[1.15rem] text-[#2b2a25] sm:text-xs">{p.name}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}