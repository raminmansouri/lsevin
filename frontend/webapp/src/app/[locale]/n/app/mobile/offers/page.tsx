import OffersClient from "./OffersClient";
import { getOffersPageData, parseOffersFilters } from "./offers.data";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function Page({ params, searchParams }: PageProps) {
  const [{ locale }, resolvedSearchParams] = await Promise.all([params, searchParams]);

  const filters = parseOffersFilters(resolvedSearchParams);
  const data = await getOffersPageData({ locale, filters });

  return <OffersClient {...data} filters={filters} />;
}
