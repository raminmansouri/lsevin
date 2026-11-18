import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { buildPublicMetadata } from "@/lib/seo/metadata";
import { INDEXABLE_SHOP_LOCALES } from "@/lib/seo/locale-eligibility";
import { absoluteUrl } from "@/lib/seo/alternates";
import { breadcrumbList, graph } from "@/lib/seo/entity-schema";
import { JsonLd } from "@/lib/seo/json-ld";
import { publicMediaUrl } from "@/lib/seo/media-url";
import {
  getShopBrandsCached,
  getShopCategoriesCached,
} from "@/features/shop/api/catalog.repository.cached";
import { searchProducts } from "@/features/shop/api/catalog.repository";
import { ShopHeader } from "@/features/shop/components/ShopHeader";
import { ProductListViewClient } from "@/features/shop/components/ProductListViewClient";
import { ShopViewTracker } from "@/features/shop/components/ShopViewTracker";
import { shopImageSrc } from "@/features/shop/lib/image";
import { Link } from "@/i18n/navigation";

// Customer currency is resolved per request; category data remains cached.
export const dynamic = "force-dynamic";

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

  return buildPublicMetadata({
    locale,
    path: `/shop/${encodeURIComponent(slug)}`,
    title: category?.name,
    descriptions: category ? [t("categoryMetaDescription", { count: category.productCount, name: category.name })] : [],
    image: category?.imageUrl,
    eligibleLocales: INDEXABLE_SHOP_LOCALES,
  });
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
  const parent = category.parentId ? categories.find((c) => c.id === category.parentId) ?? null : null;
  const children = categories.filter((c) => c.parentId === category.id);

  const [brands, feed] = await Promise.all([
    getShopBrandsCached(locale, slug).catch(() => []),
    searchProducts(
      { category: slug, sort: "popularity", page: 1, pageSize: 24 },
      { locale, displayCurrency: "USD", cookieFree: true, noFx: true },
    ).catch(() => ({ items: [], total: 0, page: 1, pageSize: 24 })),
  ]);

  const t = await getTranslations("Shop");
  const brand = (await getTranslations({ locale, namespace: "LocaleLayout" }))("title");
  const categoryUrl = absoluteUrl(locale, `/shop/${encodeURIComponent(slug)}`);

  return (
    <div className="min-h-screen bg-neutral-50">
      <JsonLd
        data={graph(
          {
            "@type": "CollectionPage",
            "@id": `${categoryUrl}#webpage`,
            url: categoryUrl,
            name: category.name,
            inLanguage: locale,
            image: publicMediaUrl(category.bannerUrl ? shopImageSrc(category.bannerUrl) : null),
            ...(feed.items.length
              ? {
                  mainEntity: {
                    "@type": "ItemList",
                    numberOfItems: feed.items.length,
                    itemListElement: feed.items.map((item, index) => ({
                      "@type": "ListItem",
                      position: index + 1,
                      url: absoluteUrl(locale, `/products/${encodeURIComponent(item.slug)}`),
                      name: item.name,
                    })),
                  },
                }
              : {}),
          },
          breadcrumbList([
            { name: brand, url: absoluteUrl(locale) },
            { name: t("title"), url: absoluteUrl(locale, "/shop") },
            ...(parent ? [{ name: parent.name, url: absoluteUrl(locale, `/shop/${encodeURIComponent(parent.slug)}`) }] : []),
            { name: category.name, url: categoryUrl },
          ])
        )}
      />
      <ShopHeader back={parent ? `/shop/${parent.slug}` : "/shop"} />
      <ShopViewTracker categoryId={category.id} surface="category" />
      {category.bannerUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={shopImageSrc(category.bannerUrl)} alt={category.name} className="h-32 w-full object-cover" />
      ) : null}
      {children.length ? (
        <nav aria-label={t("subcategories")} className="flex gap-2 overflow-x-auto px-4 pt-4 pb-1 [scrollbar-width:none]">
          <span className="shrink-0 rounded-full bg-[#083f30] px-4 py-2 text-sm font-semibold text-white">{t("subcategoriesAll")}</span>
          {children.map((child) => (
            <Link
              key={child.id}
              href={`/shop/${child.slug}`}
              className="shrink-0 rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 transition hover:border-[#c9a55a] hover:text-[#083f30]"
            >
              {child.name}
            </Link>
          ))}
        </nav>
      ) : null}
      <Suspense fallback={null}>
        <ProductListViewClient
          locale={locale}
          basePath={`/shop/${slug}`}
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
