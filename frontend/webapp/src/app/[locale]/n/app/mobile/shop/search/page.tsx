import { setRequestLocale } from "next-intl/server";

import { getCartView } from "@/features/shop/api/cart.repository";
import { getShopFacetsAction, searchShopProductsAction } from "@/features/shop/actions/catalog.actions";
import { ShopCatalog } from "@/features/shop/components/catalog/ShopCatalog";
import { ShopHeader } from "@/features/shop/components/ShopHeader";
import { emitCommerceEvent } from "@/features/shop/lib/analytics";
import { parseShopFilters, shopFiltersInput } from "@/features/shop/lib/catalog-filters";
import { getShopContext } from "@/features/shop/lib/context";
import { resolveDisplayCurrency } from "@/features/shop/lib/pricing";

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
  const one = (key: string) => {
    const value = sp[key];
    return Array.isArray(value) ? value[0] : value;
  };
  const q = one("q");
  const filters = parseShopFilters(one);
  const input = shopFiltersInput(filters, {}, locale, 24);

  const [cart, ctx, results, facets] = await Promise.all([
    getCartView(),
    getShopContext(),
    searchShopProductsAction(input),
    getShopFacetsAction({ ...input, fixedCategory: false }),
  ]);
  const { currency, selectable } = await resolveDisplayCurrency(ctx);
  if (q) await emitCommerceEvent("shop_search", { surface: "search", extra: { q } });

  return (
    <div data-shop-cream="" className="min-h-screen bg-neutral-50 xl:bg-[#f7f2e7] xl:pb-10">
      <ShopHeader
        cartCount={cart.itemCount}
        searchDefault={q ?? ""}
        currency={currency}
        selectableCurrencies={selectable.map((s) => ({ code: s.code, symbol: s.symbol, name: s.name }))}
        back="/shop"
      />
      <ShopCatalog
        key={q ?? ""}
        locale={locale}
        basePath="/shop/search"
        fixed={{}}
        initialFilters={filters}
        initialItems={results.items}
        initialTotal={results.total}
        initialFacets={facets}
      />
    </div>
  );
}