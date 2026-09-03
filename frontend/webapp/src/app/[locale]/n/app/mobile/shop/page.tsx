import { getTranslations, setRequestLocale } from "next-intl/server";

import { getShopHomeCached } from "@/features/shop/api/home.repository.cached";
import { getShopContext } from "@/features/shop/lib/context";
import { resolveDisplayCurrency } from "@/features/shop/lib/pricing";
import { ShopHeader } from "@/features/shop/components/ShopHeader";
import { HomeSectionView, ProductGrid } from "@/features/shop/components/home-sections";
import { searchProducts } from "@/features/shop/api/catalog.repository";
import { RecentlyViewedRail } from "@/features/shop/components/RecentlyViewedRail";

/**
 * Dynamic (it reads the visitor's currency cookie), but every expensive read
 * is cached: the whole composition via `getShopHomeCached(locale, currency)`,
 * the featured feed via a cookie-free `searchProducts`. Cart badge and
 * recently-viewed are client islands.
 */
export default async function ShopHomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Shop");

  const ctx = await getShopContext();
  const { currency: displayCurrency } = await resolveDisplayCurrency(ctx);

  const home = await getShopHomeCached(locale, displayCurrency);
  const feed = await searchProducts(
    { sort: "popularity", page: 1, pageSize: 20 },
    { locale, displayCurrency: home.currency, cookieFree: true },
  );

  return (
    <div className="min-h-screen bg-neutral-50 pb-24">
      <ShopHeader currency={home.currency} selectableCurrencies={home.selectableCurrencies} />

      <div className="space-y-1 bg-white pb-2">
        {home.sections.map((section) => (
          <HomeSectionView key={section.key} section={section} locale={locale} />
        ))}
      </div>

      <RecentlyViewedRail locale={locale} />

      <section className="mt-2 px-4 pt-3">
        <h2 className="mb-2.5 text-[17px] font-extrabold text-neutral-900">{t("featured")}</h2>
        {feed.items.length ? (
          <ProductGrid products={feed.items} locale={locale} />
        ) : (
          <p className="rounded-xl bg-white p-8 text-center text-sm text-neutral-500">{t("noResults")}</p>
        )}
      </section>
    </div>
  );
}
