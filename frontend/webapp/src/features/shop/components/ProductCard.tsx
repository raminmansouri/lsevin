"use client";
import { Heart, Star } from "lucide-react";
import type { ProductCard as ProductCardType } from "../types/domain";

function formatPrice(value: number, currency: string) {
  try { return new Intl.NumberFormat("en", { style: "currency", currency, maximumFractionDigits: 0 }).format(value); }
  catch { return `${currency} ${value.toFixed(2)}`; }
}

export function ProductCard({ product }: { product: ProductCardType }) {
  return (
    <article className="rounded-2xl border border-gray-100 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
      <div className="relative aspect-square overflow-hidden rounded-t-2xl bg-gray-50">
        {product.imageUrl ? <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-sm text-gray-400">No image</div>}
        <button className="absolute right-3 top-3 rounded-full bg-white/90 p-2 shadow"><Heart size={16} className={product.wishlistActive ? "fill-rose-500 text-rose-500" : "text-gray-700"} /></button>
        {product.hasDiscount ? <div className="absolute left-3 top-3 rounded-full bg-[#eacb7f] px-3 py-1 text-xs font-bold text-[#083f30]">Sale</div> : null}
      </div>
      <div className="space-y-2 p-4">
        <div className="line-clamp-1 text-sm text-gray-500">{product.brandName ?? product.categoryName ?? "Shop"}</div>
        <h3 className="line-clamp-2 text-base font-bold text-gray-900">{product.name}</h3>
        <p className="line-clamp-2 text-sm text-gray-600">{product.shortDescription}</p>
        <div className="flex items-center gap-2 text-sm">
          <div className="flex items-center gap-1 text-amber-500"><Star size={14} className="fill-current" /><span className="font-semibold text-gray-900">{product.rating.toFixed(1)}</span></div>
          <span className="text-gray-400">({product.reviewCount})</span>
        </div>
        <div className="flex items-end justify-between">
          <div>
            <div className="text-lg font-bold text-[#083f30]">{formatPrice(product.minPrice, product.currency)}{product.maxPrice > product.minPrice ? ` - ${formatPrice(product.maxPrice, product.currency)}` : ""}</div>
            {product.compareAtPrice ? <div className="text-xs text-gray-400 line-through">{formatPrice(product.compareAtPrice, product.currency)}</div> : null}
          </div>
          <span className={`rounded-full px-2 py-1 text-xs font-semibold ${product.hasStock ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>{product.hasStock ? "In stock" : "Out of stock"}</span>
        </div>
      </div>
    </article>
  );
}
