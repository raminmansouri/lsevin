import { notFound, permanentRedirect, redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import {
  categoryBrowserHref,
  categoryProvidersHref,
  isTourismCategory,
  TOURS_HOME_PATH,
} from "@/features/categories/utils/category-href";
import { buildPublicMetadata } from "@/lib/seo/metadata";
import { INDEXABLE_CATEGORY_LOCALES } from "@/lib/seo/locale-eligibility";
import { resolvePublicEntity } from "@/lib/seo/public-slugs";

import { CategoryBrowserScreen, loadCategoryBrowser } from "../category-browser-screen";

// One category's subcategories: /fa/categories/accommodation. A category with no
// subcategories has nothing to browse, so it goes on to its providers.
export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ locale: string; slug: string }> };

async function load(locale: string, slug: string) {
  const ref = await resolvePublicEntity("category", slug);
  if (!ref) notFound();
  const { data, tourismCategoryId } = await loadCategoryBrowser(locale);
  const all = data.groups.flatMap((group) => group.categories);
  const category = all.find((item) => item.id === ref.id) ?? null;
  return { ref, data, tourismCategoryId, category, all };
}

export async function generateMetadata({ params }: PageProps) {
  const { locale, slug } = await params;
  const { ref, category } = await load(locale, slug);
  const t = await getTranslations({ locale, namespace: "CategoryBrowser" });
  const brand = (await getTranslations({ locale, namespace: "LocaleLayout" }))("title");
  return buildPublicMetadata({
    locale,
    path: categoryBrowserHref(ref),
    title: `${category?.name || t("allCategories")} | ${brand}`,
    descriptions: [category?.description, t("cantFindDescription")],
    eligibleLocales: INDEXABLE_CATEGORY_LOCALES,
  });
}

export default async function CategoryPage({ params }: PageProps) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const { ref, data, tourismCategoryId, category, all } = await load(locale, slug);
  if (!category) notFound();
  // An id or a previous slug moves to the current slug.
  if (ref.slug && slug !== ref.slug) permanentRedirect(`/${locale}${categoryBrowserHref(ref)}`);
  // Tourism has no category screen of its own: the Tours app is its home (C-001).
  if (isTourismCategory(ref.id, (id) => all.find((item) => item.id === id)?.parentId, tourismCategoryId)) {
    redirect(`/${locale}${TOURS_HOME_PATH}`);
  }
  // Not permanent: the category may get subcategories later.
  if (category && category.childCount === 0) redirect(`/${locale}${categoryProvidersHref(ref)}`);

  return <CategoryBrowserScreen locale={locale} data={data} tourismCategoryId={tourismCategoryId} parent={category} />;
}
