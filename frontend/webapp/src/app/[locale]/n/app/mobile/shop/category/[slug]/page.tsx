import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";

import {
  getShopBrandsCached,
  getShopCategoriesCached,
} from "@/features/shop/api/catalog.repository.cached";
import { resolveDisplayCurrency } from "@/features/shop/lib/pricing";
import { ShopHeader } from "@/features/shop/components/ShopHeader";
import { ProductListView } from "@/features/shop/components/ProductListView";
import { ShopViewTracker } from "@/features/shop/components/ShopViewTracker";
import { shopImageSrc } from "@/features/shop/lib/image";

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

  // All cookie-free: category tree + brands are cached, the display currency is
  // the market default (no country / no per-visitor selection). The page is
  // still dynamic because of `searchParams` (filters/sort/pagination), but it
  // no longer does per-request cookie / cart / FX work.
  const [categories, { currency, selectable }] = await Promise.all([
    getShopCategoriesCached(locale),
    resolveDisplayCurrency({ countryCode: null, selectedCurrencyCode: null }),
  ]);
  const category = categories.find((c) => c.slug === slug);
  if (!category) notFound();
  const brands = await getShopBrandsCached(locale, slug);

  return (
    <div className="min-h-screen bg-neutral-50">
      <ShopHeader
        currency={currency}
        selectableCurrencies={selectable.map((s) => ({ code: s.code, symbol: s.symbol, name: s.name }))}
        back="/n/app/mobile/shop"
      />
      <ShopViewTracker categoryId={category.id} surface="category" />
      {category.bannerUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={shopImageSrc(category.bannerUrl)} alt={category.name} className="h-32 w-full object-cover" />
      ) : null}
      <ProductListView
        locale={locale}
        basePath={`/n/app/mobile/shop/category/${slug}`}
        searchParams={sp}
        fixed={{ category: slug }}
        heading={category.name}
        brands={brands}
        displayCurrency={currency}
      />
    </div>
  );
}
