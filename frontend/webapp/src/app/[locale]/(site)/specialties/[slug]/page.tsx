import { notFound, permanentRedirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { ExploreContent } from "@/app/[locale]/n/app/mobile/explore/explore-content";
import { getExplorePageData, parseExploreFilters } from "@/app/[locale]/n/app/mobile/explore/explore.data";
import { absoluteUrl } from "@/lib/seo/alternates";
import { breadcrumbList, graph } from "@/lib/seo/entity-schema";
import { JsonLd } from "@/lib/seo/json-ld";
import { INDEXABLE_CATEGORY_LOCALES } from "@/lib/seo/locale-eligibility";
import { buildPublicMetadata } from "@/lib/seo/metadata";
import { resolvePublicEntity } from "@/lib/seo/public-slugs";

// A provider type (hospital, clinic, gym, hotel...) as a landing page: the
// explore directory filtered to that type. The filter controls lead on to
// /explore with the chosen filters.
export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ locale: string; slug: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

async function load(locale: string, identifier: string, searchParams: Record<string, string | string[] | undefined> = {}) {
  const ref = await resolvePublicEntity("specialty", identifier);
  if (!ref) notFound();
  const filters = parseExploreFilters({ ...searchParams, providerTypeId: ref.id });
  const data = await getExplorePageData({ locale, filters });
  const type = data.providerTypes.find((item) => item.id === ref.id);
  return { ref, filters, data, type };
}

export async function generateMetadata({ params }: Pick<PageProps, "params">) {
  const { locale, slug } = await params;
  const { ref, type } = await load(locale, slug);
  const t = await getTranslations({ locale, namespace: "Explore" });
  const brand = (await getTranslations({ locale, namespace: "LocaleLayout" }))("title");
  return buildPublicMetadata({
    locale,
    path: `/specialties/${ref.slug ?? ref.id}`,
    title: `${type?.label || t("header.title")} | ${brand}`,
    descriptions: [type?.description, t("header.subtitle")],
    eligibleLocales: INDEXABLE_CATEGORY_LOCALES,
  });
}

export default async function SpecialtyPage({ params, searchParams }: PageProps) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const { ref, filters, data, type } = await load(locale, slug, await searchParams);
  if (ref.slug && slug !== ref.slug) permanentRedirect(`/${locale}/specialties/${ref.slug}`);

  const pageUrl = absoluteUrl(locale, `/specialties/${ref.slug ?? ref.id}`);
  const brand = (await getTranslations({ locale, namespace: "LocaleLayout" }))("title");
  const name = type?.label || (await getTranslations({ locale, namespace: "Explore" }))("header.title");

  return (
    <>
      <JsonLd
        data={graph(
          {
            "@type": "CollectionPage",
            "@id": `${pageUrl}#webpage`,
            url: pageUrl,
            name,
            ...(type?.description ? { description: type.description } : {}),
            inLanguage: locale,
          },
          breadcrumbList([
            { name: brand, url: absoluteUrl(locale, "/n/app/mobile/home") },
            { name, url: pageUrl },
          ])
        )}
      />
      <ExploreContent locale={locale} filters={filters} data={data} pageUrl={pageUrl} />
    </>
  );
}
