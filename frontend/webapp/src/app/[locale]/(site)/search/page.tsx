import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";

import { search } from "@/features/search/server/search";
import {
  DOC_TYPES,
  type DocType,
  type SearchResponse,
} from "@/features/search/types";
import { SearchResultsView } from "@/features/search/ui/results-view";
import { stringsFor } from "@/features/search/ui/strings";

// Search results are personal to the query and change with the catalogue: never cached, never indexed.
export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string | string[]; type?: string | string[] }>;
};

const first = (value?: string | string[]) =>
  (Array.isArray(value) ? value[0] : value) ?? "";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: stringsFor(locale).title,
    // Result pages are thin and endless; the content pages they link to are what Google should index.
    robots: { index: false, follow: true },
  };
}

export default async function SearchPage({ params, searchParams }: Props) {
  const [{ locale }, query] = await Promise.all([params, searchParams]);
  setRequestLocale(locale);

  const q = first(query.q).trim().slice(0, 160);
  const requestedType = first(query.type);
  const type: DocType | "all" = (DOC_TYPES as readonly string[]).includes(
    requestedType
  )
    ? (requestedType as DocType)
    : "all";

  let response: SearchResponse | null = null;
  let failed = false;
  if (q) {
    try {
      response = await search({ q, locale, type, limit: 20 });
    } catch (error) {
      // An infrastructure failure is shown as "unavailable", never as "nothing found".
      console.error("[search] page search failed:", (error as Error).message);
      failed = true;
    }
  }

  return (
    <SearchResultsView
      locale={locale}
      query={q}
      type={type}
      response={response}
      failed={failed}
    />
  );
}
