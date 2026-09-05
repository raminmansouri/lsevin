"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { addToCartAction } from "@/features/shop/actions/cart.actions";
import { ProductCard, shopCardLabels } from "@/features/shop/components/ProductCard";
import type { ProductCard as ProductCardModel } from "@/features/shop/types/domain";

/** relation type -> Shop i18n key for its heading (mirrors ServiceProductsRail) */
const REL_KEY: Record<string, string> = {
  required: "relRequired",
  recommended_before: "relBefore",
  recommended_during: "relDuring",
  recommended_after: "relAfter",
  optional_addon: "relAddon",
  compatible: "relCompatible",
  general: "relGeneral",
};

export type BookingShopProductGroup = {
  relationType: string;
  products: ProductCardModel[];
};

/**
 * Optional booking-wizard step: shop products an admin has linked to the booked
 * service. Adding one puts it straight into the shop cart (checked out
 * separately) — the booking flow is never blocked, and the wizard's own bottom
 * bar drives "Continue".
 */
export function BookingShopProductsStep({
  groups,
  locale,
}: {
  groups: BookingShopProductGroup[];
  locale: string;
}) {
  const t = useTranslations("Shop");
  const tBooking = useTranslations("Booking");
  const labels = shopCardLabels(t as never);
  const [added, setAdded] = useState<Record<string, boolean>>({});
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function add(productId: string) {
    setPendingId(productId);
    startTransition(async () => {
      try {
        await addToCartAction({ productId, quantity: 1 });
        setAdded((prev) => ({ ...prev, [productId]: true }));
      } catch {
        // Non-blocking: a failed add just leaves the button in its default state.
      } finally {
        setPendingId(null);
      }
    });
  }

  return (
    <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-lg">
      <h2 className="text-xl font-bold text-slate-900">{tBooking("stepShopProducts")}</h2>
      <p className="mt-1 text-sm text-slate-600">{tBooking("shopProductsStepHint")}</p>

      <div className="mt-4 space-y-6">
        {groups.map((group) => (
          <div key={group.relationType}>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
              {t.has(REL_KEY[group.relationType] ?? "relGeneral")
                ? t((REL_KEY[group.relationType] ?? "relGeneral") as never)
                : group.relationType}
            </p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {group.products.map((product) => (
                <div key={product.id} className="flex flex-col gap-2">
                  <Link href={`/n/app/mobile/shop/product/${product.slug}`} className="block">
                    <ProductCard product={product} locale={locale} labels={labels} />
                  </Link>
                  <button
                    type="button"
                    onClick={() => add(product.id)}
                    disabled={pendingId === product.id || added[product.id]}
                    className="h-9 rounded-xl bg-[#083f30] text-xs font-bold text-white disabled:opacity-60"
                  >
                    {added[product.id]
                      ? tBooking("shopProductAdded")
                      : pendingId === product.id
                        ? tBooking("shopProductAdding")
                        : tBooking("shopProductAddToCart")}
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
