import { permanentRedirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { categoryBrowserHref } from "@/features/categories/utils/category-href";
import { buildPublicMetadata } from "@/lib/seo/metadata";
import { INDEXABLE_CATEGORY_LOCALES } from "@/lib/seo/locale-eligibility";
import { resolvePublicEntity } from "@/lib/seo/public-slugs";

import { CategoryBrowserScreen, loadCategoryBrowser } from "./category-browser-screen";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "CategoryBrowser" });
  // Localized brand (السوین on Persian pages), not a hard-coded Latin name.
  const brand = (await getTranslations({ locale, namespace: "LocaleLayout" }))(
    "title"
  );
  return buildPublicMetadata({
    locale,
    path: "/categories",
    title: `${t("allCategories")} | ${brand}`,
    descriptions: [t("cantFindDescription")],
    eligibleLocales: INDEXABLE_CATEGORY_LOCALES,
  });
}

// Rendered per request; the tree itself comes from the `cp-category-groups`
// data cache (300 s), so this stays cheap. Not ISR: the image build has no
// database, so a prerendered copy is an empty tree that would be served as
// fresh for the whole revalidate window after every deploy.
export const dynamic = "force-dynamic";

export default async function CategoryBrowserPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  // The old ?parent=<uuid> deep link: each category has its own address now.
  const rawParent = (await searchParams)?.parent;
  const parentValue = (Array.isArray(rawParent) ? rawParent[0] : rawParent)?.trim();
  if (parentValue) {
    const ref = await resolvePublicEntity("category", parentValue.toLowerCase());
    permanentRedirect(ref ? `/${locale}${categoryBrowserHref(ref)}` : `/${locale}/categories`);
  }

  const { data, tourismCategoryId } = await loadCategoryBrowser(locale);
  return <CategoryBrowserScreen locale={locale} data={data} tourismCategoryId={tourismCategoryId} parent={null} />;
}
