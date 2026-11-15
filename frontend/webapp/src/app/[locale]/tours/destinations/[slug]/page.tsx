import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { contentLocaleFor } from "@/features/tours/domain/content";
import { currentActor } from "@/features/tours/server/platform/access";
import { listDestinations, parseTourSearch, searchTours, wishlistIds } from "@/features/tours/server/platform/catalog";
import { tourAlternates, tourCatalogLanguages } from "@/features/tours/server/platform/seo";
import { DestinationDetail } from "@/features/tours/ui/customer/destinations-grid";
import { absoluteUrl } from "@/lib/seo/alternates";
import { breadcrumbList, graph } from "@/lib/seo/entity-schema";
import { JsonLd } from "@/lib/seo/json-ld";
import { publicMediaUrl } from "@/lib/seo/media-url";
import { firstSeoPlainText } from "@/lib/seo/plain-text";

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  if (!/^[a-z0-9-]{1,80}$/.test(slug)) return {};
  const [destination] = await listDestinations(contentLocaleFor(locale), { slug, limit: 1 }).catch(() => []);
  if (!destination) return {};
  const t = await getTranslations({ locale, namespace: "TourApp.nav" });
  const name = destination.name?.value ?? slug;
  const image = publicMediaUrl(destination.coverUrl);
  return {
    title: `${name} · ${t("brand")}`,
    description: firstSeoPlainText([destination.description?.value], 300) || undefined,
    ...(image ? { openGraph: { title: name, images: [{ url: image }] } } : {}),
    ...tourAlternates(locale, `/tours/destinations/${slug}`, await tourCatalogLanguages().catch(() => [])),
  };
}

export default async function DestinationPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const content = contentLocaleFor(locale);
  const [destination] = /^[a-z0-9-]{1,80}$/.test(slug) ? await listDestinations(content, { slug, limit: 1 }) : [];
  if (!destination) notFound();
  const search = { ...parseTourSearch(await searchParams), destination: slug };
  const actor = await currentActor();
  const [results, saved] = await Promise.all([
    searchTours(search, content),
    actor.userId ? wishlistIds(actor.userId) : Promise.resolve([] as string[]),
  ]);
  const url = absoluteUrl(locale, `/tours/destinations/${destination.slug}`);
  const name = destination.name?.value ?? destination.slug;
  const [brand, toursLabel] = await Promise.all([
    getTranslations({ locale, namespace: "LocaleLayout" }).then((t) => t("title")),
    getTranslations({ locale, namespace: "TourApp.nav" }).then((t) => t("brand")).catch(() => "Tours"),
  ]);
  return (
    <>
      <JsonLd
        data={graph(
          {
            "@type": "CollectionPage",
            "@id": `${url}#webpage`,
            url,
            name,
            description: firstSeoPlainText([destination.description?.value], 300) || undefined,
            image: publicMediaUrl(destination.coverUrl),
            about: { "@type": "TouristDestination", name },
            // The tours the page lists, in its order.
            ...(results.items.length
              ? {
                  mainEntity: {
                    "@type": "ItemList",
                    numberOfItems: results.items.length,
                    itemListElement: results.items.slice(0, 30).map((tour, index) => ({
                      "@type": "ListItem",
                      position: index + 1,
                      url: absoluteUrl(locale, `/tours/t/${tour.slug}`),
                      name: tour.title?.value ?? tour.slug,
                    })),
                  },
                }
              : {}),
          },
          breadcrumbList([
            { name: brand, url: absoluteUrl(locale) },
            { name: toursLabel, url: absoluteUrl(locale, "/tours/intro") },
            { name, url },
          ])
        )}
      />
      <DestinationDetail destination={destination} tours={results.items} total={results.total} savedIds={saved} />
    </>
  );
}
