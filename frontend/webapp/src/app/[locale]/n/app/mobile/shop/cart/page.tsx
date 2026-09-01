import { getTranslations, setRequestLocale } from "next-intl/server";

import { getCartView } from "@/features/shop/api/cart.repository";
import { ShopHeader } from "@/features/shop/components/ShopHeader";
import { CartClient } from "@/features/shop/components/CartClient";

export const dynamic = "force-dynamic";

export default async function CartPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Shop");
  const cart = await getCartView();

  return (
    <div className="min-h-screen bg-neutral-50">
      <ShopHeader
        cartCount={cart.itemCount}
        currency={cart.currency}
        selectableCurrencies={cart.selectableCurrencies}
        back="/n/app/mobile/shop"
      />
      <h1 className="px-4 pt-3 text-lg font-extrabold text-neutral-900">{t("cart")}</h1>
      <CartClient initial={cart} locale={locale} />
    </div>
  );
}
