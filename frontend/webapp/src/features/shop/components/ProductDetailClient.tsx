"use client";

import { useMemo, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { ShieldCheck, Store, Truck } from "lucide-react";

import { useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

import { addToCartAction } from "../actions/cart.actions";
import type { ProductDetail } from "../types/domain";
import { ShopPrice } from "./ShopPrice";

export function ProductDetailClient({
  product,
  locale,
}: {
  product: ProductDetail;
  locale: string;
}) {
  const t = useTranslations("Shop");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [variantId, setVariantId] = useState<string | null>(
    product.variants.length ? product.variants[0].id : null
  );
  const [qty, setQty] = useState(1);
  const [msg, setMsg] = useState<string | null>(null);

  const selected = useMemo(
    () => product.variants.find((v) => v.id === variantId) ?? null,
    [product.variants, variantId]
  );

  const needsVariant = product.variants.length > 0;
  // The winning offer for the selected item: in stock first, cheapest, fastest to ship
  // (the same rule as the product card and the cart).
  const itemOffers = useMemo(
    () =>
      (product.offers ?? [])
        .filter((o) => o.variantId === (variantId ?? null))
        .sort(
          (a, b) =>
            Number(b.inStock) - Number(a.inStock) ||
            a.price - b.price ||
            (a.handlingDays ?? 99) - (b.handlingDays ?? 99)
        ),
    [product.offers, variantId]
  );
  const bestOffer = itemOffers[0] ?? null;
  const shipping = (days: number | null) =>
    days == null ? null : days === 0 ? t("sellerOffers.shipsToday") : t("sellerOffers.shipsIn", { days });
  const price = bestOffer ? bestOffer.price : selected ? selected.price : product.price;
  const compareAt = bestOffer ? bestOffer.compareAtPrice : selected ? selected.compareAtPrice : product.compareAtPrice;
  const currency = bestOffer ? bestOffer.currency : selected ? selected.currency : product.currency;
  const priceUnavailable = bestOffer
    ? bestOffer.priceUnavailable
    : selected
      ? selected.priceUnavailable
      : product.priceUnavailable;
  const inStock = bestOffer ? bestOffer.inStock : selected ? selected.hasStock : product.hasStock;
  const maxQty = Math.max(
    1,
    selected
      ? selected.inventoryAvailable || 99
      : product.inventoryAvailable || 99
  );

  function add(then?: "cart" | "stay", offerId?: string) {
    setMsg(null);
    if (needsVariant && !variantId) {
      setMsg(t("selectVariantFirst"));
      return;
    }
    startTransition(async () => {
      try {
        await addToCartAction({
          productId: product.id,
          variantId,
          offerId: offerId ?? bestOffer?.id ?? null,
          quantity: qty,
        });
        if (then === "cart") router.push("/n/app/mobile/shop/cart");
        else setMsg(t("added"));
      } catch (e) {
        setMsg(e instanceof Error ? e.message : t("somethingWrong"));
      }
    });
  }

  return (
    <div className="space-y-4">
      {product.variants.length > 1 ? (
        <div>
          <p className="mb-2 text-sm font-semibold text-neutral-800">
            {t("selectOption")}
          </p>
          <div className="flex flex-wrap gap-2">
            {product.variants.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => setVariantId(v.id)}
                className={cn(
                  "rounded-xl border px-3 py-2 text-sm transition",
                  v.id === variantId
                    ? "border-[#083f30] bg-[#083f30]/5 font-semibold text-[#083f30]"
                    : "border-neutral-200 text-neutral-700",
                  !v.hasStock && "opacity-50"
                )}
              >
                {v.title}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {bestOffer ? (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-xl bg-neutral-50 px-3 py-2.5 text-xs text-neutral-600 ring-1 ring-neutral-100">
          <span className="flex items-center gap-1.5 font-semibold text-neutral-900">
            <Store size={14} className="text-[#083f30]" />
            {t("sellerOffers.soldBy", { name: bestOffer.sellerName })}
          </span>
          {bestOffer.warranty ? (
            <span className="flex items-center gap-1">
              <ShieldCheck size={13} className="text-[#083f30]" />
              {bestOffer.warranty}
            </span>
          ) : null}
          {shipping(bestOffer.handlingDays) ? (
            <span className="flex items-center gap-1">
              <Truck size={13} className="text-[#083f30]" />
              {shipping(bestOffer.handlingDays)}
            </span>
          ) : null}
        </div>
      ) : null}

      <div className="flex items-center gap-3">
        <span className="text-sm font-semibold text-neutral-800">
          {t("quantity")}
        </span>
        <div className="flex items-center rounded-xl border border-neutral-200">
          <button
            type="button"
            aria-label="decrease"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            className="px-3 py-1.5 text-lg leading-none text-neutral-600"
          >
            −
          </button>
          <span className="min-w-[2.5rem] text-center text-sm font-semibold">{new Intl.NumberFormat(locale).format(qty)}</span>
          <button
            type="button"
            aria-label="increase"
            onClick={() => setQty((q) => Math.min(maxQty, q + 1))}
            className="px-3 py-1.5 text-lg leading-none text-neutral-600"
          >
            +
          </button>
        </div>
        {selected &&
        selected.inventoryAvailable > 0 &&
        selected.inventoryAvailable <= 5 ? (
          <span className="text-xs font-medium text-[#e02e2a]">
            {t("lowStock", { count: new Intl.NumberFormat(locale).format(selected.inventoryAvailable) })}
          </span>
        ) : null}
      </div>

      {msg ? (
        <p
          className={cn(
            "rounded-lg px-3 py-2 text-sm",
            msg === t("added")
              ? "bg-emerald-50 text-emerald-700"
              : "bg-amber-50 text-amber-800"
          )}
          role="status"
        >
          {msg}
        </p>
      ) : null}

      {/* Every seller of the selected item, cheapest in-stock first (the first is the winner). */}
      {itemOffers.length > 1 ? (
        <div className="rounded-2xl ring-1 ring-neutral-200">
          <p className="border-b border-neutral-100 px-4 py-3 text-sm font-bold text-neutral-900">
            {t("sellerOffers.title", { count: itemOffers.length })}
          </p>
          <ul className="divide-y divide-neutral-100">
            {itemOffers.map((o, index) => (
              <li key={o.id} className="flex items-center gap-3 px-4 py-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full bg-[#083f30]/5 text-sm font-bold text-[#083f30]">
                  {o.sellerLogoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={o.sellerLogoUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    o.sellerName.charAt(0)
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2 text-sm font-semibold text-neutral-900">
                    {o.sellerName}
                    {index === 0 ? (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">{t("sellerOffers.best")}</span>
                    ) : null}
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-neutral-500">
                    {[o.warranty, shipping(o.handlingDays)].filter(Boolean).join(" · ")}
                  </span>
                </span>
                <span className="shrink-0 text-end">
                  {o.priceUnavailable ? (
                    <span className="text-xs text-neutral-500">{t("priceUnavailable")}</span>
                  ) : (
                    <ShopPrice amount={o.price} currency={o.currency} locale={locale} className="block text-sm font-extrabold text-[#e02e2a]" />
                  )}
                  {!o.inStock ? <span className="text-[11px] text-neutral-400">{t("sellerOffers.outOfStock")}</span> : null}
                </span>
                <button
                  type="button"
                  disabled={pending || o.priceUnavailable || !o.inStock}
                  onClick={() => add("stay", o.id)}
                  className="shrink-0 rounded-full border border-[#083f30] px-3 py-1.5 text-xs font-bold text-[#083f30] disabled:opacity-40"
                >
                  {t("sellerOffers.add")}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {/* sticky action bar */}
      <div className="fixed inset-x-0 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-40 border-t border-neutral-200 bg-white/95 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur xl:static xl:z-auto xl:mt-2 xl:rounded-[24px] xl:border xl:border-[#dce4e0] xl:bg-white xl:p-5 xl:backdrop-blur-none">
        <div className="mx-auto flex max-w-md flex-wrap items-center gap-2">
          <div className="min-w-0 flex-1 basis-36 [overflow-wrap:anywhere] break-words">
            <span className="text-[10px] text-neutral-500">
              {t("grandTotal")}
            </span>
            {priceUnavailable ? (
              <span className="text-sm font-bold text-neutral-500">
                {t("priceUnavailable")}
              </span>
            ) : (
              <ShopPrice
                amount={price * qty}
                currency={currency}
                locale={locale}
                className="text-lg font-extrabold text-[#e02e2a]"
              />
            )}
          </div>
          <button
            type="button"
            disabled={
              pending ||
              priceUnavailable ||
              (!inStock && !product.allowBackorder)
            }
            onClick={() => add("stay")}
            className="ms-auto shrink-0 rounded-full border-2 border-[#083f30] px-4 py-2.5 text-sm font-bold text-[#083f30] disabled:opacity-50"
          >
            {t("addToCart")}
          </button>
          <button
            type="button"
            disabled={
              pending ||
              priceUnavailable ||
              (!inStock && !product.allowBackorder)
            }
            onClick={() => add("cart")}
            className="rounded-full bg-[#083f30] px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50"
          >
            {product.isPreorder ? t("preorder") : t("buyNow")}
          </button>
        </div>
      </div>
    </div>
  );
}
