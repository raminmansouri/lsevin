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

    const categories = await getShopCategoriesCached(locale).catch(() => []);
    const category = categories.find((c) => c.slug === slug);

    if (!category) {
        return {
            title: "Category",
            alternates: alternatesFor(
                locale,
                `/n/app/mobile/shop/category/${slug}`
            ),
        };
    }

    // English default
    let title = `${category.name} | LSevin`;

    let description =
        `Browse ${category.name} products on LSevin. ` +
        `Find quality products, compare options and shop online.`;

    switch (locale) {
        case "fa":
            title = `${category.name} | خرید آنلاین | LSevin`;
            description =
                `${category.name} را در LSevin مشاهده کنید. ` +
                `محصولات، جزئیات، مقایسه و خرید آنلاین را بررسی کنید.`;
            break;

        case "ar":
            title = `${category.name} | تسوق عبر الإنترنت | LSevin`;
            description =
                `اكتشف منتجات ${category.name} على LSevin. ` +
                `قارن المنتجات واستعرض التفاصيل وتسوق بسهولة.`;
            break;

        case "tr":
            title = `${category.name} | Online Alışveriş | LSevin`;
            description =
                `${category.name} ürünlerini LSevin üzerinden keşfedin. ` +
                `Ürünleri karşılaştırın, detayları inceleyin ve kolayca alışveriş yapın.`;
            break;

        case "ru":
            title = `${category.name} | Онлайн-покупки | LSevin`;
            description =
                `Изучите товары категории ${category.name} на LSevin. ` +
                `Сравнивайте товары, смотрите детали и совершайте покупки онлайн.`;
            break;

        case "en":
        default:
            // English fallback is already set above
            break;
    }

    description = description.slice(0, 300);

    return {
        title,
        description,
        alternates: alternatesFor(
            locale,
            `/n/app/mobile/shop/category/${slug}`
        ),
        openGraph: {
            title,
            description,
            type: "website",
            images: category.imageUrl
                ? [{ url: category.imageUrl }]
                : undefined,
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
