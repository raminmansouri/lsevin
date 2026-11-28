import { setRequestLocale } from "next-intl/server";

import { SearchResultsView } from "./search-results-view";
import { localeToHeader } from "@/config/locales";
import { getSearchResults } from "@/features/service-providers/server/search.repository";
import type { SearchResultsResponse } from "@/features/service-providers/types";
import type { LocaleTypes } from "@/types/common";
import { DEFAULT_PAGE_SIZE } from "@/types/filter";

// The view is a client component that reads `?q=` via useSearchParams();
// `force-dynamic` keeps the page out of the static prerender, where that would
// need a Suspense boundary (and render nothing on the server).
export const dynamic = "force-dynamic";

export default async function SearchResultsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ locale }, query] = await Promise.all([params, searchParams]);
  setRequestLocale(locale);

  // The first results are rendered on the server: the page used to paint a
  // skeleton and fetch them only after hydration, so the first result's photo
  // (the Largest Contentful Paint) came 7-12 s into a phone load (2026-11-28).
  // Same call and shape as /api/customer/search-results, which the client
  // keeps using for later terms; a failure just falls back to that.
  const term = (Array.isArray(query.q) ? query.q[0] : query.q)?.trim() ?? "";
  let initialData: SearchResultsResponse | undefined;
  if (term) {
    try {
      const localeHeader = localeToHeader(locale as LocaleTypes) || locale;
      const data = await getSearchResults({ term, locale: localeHeader, limit: DEFAULT_PAGE_SIZE });
      initialData = JSON.parse(JSON.stringify(data)) as SearchResultsResponse;
    } catch {
      initialData = undefined;
    }
  }

  // No Suspense boundary: the page is dynamic, so useSearchParams() needs none,
  // and a boundary here streamed the whole results list into a hidden block
  // that React revealed only after the page's scripts ran.
  return <SearchResultsView initialTerm={term} initialData={initialData} />;
}
