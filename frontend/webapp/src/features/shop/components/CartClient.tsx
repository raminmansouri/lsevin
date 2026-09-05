"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";

import { Link, useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

import {
  applyCouponAction,
  clearCouponAction,
  removeCartLineAction,
  toggleSavedForLaterAction,
  updateCartLineQuantityAction,
} from "../actions/cart.actions";
import { formatShopMoney } from "./money";
import type { CartView } from "../types/domain";
import { shopImageSrc } from "../lib/image";

export function CartClient({ initial, locale }: { initial: CartView; locale: string }) {
  const t = useTranslations("Shop");
  const router = useRouter();
  const [cart, setCart] = useState(initial);
  const [pending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  const active = cart.items.filter((i) => !i.savedForLater);
  const saved = cart.items.filter((i) => i.savedForLater);

  function run(fn: () => Promise<{ cart: CartView }>) {
    setErr(null);
    startTransition(async () => {
      try {
        const res = await fn();
        setCart(res.cart);
      } catch (e) {
        setErr(e instanceof Error ? e.message : t("somethingWrong"));
      }
    });
  }

  if (!active.length && !saved.length) {
    return (
      <div className="flex flex-col items-center justify-center px-6 py-24 text-center">
        <div className="text-5xl">🛒</div>
        <p className="mt-4 text-base font-bold text-neutral-800">{t("cartEmpty")}</p>
        <p className="mt-1 text-sm text-neutral-500">{t("cartEmptyHint")}</p>
        <Link href="/n/app/mobile/shop" className="mt-5 rounded-full bg-[#083f30] px-6 py-2.5 text-sm font-bold text-white">
          {t("startShopping")}
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3 p-4 pb-40">
      {err ? <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">{err}</p> : null}

      {active.map((item) => (
        <article key={item.id} className="flex gap-3 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-black/[0.04]">
          <Link href={`/n/app/mobile/shop/product/${item.slug}`} className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-neutral-100">
            {item.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={shopImageSrc(item.imageUrl)} alt={item.name} className="h-full w-full object-cover" />
            ) : null}
          </Link>
          <div className="flex min-w-0 flex-1 flex-col">
            <p className="line-clamp-2 text-[13px] font-medium text-neutral-800">{item.name}</p>
            {item.variantTitle ? <p className="text-xs text-neutral-500">{item.variantTitle}</p> : null}
            {!item.hasStock ? <p className="text-xs font-semibold text-[#e02e2a]">{t("outOfStock")}</p> : null}
            <div className="mt-auto flex items-center justify-between pt-1">
              <span className="text-[15px] font-extrabold text-[#e02e2a]">
                {item.priceUnavailable ? t("priceUnavailable") : formatShopMoney(item.unitPrice, item.currency, locale)}
              </span>
              <div className="flex items-center rounded-lg border border-neutral-200">
                <button
                  aria-label="decrease"
                  disabled={pending || item.quantity <= 1}
                  onClick={() => run(() => updateCartLineQuantityAction({ cartItemId: item.id, quantity: item.quantity - 1 }))}
                  className="px-2.5 py-1 text-neutral-600 disabled:opacity-40"
                >
                  −
                </button>
                <span className="min-w-[2rem] text-center text-sm font-semibold">{item.quantity}</span>
                <button
                  aria-label="increase"
                  disabled={pending || item.quantity >= item.maxPurchasable}
                  onClick={() => run(() => updateCartLineQuantityAction({ cartItemId: item.id, quantity: item.quantity + 1 }))}
                  className="px-2.5 py-1 text-neutral-600 disabled:opacity-40"
                >
                  +
                </button>
              </div>
            </div>
            <div className="mt-1.5 flex gap-3 text-[11px] font-medium text-neutral-500">
              <button disabled={pending} onClick={() => run(() => toggleSavedForLaterAction(item.id))}>
                {t("saveForLater")}
              </button>
              <button disabled={pending} onClick={() => run(() => removeCartLineAction(item.id))} className="text-[#e02e2a]">
                {t("remove")}
              </button>
            </div>
          </div>
        </article>
      ))}

      {saved.length ? (
        <div className="pt-2">
          <p className="mb-2 text-sm font-bold text-neutral-800">{t("savedForLater")}</p>
          {saved.map((item) => (
            <div key={item.id} className="mb-2 flex items-center gap-3 rounded-2xl bg-white p-3 ring-1 ring-black/[0.04]">
              <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-neutral-100">
                {item.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={shopImageSrc(item.imageUrl)} alt={item.name} className="h-full w-full object-cover" />
                ) : null}
              </div>
              <p className="line-clamp-1 flex-1 text-[13px] text-neutral-700">{item.name}</p>
              <button
                disabled={pending}
                onClick={() => run(() => toggleSavedForLaterAction(item.id))}
                className="rounded-full bg-[#083f30]/5 px-3 py-1.5 text-xs font-semibold text-[#083f30]"
              >
                {t("moveToCart")}
              </button>
            </div>
          ))}
        </div>
      ) : null}

      {active.length ? (
        <>
          <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/[0.04]">
            <div className="mb-3 flex gap-2">
              <input
                id="cart-coupon"
                defaultValue={cart.totals.couponCode ?? ""}
                placeholder={t("couponCode")}
                className="min-w-0 flex-1 rounded-xl border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-[#083f30]"
              />
              {cart.totals.couponCode ? (
                <button
                  disabled={pending}
                  onClick={() => run(() => clearCouponAction(cart.id))}
                  className="rounded-xl border border-neutral-300 px-3 py-2 text-sm font-semibold text-neutral-600"
                >
                  {t("remove")}
                </button>
              ) : (
                <button
                  disabled={pending}
                  onClick={() => {
                    const el = document.getElementById("cart-coupon") as HTMLInputElement | null;
                    const code = el?.value.trim();
                    if (code) run(() => applyCouponAction({ cartId: cart.id, code }));
                  }}
                  className="rounded-xl bg-[#083f30] px-4 py-2 text-sm font-semibold text-white"
                >
                  {t("apply")}
                </button>
              )}
            </div>
            {cart.couponMessage && cart.couponMessage !== "applied" ? (
              <p
                className={`mb-2 text-xs ${cart.couponMessage === "free_shipping" ? "text-emerald-600" : "text-amber-700"}`}
              >
                {cart.couponMessage === "free_shipping" ? t("freeShipping") : `${t("couponCode")}: ${cart.couponMessage}`}
              </p>
            ) : null}

            <Row label={t("subtotal")} value={formatShopMoney(cart.totals.subtotal, cart.totals.currency, locale)} />
            {cart.totals.discountTotal > 0 ? (
              <Row label={t("discount")} value={`− ${formatShopMoney(cart.totals.discountTotal, cart.totals.currency, locale)}`} />
            ) : null}
            <div className="mt-2 flex items-center justify-between border-t border-neutral-100 pt-2 text-base font-extrabold">
              <span>{t("total")}</span>
              <span className="text-[#e02e2a]">{formatShopMoney(cart.totals.grandTotal, cart.totals.currency, locale)}</span>
            </div>
            {cart.totals.hasUnavailablePrice ? (
              <p className="mt-2 text-xs text-amber-700">{t("priceUnavailable")}</p>
            ) : null}
          </div>

          <div className="fixed inset-x-0 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-40 border-t border-neutral-200 bg-white/95 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur">
            <div className="mx-auto flex max-w-md items-center gap-3">
              <div className="flex flex-col">
                <span className="text-[10px] text-neutral-500">{t("total")}</span>
                <span className="text-lg font-extrabold text-[#e02e2a]">
                  {formatShopMoney(cart.totals.grandTotal, cart.totals.currency, locale)}
                </span>
              </div>
              <button
                disabled={pending || cart.totals.hasUnavailablePrice || active.some((i) => !i.hasStock)}
                onClick={() => router.push("/n/app/mobile/shop/checkout")}
                className={cn(
                  "ms-auto rounded-full bg-[#083f30] px-8 py-3 text-sm font-bold text-white disabled:opacity-50"
                )}
              >
                {t("checkout")} · {t("itemsCount", { count: cart.itemCount })}
              </button>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1 text-sm text-neutral-600">
      <span>{label}</span>
      <span className="font-medium text-neutral-800">{value}</span>
    </div>
  );
}
