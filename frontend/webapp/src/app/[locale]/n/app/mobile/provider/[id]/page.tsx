import { setRequestLocale } from "next-intl/server";

import { getUserId } from "@/lib/auth/session";
import { getProviderPageDataFromDbCached } from "@/features/service-providers/server/provider-page.repository.cached";

import { ProviderDetailView } from "./provider-detail-view";

type RouteParams = { locale: string; id: string };
type SearchParams = { currency?: string; country?: string; browserCountry?: string };
type PageProps = {
  params: Promise<RouteParams> | RouteParams;
  searchParams?: Promise<SearchParams> | SearchParams;
};

async function getOptionalUserId() {
  try {
    return (await getUserId()) || null;
  } catch {
    return null;
  }
}

/**
 * Server shell for the provider profile. Fetches the page data through the
 * cached repository wrapper and hands it to the interactive client view as
 * `initialData`, so the first paint is server-rendered HTML instead of a
 * skeleton that waits on a client-side action round-trip.
 */
export default async function ProviderDetailPage({ params, searchParams }: PageProps) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const sp = searchParams ? await searchParams : {};
  const userId = await getOptionalUserId();

  const result = await getProviderPageDataFromDbCached({
    providerId: id,
    locale,
    userId,
    targetCurrencyCode: sp.currency ?? null,
    selectedCountryCode: sp.country ?? null,
    browserCountryCode: sp.browserCountry ?? null,
  });

  return <ProviderDetailView initialData={result?.data ?? undefined} />;
}
