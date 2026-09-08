import { getTranslations, setRequestLocale } from "next-intl/server";

import {
  getShopDefaultCurrencyCached,
} from "@/features/shop/api/catalog.repository.cached";
import { getShopHomeCached } from "@/features/shop/api/home.repository.cached";
import { ShopHeader } from "@/features/shop/components/ShopHeader";
import { HomeSectionView, ProductGrid } from "@/features/shop/components/home-sections";
import { searchProducts } from "@/features/shop/api/catalog.repository";
import { RecentlyViewedRail } from "@/features/shop/components/RecentlyViewedRail";
import { SponsoredPlacementSlot } from "@/features/sponsered-slider/components/sponsored-placement-slot";

/**
 * Fully static / ISR. Prices come off the server in their own stored currency
 * (`noFx`); `<ShopPrice>` inside every card converts to the visitor's chosen
 * currency on the client (`ShopCurrencyProvider` in `shop/layout`). Cart badge
 * and recently-viewed are client islands. Every read is cookie-free and cached.
 */
export const dynamic = "force-static";
export const revalidate = 3600;

// `force-static` bakes whatever this render produces into the page for the
// full `revalidate` window (1 hour) — see the identical helper in
// n/app/mobile/home/page.tsx. A transient DB/connection-pool hiccup during
// the one render that regenerates this page (most often right after a
// deploy restart) used to fall straight through to `.catch()` and ship an
// empty shop shell / "An error occurred" for up to an hour. This only runs
// once per (re)generation, never per visitor, so it can afford to retry for
// several seconds before a genuinely down database falls back to empty.
async function withShopRetry<T>(fn: () => Promise<T>, fallback: T, retries = 5, delayMs = 500): Promise<T> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === retries) {
        console.error('[shop] fetch failed after retries', error);
        return fallback;
      }
      await new Promise((resolve) => setTimeout(resolve, delayMs * (attempt + 1)));
    }
  }
  return fallback;
}

export default async function ShopHomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Shop");

  const displayCurrency = await withShopRetry(() => getShopDefaultCurrencyCached(), "USD");

  const home = await withShopRetry(() => getShopHomeCached(locale, displayCurrency), {
    currency: displayCurrency,
    pricingMode: "market_default" as const,
    selectableCurrencies: [] as Array<{ code: string; symbol: string; name: string }>,
    categories: [],
    sections: [],
  });
  const feed = await withShopRetry(
    () => searchProducts(
      { sort: "popularity", page: 1, pageSize: 20 },
      { locale, displayCurrency: home.currency, cookieFree: true, noFx: true },
    ),
    { items: [], total: 0, page: 1, pageSize: 20 },
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

      <SponsoredPlacementSlot locale={locale} placement="shop_home" />

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
