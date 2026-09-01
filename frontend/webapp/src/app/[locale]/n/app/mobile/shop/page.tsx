import { getTranslations, setRequestLocale } from "next-intl/server";

import { getShopHome } from "@/features/shop/api/home.repository";
import { getCartView } from "@/features/shop/api/cart.repository";
import { ShopHeader } from "@/features/shop/components/ShopHeader";
import { HomeSectionView, ProductGrid } from "@/features/shop/components/home-sections";
import { searchProducts } from "@/features/shop/api/catalog.repository";
import { getRecentlyViewed } from "@/features/shop/api/recently-viewed.repository";

export const dynamic = "force-dynamic";

export default async function ShopHomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Shop");

  const [home, cart, feed, recentlyViewed] = await Promise.all([
    getShopHome(),
    getCartView(),
    searchProducts({ sort: "popularity", page: 1, pageSize: 20 }),
    getRecentlyViewed(undefined, 10),
  ]);

  return (
    <div className="min-h-screen bg-neutral-50 pb-24">
      <ShopHeader
        cartCount={cart.itemCount}
        currency={home.currency}
        selectableCurrencies={home.selectableCurrencies}
      />

      <div className="space-y-1 bg-white pb-2">
        {home.sections.map((section) => (
          <HomeSectionView key={section.key} section={section} locale={locale} />
        ))}
      </div>

      {recentlyViewed.length ? (
        <section className="mt-2 bg-white px-4 py-3">
          <h2 className="mb-2.5 text-[15px] font-extrabold text-neutral-900">{t("recentlyViewed")}</h2>
          <ProductGrid products={recentlyViewed.slice(0, 6)} locale={locale} />
        </section>
      ) : null}

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
