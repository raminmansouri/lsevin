import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";

import { getShopCategories } from "@/features/shop/api/catalog.repository";
import { getCartView } from "@/features/shop/api/cart.repository";
import { resolveDisplayCurrency } from "@/features/shop/lib/pricing";
import { getShopContext } from "@/features/shop/lib/context";
import { ShopHeader } from "@/features/shop/components/ShopHeader";
import { ProductListView } from "@/features/shop/components/ProductListView";
import { emitCommerceEvent } from "@/features/shop/lib/analytics";

export const dynamic = "force-dynamic";

export default async function ShopCategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const sp = await searchParams;

  const [categories, cart, ctx] = await Promise.all([getShopCategories(), getCartView(), getShopContext()]);
  const category = categories.find((c) => c.slug === slug);
  if (!category) notFound();
  const { currency, selectable } = await resolveDisplayCurrency(ctx);
  await emitCommerceEvent("shop_product_view", { categoryId: category.id, surface: "category" });

  return (
    <div className="min-h-screen bg-neutral-50">
      <ShopHeader
        cartCount={cart.itemCount}
        currency={currency}
        selectableCurrencies={selectable.map((s) => ({ code: s.code, symbol: s.symbol, name: s.name }))}
        back="/n/app/mobile/shop"
      />
      {category.bannerUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={category.bannerUrl} alt={category.name} className="h-32 w-full object-cover" />
      ) : null}
      <ProductListView
        locale={locale}
        basePath={`/n/app/mobile/shop/category/${slug}`}
        searchParams={sp}
        fixed={{ category: slug }}
        heading={category.name}
      />
    </div>
  );
}
