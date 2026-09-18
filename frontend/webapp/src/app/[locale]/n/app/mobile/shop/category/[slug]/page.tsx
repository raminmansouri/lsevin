import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { alternatesFor } from "@/lib/seo/alternates";
import {
  getShopBrandsCached,
  getShopCategoriesCached,
} from "@/features/shop/api/catalog.repository.cached";
import { searchProducts } from "@/features/shop/api/catalog.repository";
import { ShopHeader } from "@/features/shop/components/ShopHeader";
import { ProductListViewClient } from "@/features/shop/components/ProductListViewClient";
import { ShopViewTracker } from "@/features/shop/components/ShopViewTracker";
import { shopImageSrc } from "@/features/shop/lib/image";

// Static / ISR. The shell + the first page of results are prerendered per
// (slug, locale); filtering / sorting / pagination and the visitor's currency
// are all client-side. `generateStaticParams` prewarms the active categories.
export const dynamic = "force-static";
export const revalidate = 3600;

export async function generateStaticParams() {
  try {
    const cats = await getShopCategoriesCached("en");
    return cats.filter((c) => c.slug).map((c) => ({ slug: c.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const [categories, t] = await Promise.all([
    getShopCategoriesCached(locale).catch(() => []),
    getTranslations({ locale, namespace: "Shop" }),
  ]);
  const category = categories.find((c) => c.slug === slug);

  if (!category) {
    return { title: "Category", alternates: alternatesFor(locale, `/n/app/mobile/shop/category/${slug}`) };
  }

  return {
    title: category.name,
    description: t("categoryMetaDescription", { count: category.productCount, name: category.name }),
    alternates: alternatesFor(locale, `/n/app/mobile/shop/category/${slug}`),
    openGraph: {
      title: category.name,
      type: "website",
      images: category.imageUrl ? [{ url: category.imageUrl }] : undefined,
    },
  };
}

export default async function ShopCategoryPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const categories = await getShopCategoriesCached(locale).catch(() => []);
  const category = categories.find((c) => c.slug === slug);
  if (!category) notFound();

  const [brands, feed] = await Promise.all([
    getShopBrandsCached(locale, slug).catch(() => []),
    searchProducts(
      { category: slug, sort: "popularity", page: 1, pageSize: 24 },
      { locale, displayCurrency: "USD", cookieFree: true, noFx: true },
    ).catch(() => ({ items: [], total: 0, page: 1, pageSize: 24 })),
  ]);

  return (
    <div className="min-h-screen bg-neutral-50">
      <ShopHeader back="/n/app/mobile/shop" />
      <ShopViewTracker categoryId={category.id} surface="category" />
      {category.bannerUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={shopImageSrc(category.bannerUrl)} alt={category.name} className="h-32 w-full object-cover" />
      ) : null}
      <Suspense fallback={null}>
        <ProductListViewClient
          locale={locale}
          basePath={`/n/app/mobile/shop/category/${slug}`}
          fixed={{ category: slug }}
          heading={category.name}
          brands={brands}
          initialItems={feed.items}
          initialTotal={feed.total}
        />
      </Suspense>
    </div>
  );
}
