"use client";

import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";

import type { DestinationCard as DestinationData, TourCard as TourCardData } from "../../server/platform/catalog";
import { LocalizedText } from "../shared/localized-text";

import { TourImage } from "./common";
import { DestinationCard } from "./destination-card";
import { TourCard } from "./tour-card";

export function DestinationsGrid({ destinations }: { destinations: DestinationData[] }) {
  const t = useTranslations("TourApp.destinations");
  return (
    <div className="px-4 pt-4 sm:px-6">
      <h1 className="text-2xl font-bold text-slate-900">{t("title")}</h1>
      <p className="text-sm text-slate-500">{t("subtitle")}</p>
      {destinations.length === 0 ? (
        <p className="mt-8 rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-600">{t("empty")}</p>
      ) : (
        <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {destinations.map((d) => (
            <li key={d.id}>
              <DestinationCard destination={d} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function DestinationDetail({
  destination,
  tours,
  total,
  savedIds,
}: {
  destination: DestinationData;
  tours: TourCardData[];
  total: number;
  savedIds: string[];
}) {
  const t = useTranslations("TourApp");
  const saved = new Set(savedIds);
  const name = destination.name?.value ?? destination.slug;
  return (
    <div className="pb-6">
      <section className="relative h-56 overflow-hidden sm:mx-6 sm:mt-4 sm:rounded-3xl">
        <TourImage src={destination.coverUrl} alt={destination.coverAlt ?? name} className="absolute inset-0 h-full w-full" eager />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-4 text-white sm:p-6">
          <h1 className="text-3xl font-extrabold">
            <LocalizedText text={destination.name} badge={false} />
          </h1>
          {destination.region ? <LocalizedText text={destination.region} as="p" className="text-sm text-white/85" badge={false} /> : null}
        </div>
      </section>
      <div className="px-4 pt-4 sm:px-6">
        {destination.description ? <LocalizedText text={destination.description} as="p" className="text-sm leading-7 text-slate-700" /> : null}
        <div className="mt-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">{t("destinations.toursIn", { name })}</h2>
          <Link href={`/tours/explore?destination=${destination.slug}`} className="min-h-11 content-center text-sm font-medium text-emerald-700">
            {t("explore.results", { count: total })}
          </Link>
        </div>
        {tours.length === 0 ? (
          <p className="mt-4 rounded-2xl bg-white p-6 text-center text-sm text-slate-600">{t("destinations.noTours")}</p>
        ) : (
          <ul className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {tours.map((c) => (
              <li key={c.id}>
                <TourCard card={c} saved={saved.has(c.id)} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
