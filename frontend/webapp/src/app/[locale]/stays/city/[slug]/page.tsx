import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { contentLocaleFor, directionOf } from "@/features/tours/domain/content";
import { currentActor } from "@/features/tours/server/platform/access";
import { LocalizedText } from "@/features/tours/ui/shared/localized-text";
import { parseStaySearch } from "@/features/stays/domain/search";
import { getCity, listAmenities, listCities, searchProperties, wishlistIds } from "@/features/stays/server/catalog";
import { logUnexpected } from "@/features/stays/server/errors";
import { citySchema, STAY_INDEXABLE_LOCALES } from "@/features/stays/server/seo";
import { ExploreView } from "@/features/stays/ui/explore/explore-view";
import { PageFaq } from "@/features/site-content/components/faq-section";
import { Link } from "@/i18n/navigation";
import { JsonLd } from "@/lib/seo/json-ld";
import { buildPublicMetadata } from "@/lib/seo/metadata";

type Props = {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const city = await getCity(slug, contentLocaleFor(locale)).catch(() => null);
  if (!city) return { robots: { index: false, follow: true } };
  const t = await getTranslations({ locale, namespace: "StayApp.meta" });
  const meta = await buildPublicMetadata({
    locale,
    path: `/stays/city/${slug}`,
    title: t("cityTitle", { city: city.name }),
    descriptions: [city.intro?.value, t("cityDescription", { city: city.name, count: city.propertyCount })],
    image: city.coverUrl,
    eligibleLocales: STAY_INDEXABLE_LOCALES,
  });
  // A city with no stays yet, or a dated/filtered variant of it, is not a separate indexable page.
  const filtered = Object.keys(await searchParams).length > 0;
  return city.propertyCount === 0 || filtered ? { ...meta, robots: { index: false, follow: true } } : meta;
}

/** SEO landing page per destination ("hotels in Shiraz"): all its stays, intro text and a schema.org ItemList. */
export default async function StaysCityPage({ params, searchParams }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const content = contentLocaleFor(locale);
  const city = await getCity(slug, content);
  if (!city) notFound();
  const search = { ...parseStaySearch(await searchParams), city: slug };
  const t = await getTranslations({ locale, namespace: "StayApp" });
  const actor = await currentActor();
  const [cities, amenities, saved, result] = await Promise.all([
    listCities(content).catch(() => []),
    listAmenities(content).catch(() => []),
    actor.userId ? wishlistIds(actor.userId).catch(() => [] as string[]) : Promise.resolve([] as string[]),
    searchProperties(search, content).catch((e) => {
      logUnexpected("stays.city", e);
      return null;
    }),
  ]);
  const title = t("meta.cityTitle", { city: city.name });
  return (
    <>
      {result ? <JsonLd data={citySchema(city, result.items, locale, { stays: t("nav.stays"), title, home: (await getTranslations({ locale, namespace: "LocaleLayout" }))("title") })} /> : null}
      <nav aria-label={t("nav.breadcrumb")} className="px-4 pt-3 text-xs text-slate-500 sm:px-6" data-testid="stays-city-breadcrumbs">
        <ol className="flex items-center gap-1">
          <li>
            <Link href="/stays" className="hover:underline">
              {t("nav.stays")}
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page">{city.name}</li>
        </ol>
      </nav>
      <ExploreView
        search={search}
        result={result}
        cities={cities.map((c) => ({ slug: c.slug, name: c.name, region: c.region }))}
        amenities={amenities}
        savedIds={saved}
        heading={title}
        basePath={`/stays/city/${slug}`}
        lockedCity={slug}
      />
      {city.intro ? (
        <section className="mx-auto max-w-3xl px-4 pt-8" data-testid="stays-city-intro">
          <LocalizedText text={{ ...city.intro, dir: directionOf(city.intro.locale) }} className="text-sm leading-7 text-slate-700" />
        </section>
      ) : null}
      {city.coverCredit ? <p className="mx-auto max-w-3xl px-4 pt-2 text-[11px] text-slate-400">{city.coverCredit}</p> : null}
      {cities.length > 1 ? (
        <section className="mx-auto max-w-3xl px-4 pt-8" aria-labelledby="stays-other-cities">
          <h2 id="stays-other-cities" className="text-lg font-bold">
            {t("home.allCities")}
          </h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {cities
              .filter((c) => c.slug !== slug)
              .map((c) => (
                <li key={c.slug}>
                  <Link href={`/stays/city/${c.slug}`} className="inline-flex min-h-11 items-center rounded-full bg-white px-4 text-sm ring-1 ring-slate-200 hover:bg-emerald-50">
                    {t("meta.cityTitle", { city: c.name })}
                  </Link>
                </li>
              ))}
          </ul>
        </section>
      ) : null}
      <PageFaq target={{ scope: "app", entityKey: "stays" }} locale={locale} />
    </>
  );
}
