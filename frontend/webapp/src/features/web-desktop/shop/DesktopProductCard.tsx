import { Star } from "lucide-react";

import { shopImageSrc } from "@/features/shop/lib/image";
import { ShopPrice } from "@/features/shop/components/ShopPrice";
import { WishlistHeart } from "@/features/shop/components/WishlistHeart";
import type { shopCardLabels } from "@/features/shop/components/ProductCard";
import type { ProductCard as ProductCardModel } from "@/features/shop/types/domain";
import { Link } from "@/i18n/navigation";

type Labels = ReturnType<typeof shopCardLabels>;

/** Small, minimal desktop product card: same data, price, wishlist and badges as the mobile card. */
export function DesktopProductCard({
  product,
  locale,
  labels,
  priority = false,
}: {
  product: ProductCardModel;
  locale: string;
  labels: Labels;
  priority?: boolean;
}) {
  return (
    <div className="group relative">
      <Link href={`/n/app/mobile/shop/product/${product.slug}`} className="block">
        <div className="relative aspect-square overflow-hidden rounded-[20px] bg-[#f4efe4] ring-1 ring-transparent transition duration-500 group-hover:ring-[#c9a55a]">
          {product.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={shopImageSrc(product.imageUrl)}
              alt={product.name}
              loading={priority ? "eager" : "lazy"}
              className="h-full w-full object-cover transition-transform duration-[1.2s] group-hover:scale-[1.06]"
            />
          ) : (
            <div className="grid h-full w-full place-items-center text-3xl">🛍️</div>
          )}
          {product.discountPercent != null && product.discountPercent > 0 ? (
            <span suppressHydrationWarning className="absolute end-2.5 top-2.5 rounded-full bg-[#062a20] px-2 py-0.5 text-[11px] font-bold text-[#eacb7f]">
              −{product.discountPercent}%
            </span>
          ) : null}
          {!product.hasStock && !product.isPreorder ? (
            <span className="absolute inset-x-0 bottom-0 bg-[#062a20]/70 py-1.5 text-center text-[11px] font-bold text-white">{labels.outOfStock}</span>
          ) : product.isPreorder ? (
            <span className="absolute bottom-2.5 end-2.5 rounded-full bg-[#083f30] px-2 py-0.5 text-[10px] font-bold text-white">{labels.preorder}</span>
          ) : null}
        </div>

        <div className="space-y-1 px-1 pt-3">
          {product.brandName ? (
            <p className="truncate text-[10px] font-bold uppercase tracking-[0.22em] text-[#c9a55a]">{product.brandName}</p>
          ) : null}
          <h3 className="line-clamp-2 min-h-[2.5rem] text-[13px] leading-5 text-[#0e1a16]">{product.name}</h3>
          <div className="flex flex-wrap items-baseline gap-x-2">
            {product.priceUnavailable ? (
              <span className="text-xs text-[#56675f]">{labels.priceUnavailable}</span>
            ) : (
              <>
                {product.priceMax > product.price + 0.001 ? <span className="text-[11px] text-[#56675f]">{labels.from}</span> : null}
                <ShopPrice amount={product.price} currency={product.currency} locale={locale} className="text-[15px] font-black text-[#083f30]" />
                {product.compareAtPrice ? (
                  <ShopPrice amount={product.compareAtPrice} currency={product.currency} locale={locale} className="text-[11px] text-[#8fa79d] line-through" />
                ) : null}
              </>
            )}
          </div>
          {product.rating > 0 ? (
            <p className="flex items-center gap-1 text-[11px] text-[#56675f]">
              <Star size={11} className="fill-[#c9a55a] text-[#c9a55a]" />
              {new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(product.rating)}
              {product.soldCount > 0 ? <span className="ms-1">· {labels.sold(product.soldCount)}</span> : null}
            </p>
          ) : null}
        </div>
      </Link>

      <WishlistHeart
        productId={product.id}
        initialActive={product.wishlistActive}
        resolveOnMount
        className="absolute start-2.5 top-2.5 h-8 w-8 bg-white/90 opacity-0 shadow-sm transition group-hover:opacity-100 data-[active=true]:opacity-100"
        size={15}
      />
    </div>
  );
}