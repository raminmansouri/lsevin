import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";

import { contentLocaleFor } from "@/features/tours/domain/content";
import { getTourWeather } from "@/features/tours/server/ops/weather";
import type { WeatherView } from "@/features/tours/server/ops/contract";
import { currentActor } from "@/features/tours/server/platform/access";
import { getTourDetail, listDepartures, searchTours, wishlistIds } from "@/features/tours/server/platform/catalog";
import { logUnexpected } from "@/features/tours/server/platform/errors";
import { TourDetailView } from "@/features/tours/ui/customer/detail/tour-detail-view";

type Props = { params: Promise<{ locale: string; slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const detail = await getTourDetail(slug, contentLocaleFor(locale)).catch(() => null);
  if (!detail) return {};
  return { title: detail.text.title?.value ?? slug, description: detail.text.summary?.value ?? undefined };
}

/** Tour details (C-032..C-054, AT-03, AT-04, AT-05). Published content only. */
export default async function TourDetailPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const content = contentLocaleFor(locale);
  const detail = await getTourDetail(slug, content);
  if (!detail) notFound();

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

  return (
    <TourDetailView
      detail={detail}
      departures={departures.slice(0, 60)}
      weather={weather}
      weatherDate={next?.localDate ?? null}
      related={related.items.filter((c) => c.id !== detail.id).slice(0, 6)}
      saved={saved.includes(detail.id)}
      savedIds={saved}
    />
  );
}
