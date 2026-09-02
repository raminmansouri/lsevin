import Link from "next/link";

import { cn } from "@/lib/utils";

import type { ProductCard as ProductCardModel } from "../types/domain";
import { formatShopMoney } from "./money";
import { shopImageSrc } from "../lib/image";
import { WishlistHeart } from "./WishlistHeart";

type Labels = {
  from: string;
  sold: (n: number) => string;
  outOfStock: string;
  preorder: string;
  priceUnavailable: string;
};

export function shopCardLabels(t: (k: string, v?: Record<string, unknown>) => string): Labels {
  return {
    from: t("from"),
    sold: (n: number) => t("sold", { count: n >= 1000 ? `${Math.floor(n / 100) / 10}k` : n }),
    outOfStock: t("outOfStock"),
    preorder: t("preorder"),
    priceUnavailable: t("priceUnavailable"),
  };
}

/**
 * AliExpress-style discovery card: image-led, compact, scannable price + trust
 * row (SHP-UX-015). Pure/server — the whole card is one link.
 */
export function ProductCard({
  product,
  locale = "en",
  labels,
  className,
  priority = false,
}: {
  product: ProductCardModel;
  locale?: string;
  labels: Labels;
  className?: string;
  priority?: boolean;
}) {
  const href = `/n/app/mobile/shop/product/${product.slug}`;
  const ranged = product.priceMax > product.price + 0.001;

  return (
    <Link
      href={href}
      className={cn(
        "group flex flex-col overflow-hidden rounded-2xl bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)] ring-1 ring-black/[0.04] transition active:scale-[0.985]",
        className
      )}
    >
      <div className="relative aspect-square w-full overflow-hidden bg-neutral-100">
        {product.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={shopImageSrc(product.imageUrl)}
            alt={product.name}
            loading={priority ? "eager" : "lazy"}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-3xl">🛍️</div>
        )}

        {product.discountPercent != null && product.discountPercent > 0 ? (
          <span className="absolute start-2 top-2 rounded-md bg-[#e02e2a] px-1.5 py-0.5 text-[11px] font-bold text-white shadow">
            −{product.discountPercent}%
          </span>
        ) : null}

        <WishlistHeart productId={product.id} initialActive={product.wishlistActive} className="absolute end-1.5 top-1.5 h-7 w-7" size={16} />

        {product.isPreorder ? (
          <span className="absolute end-2 top-10 rounded-md bg-[#083f30] px-1.5 py-0.5 text-[10px] font-semibold text-white">
            {labels.preorder}
          </span>
        ) : !product.hasStock ? (
          <span className="absolute inset-x-0 bottom-0 bg-black/55 py-1 text-center text-[11px] font-semibold text-white">
            {labels.outOfStock}
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-1 p-2.5">
        <h3 className="line-clamp-2 min-h-[2.5rem] text-[13px] leading-tight text-neutral-800">
          {product.name}
        </h3>

        <div className="mt-0.5 flex items-baseline gap-1.5">
          {product.priceUnavailable ? (
            <span className="text-[13px] font-semibold text-muted-foreground">{labels.priceUnavailable}</span>
          ) : (
            <>
              {ranged ? (
                <span className="text-[11px] font-medium text-[#e02e2a]">{labels.from}</span>
              ) : null}
              <span className="text-[15px] font-extrabold text-[#e02e2a]">
                {formatShopMoney(product.price, product.currency, locale)}
              </span>
              {product.compareAtPrice ? (
                <span className="text-[11px] text-neutral-400 line-through">
                  {formatShopMoney(product.compareAtPrice, product.currency, locale)}
                </span>
              ) : null}
            </>
          )}
        </div>

        <div className="mt-auto flex items-center gap-2 pt-1 text-[11px] text-neutral-500">
          {product.rating > 0 ? (
            <span className="flex items-center gap-0.5">
              <span className="text-amber-500">★</span>
              {product.rating.toFixed(1)}
            </span>
          ) : null}
          {product.soldCount > 0 ? <span>{labels.sold(product.soldCount)}</span> : null}
          {product.brandName ? <span className="truncate">· {product.brandName}</span> : null}
        </div>
      </div>
    </Link>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl bg-white ring-1 ring-black/[0.04]">
      <div className="aspect-square w-full animate-pulse bg-neutral-100" />
      <div className="space-y-2 p-2.5">
        <div className="h-3 w-full animate-pulse rounded bg-neutral-100" />
        <div className="h-3 w-2/3 animate-pulse rounded bg-neutral-100" />
        <div className="h-4 w-1/3 animate-pulse rounded bg-neutral-100" />
      </div>
    </div>
  );
}
