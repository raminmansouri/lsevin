import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { contentLocaleFor } from "@/features/tours/domain/content";
import { getTourWeather } from "@/features/tours/server/ops/weather";
import type { WeatherView } from "@/features/tours/server/ops/contract";
import { currentActor } from "@/features/tours/server/platform/access";
import { getTourDetail, listDepartures, searchTours, wishlistIds } from "@/features/tours/server/platform/catalog";
import { currentTourSlug, tourAlternates, tourLanguages } from "@/features/tours/server/platform/seo";
import { logUnexpected } from "@/features/tours/server/platform/errors";
import { TourDetailView } from "@/features/tours/ui/customer/detail/tour-detail-view";
import type { TourDetail } from "@/features/tours/server/platform/catalog";
import { absoluteUrl } from "@/lib/seo/alternates";
import { breadcrumbList, graph, imageObjects } from "@/lib/seo/entity-schema";
import { JsonLd } from "@/lib/seo/json-ld";
import { publicMediaUrl } from "@/lib/seo/media-url";
import { firstSeoPlainText } from "@/lib/seo/plain-text";

/**
 * A tour as schema.org TouristTrip (there is no Google rich result for trips;
 * it is for understanding) with its itinerary, the provider, the "from" price in
 * the currency the page charges, and photos credited to the provider. No
 * ratings: Google's review snippets do not cover trips.
 */
function tourJsonLd(detail: TourDetail, url: string) {
  const title = detail.text.title?.value ?? detail.slug;
  const providerName = detail.provider?.name?.value ?? null;
  const photos = detail.media.filter((m) => m.kind === "image").map((m) => m.url);
  const stops = detail.itinerary
    .slice()
    .sort((a, b) => a.day - b.day || a.position - b.position)
    .map((stop) => stop.title?.value)
    .filter((name): name is string => Boolean(name));
  return {
    "@type": "TouristTrip",
    "@id": `${url}#trip`,
    name: title,
    url,
    description: firstSeoPlainText([detail.text.summary?.value, detail.text.description?.value], 500) || undefined,
    image: imageObjects(photos, providerName),
    ...(detail.facts.categories.length ? { touristType: detail.facts.categories } : {}),
    ...(stops.length
      ? {
          itinerary: {
            "@type": "ItemList",
            numberOfItems: stops.length,
            itemListElement: stops.slice(0, 30).map((name, index) => ({
              "@type": "ListItem",
              position: index + 1,
              item: { "@type": "TouristAttraction", name },
            })),
          },
        }
      : {}),
    ...(providerName ? { provider: { "@type": "Organization", name: providerName } } : {}),
    ...(detail.fromPrice != null && detail.fromPrice > 0 && detail.facts.currency
      ? {
          offers: {
            "@type": "Offer",
            url,
            price: detail.fromPrice,
            priceCurrency: detail.facts.currency,
          },
        }
      : {}),
  };
}

type Props = { params: Promise<{ locale: string; slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const detail = await getTourDetail(slug, contentLocaleFor(locale)).catch(() => null);
  if (!detail) return {};
  const title = detail.text.title?.value ?? slug;
  const description = detail.text.summary?.value ?? undefined;
  // The tour's first photo as the preview image (search and link previews).
  const image = publicMediaUrl(detail.media.find((m) => m.kind === "image")?.url);
  return {
    title,
    description,
    ...tourAlternates(locale, `/tours/${detail.slug}`, await tourLanguages(detail.id)),
    ...(image ? { openGraph: { title, description, images: [{ url: image }] }, twitter: { card: "summary_large_image", images: [image] } } : {}),
  };
}

/** Tour details (C-032..C-054, AT-03, AT-04, AT-05). Published content only. */
export default async function TourDetailPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const content = contentLocaleFor(locale);
  const detail = await getTourDetail(slug, content);
  if (!detail) {
    // A renamed tour (migration 0111): one permanent redirect to its current URL.
    const current = await currentTourSlug(decodeURIComponent(slug));
    if (current) permanentRedirect(`/${locale}/tours/${current}`);
    notFound();
  }

  const actor = await currentActor();
  const [departures, related, saved] = await Promise.all([
    listDepartures(detail.id),
    searchTours(detail.destination ? { destination: detail.destination.slug, pageSize: 7, sort: "popularity" } : { provider: detail.serviceProviderId, pageSize: 7 }, content),
    actor.userId ? wishlistIds(actor.userId) : Promise.resolve([] as string[]),
  ]);
  const next = departures.find((d) => d.bookable) ?? null;
  const place = detail.location.meeting ?? (detail.destination?.latitude != null && detail.destination.longitude != null ? { lat: detail.destination.latitude, lng: detail.destination.longitude } : null);
  // Weather is a convenience: its failure must never break the tour page (AT-28).
  let weather: WeatherView = { status: "unavailable", reason: "no_location" };
  if (place) {
    weather = await getTourWeather({
      lat: place.lat, lng: place.lng, departureLocalIso: next?.localDate ?? null, timeZone: detail.facts.timezone,
      label: detail.destination?.name?.value ?? null,
    }).catch((e) => {
      logUnexpected("tourDetail.weather", e);
      return { status: "unavailable", reason: "provider_error" } as WeatherView;
    });
  }

  const url = absoluteUrl(locale, `/tours/${detail.slug}`);
  const [brand, toursLabel] = await Promise.all([
    getTranslations({ locale, namespace: "LocaleLayout" }).then((t) => t("title")),
    getTranslations({ locale, namespace: "TourApp.nav" }).then((t) => t("brand")).catch(() => "Tours"),
  ]);

  return (
    <>
    <JsonLd
      data={graph(
        tourJsonLd(detail, url),
        breadcrumbList([
          { name: brand, url: absoluteUrl(locale) },
          { name: toursLabel, url: absoluteUrl(locale, "/tours/intro") },
          ...(detail.destination?.slug && detail.destination.name?.value
            ? [{ name: detail.destination.name.value, url: absoluteUrl(locale, `/tours/destinations/${detail.destination.slug}`) }]
            : []),
          { name: detail.text.title?.value ?? detail.slug, url },
        ])
      )}
    />
    <TourDetailView
      detail={detail}
      departures={departures.slice(0, 60)}
      weather={weather}
      weatherDate={next?.localDate ?? null}
      related={related.items.filter((c) => c.id !== detail.id).slice(0, 6)}
      saved={saved.includes(detail.id)}
      savedIds={saved}
    />
    </>
  );
}
