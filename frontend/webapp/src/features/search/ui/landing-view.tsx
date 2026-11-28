import Link from "next/link";

import { responsiveImg } from "@/lib/media/responsive-img";

import { landingCopy, type LandingFacts } from "../lib/landing-copy";
import type { LandingData } from "../server/landing";
import { pickText } from "../server/search";
import { isRtl } from "./strings";

type Props = { locale: string; data: LandingData; jsonLd: unknown[] };

/** Treatment-in-city page: real providers with prices, plus links to the neighbouring pages. */
export function LandingView({ locale, data, jsonLd }: Props) {
  const copy = landingCopy(locale);
  const facts: LandingFacts = {
    service: pickText(data.serviceNames, locale),
    city: pickText(data.cityNames, locale),
    providers: data.providers,
    minPriceToman: data.minPriceToman,
    maxPriceToman: data.maxPriceToman,
    avgRating: data.avgRating,
  };
  const numberLocale = locale === "fa" ? "fa-IR" : "en-US";
  const dir = isRtl(locale) ? "rtl" : "ltr";

  return (
    <main
      dir={dir}
      className="mx-auto w-full max-w-3xl px-4 py-6"
      data-testid="landing-page"
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <h1 className="text-2xl font-bold">{copy.h1(facts)}</h1>
      <p className="mt-2 text-neutral-700" data-testid="landing-intro">
        {copy.intro(facts)}
      </p>

      <h2 className="mt-6 mb-3 text-lg font-semibold">{copy.listHeading}</h2>
      <ul className="grid gap-3" data-testid="landing-offers">
        {data.offers.map((offer) => {
          const image = responsiveImg(
            offer.image,
            "(min-width: 768px) 160px, 96px"
          );
          return (
            <li key={offer.id}>
              <Link
                href={`/${locale}${offer.path}`}
                className="flex gap-4 rounded-2xl border border-neutral-200 bg-white p-3 hover:border-teal-600 hover:shadow-md"
              >
                <div className="h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-neutral-100 md:h-28 md:w-40">
                  {image.src ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={image.src}
                      srcSet={image.srcSet}
                      sizes={image.sizes}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover"
                    />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-base font-semibold">
                    {offer.provider || offer.title}
                  </h3>
                  <p className="truncate text-sm text-neutral-600">
                    {offer.title}
                  </p>
                  <p className="mt-1 flex flex-wrap gap-x-3 text-xs text-neutral-600">
                    {offer.rating ? (
                      <span>
                        ★ {offer.rating.toFixed(1)}
                        {offer.reviewCount
                          ? ` · ${copy.reviews(offer.reviewCount)}`
                          : ""}
                      </span>
                    ) : null}
                    {offer.priceToman ? (
                      <span>
                        {offer.priceToman.toLocaleString(numberLocale)}{" "}
                        {copy.toman}
                      </span>
                    ) : null}
                  </p>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>

      <p className="mt-6">
        <Link
          href={`/${locale}/search?q=${encodeURIComponent(`${facts.service} ${facts.city}`)}`}
          className="text-teal-700 underline"
        >
          {copy.searchCta}
        </Link>
      </p>

      {data.otherCities.length ? (
        <nav aria-label={copy.otherCities(facts.service)} className="mt-8">
          <h2 className="mb-2 font-semibold">
            {copy.otherCities(facts.service)}
          </h2>
          <ul className="flex flex-wrap gap-2">
            {data.otherCities.map((link) => (
              <li key={link.citySlug}>
                <Link
                  href={`/${locale}/find/${link.serviceSlug}/${link.citySlug}`}
                  className="rounded-full border border-neutral-300 bg-white px-3 py-1 text-sm"
                >
                  {link.cityName}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}

      {data.otherServices.length ? (
        <nav aria-label={copy.otherServices(facts.city)} className="mt-6">
          <h2 className="mb-2 font-semibold">
            {copy.otherServices(facts.city)}
          </h2>
          <ul className="flex flex-wrap gap-2">
            {data.otherServices.map((link) => (
              <li key={link.serviceSlug}>
                <Link
                  href={`/${locale}/find/${link.serviceSlug}/${link.citySlug}`}
                  className="rounded-full border border-neutral-300 bg-white px-3 py-1 text-sm"
                >
                  {link.serviceName}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}
    </main>
  );
}
