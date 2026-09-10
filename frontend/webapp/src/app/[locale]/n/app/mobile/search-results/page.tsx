import { Suspense } from "react";
import { setRequestLocale } from "next-intl/server";

import { SearchResultsView } from "./search-results-view";

// The whole view is `"use client"` and reads `?q=` via useSearchParams() with
// no Suspense boundary of its own — static prerender of that is a fatal
// `next build` error. This thin server wrapper reads no request data itself;
// `force-dynamic` keeps it out of the prerender (it only worked before because
// an ancestor was accidentally forcing the app dynamic), and the Suspense
// boundary satisfies the CSR-bailout check.
export const dynamic = "force-dynamic";

export default async function SearchResultsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <Suspense fallback={null}>
      <SearchResultsView />
    </Suspense>
  );
}
