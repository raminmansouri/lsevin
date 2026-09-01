import { setRequestLocale } from "next-intl/server";

import { getCartView } from "@/features/shop/api/cart.repository";
import { resolveDisplayCurrency } from "@/features/shop/lib/pricing";
import { getShopContext } from "@/features/shop/lib/context";
import { ShopHeader } from "@/features/shop/components/ShopHeader";
import { ProductListView } from "@/features/shop/components/ProductListView";
import { emitCommerceEvent } from "@/features/shop/lib/analytics";

export const dynamic = "force-dynamic";

export default async function ShopSearchPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const sp = await searchParams;
  const q = Array.isArray(sp.q) ? sp.q[0] : sp.q;

  const [cart, ctx] = await Promise.all([getCartView(), getShopContext()]);
  const { currency, selectable } = await resolveDisplayCurrency(ctx);
  if (q) await emitCommerceEvent("shop_search", { surface: "search", extra: { q } });

  return (
    <div className="min-h-screen bg-neutral-50">
      <ShopHeader
        cartCount={cart.itemCount}
        searchDefault={q ?? ""}
        currency={currency}
        selectableCurrencies={selectable.map((s) => ({ code: s.code, symbol: s.symbol, name: s.name }))}
        back="/n/app/mobile/shop"
      />
      <ProductListView locale={locale} basePath="/n/app/mobile/shop/search" searchParams={sp} />
    </div>
  );
}
