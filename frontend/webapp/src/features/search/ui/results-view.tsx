import Link from "next/link";

import { responsiveImg } from "@/lib/media/responsive-img";

import type { DocType, SearchResponse, SearchResult } from "../types";
import { DOC_TYPES } from "../types";
import { SearchBox } from "./search-box";
import { isRtl, stringsFor } from "./strings";

type Props = {
  locale: string;
  query: string;
  type: DocType | "all";
  response: SearchResponse | null;
  failed?: boolean;
};

function Card({ result, locale }: { result: SearchResult; locale: string }) {
  const strings = stringsFor(locale);
  const image = responsiveImg(result.image, "(min-width: 768px) 160px, 96px");
  const price = result.priceToman ? `${result.priceToman.toLocaleString(locale === "fa" ? "fa-IR" : "en-US")} ${strings.toman}` : null;
  return (
    <li>
      <Link
        href={result.href}
        className="flex gap-4 rounded-2xl border border-neutral-200 bg-white p-3 transition hover:border-teal-600 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-700"
        data-testid="search-result"
        data-doc-type={result.type}
      >
        <div className="h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-neutral-100 md:h-28 md:w-40">
          {image.src ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={image.src} srcSet={image.srcSet} sizes={image.sizes} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
          ) : null}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs text-teal-700">{strings.types[result.type]}</p>
          <h2 className="truncate text-base font-semibold">{result.title}</h2>
          {result.subtitle ? <p className="truncate text-sm text-neutral-600">{result.subtitle}</p> : null}
          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-neutral-600">
            {result.rating ? (
              <span>
                ★ {result.rating.toFixed(1)}
                {result.reviewCount ? ` · ${strings.reviews(result.reviewCount)}` : ""}
              </span>
            ) : null}
            {price ? <span>{price}</span> : null}
            {result.distanceKm !== null ? <span>{strings.distance(result.distanceKm)}</span> : null}
          </p>
        </div>
      </Link>
    </li>
  );
}

export function SearchResultsView({ locale, query, type, response, failed }: Props) {
  const strings = stringsFor(locale);
  const dir = isRtl(locale) ? "rtl" : "ltr";
  const confident = response?.results.filter((result) => result.confident) ?? [];
  const alternatives = response?.results.filter((result) => !result.confident) ?? [];

  return (
    <main dir={dir} className="mx-auto w-full max-w-3xl px-4 py-6" data-testid="search-page">
      <h1 className="mb-4 text-xl font-bold">{strings.title}</h1>
      <SearchBox locale={locale} initialQuery={query} type={type} />

      <nav aria-label={strings.title} className="mt-4 flex flex-wrap gap-2">
        {(["all", ...DOC_TYPES] as const).map((value) => {
          const params = new URLSearchParams({ q: query });
          if (value !== "all") params.set("type", value);
          const selected = value === type;
          return (
            <Link
              key={value}
              href={`/${locale}/search?${params.toString()}`}
              aria-current={selected ? "page" : undefined}
              className={`rounded-full border px-3 py-1 text-sm ${selected ? "border-teal-700 bg-teal-700 text-white" : "border-neutral-300 bg-white"}`}
            >
              {value === "all" ? strings.all : strings.types[value]}
            </Link>
          );
        })}
      </nav>

      <section aria-live="polite" className="mt-6">
        {!query ? (
          <p className="text-neutral-600">{strings.intro}</p>
        ) : failed ? (
          <div role="alert" className="rounded-2xl border border-amber-300 bg-amber-50 p-4">
            <p className="font-medium">{strings.unavailable}</p>
            <p className="text-sm text-neutral-700">{strings.tryAgain}</p>
          </div>
        ) : response ? (
          <>
            <p className="mb-3 text-sm text-neutral-600" data-testid="search-summary">
              {strings.resultsFor(confident.length, query)}
              {response.place?.kind === "neighborhood" ? ` · ${strings.nearPlace(response.place.name)}` : ""}
            </p>
            {confident.length ? (
              <ul className="grid gap-3" data-testid="search-confident">
                {confident.map((result) => (
                  <Card key={`${result.type}:${result.id}`} result={result} locale={locale} />
                ))}
              </ul>
            ) : (
              <div className="rounded-2xl border border-neutral-200 bg-white p-6 text-center" data-testid="search-empty">
                <p className="font-medium">{strings.empty}</p>
                <p className="text-sm text-neutral-600">{strings.emptyHint}</p>
              </div>
            )}
            {alternatives.length ? (
              <div className="mt-8" data-testid="search-alternatives">
                <h2 className="mb-1 font-semibold">{strings.closest}</h2>
                <p className="mb-3 text-sm text-neutral-600">{strings.noExact}</p>
                <ul className="grid gap-3">
                  {alternatives.map((result) => (
                    <Card key={`${result.type}:${result.id}`} result={result} locale={locale} />
                  ))}
                </ul>
              </div>
            ) : null}
          </>
        ) : null}
      </section>
    </main>
  );
}
