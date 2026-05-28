import { Suspense } from "react";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { SearchParams } from "nuqs/server";

import ServerFetchResult from "@/components/fetcher/fetch.server";
import LocaleBoundary from "@/components/locale/locale-boundary";
import { Skeleton } from "@/components/ui/skeleton";
import { withBaseHeaders } from "@/config/http/http-service.server";
import { ProviderTypeLayout } from "@/features/home/components/by-type/provider-type-layout";
import { byTypeSearchParamsCache } from "@/features/home/types";
import { BY_TYPE_TRANSLATION_KEY } from "@/features/home/types/constants";
import { getProviderTypeAttributes } from "@/features/provider-types/api/server/get-provider-type-attributes";
import type { ProviderTypeAttributesResponse } from "@/features/provider-types/types/provider-type";
import { getAvailableCitiesByCountry } from "@/features/service-providers/api/server/get-available-cities-by-country";
import { getAvailableCountries } from "@/features/service-providers/api/server/get-available-countries";
import type { AvailableCountry } from "@/features/service-providers/types";
import { PageProps } from "@/types/next";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations(BY_TYPE_TRANSLATION_KEY);

  return {
    title: t("title"),
    description: t("description"),
    keywords: t("title"),
    openGraph: {
      title: t("title"),
      description: t("description"),
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: t("title"),
      description: t("description"),
    },
  };
}

const ProviderTypeDetailsPage = async ({ params, searchParams }: PageProps) => {
  return (
    <div className="container">
      <div className="flex flex-col items-center gap-4">
        <Suspense>
          <CountriesLocationSwitcher />
        </Suspense>
        <Suspense>
          <CitiesLocationSwitcher searchParams={searchParams} />
        </Suspense>
      </div>
      <Suspense fallback={<ProviderTypeLayoutSkeleton />}>
        <ProviderTypeContentBoundary
          params={params}
          searchParams={searchParams}
        />
      </Suspense>
    </div>
  );
};

const CountriesLocationSwitcher = async () => {
  await withBaseHeaders((locale, token) =>
    getAvailableCountries({ locale, token })
  );

  return null;
  // (
  //   <ServerFetchResult<AvailableCountry[]> result={countriesResult}>
  //     {(countries) => (
  //       <LocationSwitcher type="country" className="w-full" items={countries} />
  //     )}
  //   </ServerFetchResult>
  // );
};

const CitiesLocationSwitcher = async ({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) => {
  const searchParamsData = await searchParams;
  const { countryCode } = byTypeSearchParamsCache.parse(searchParamsData);

  if (!countryCode) {
    return null;
  }

  await withBaseHeaders((locale, token) =>
    getAvailableCitiesByCountry({ locale, token }, countryCode)
  );

  return null;
  // (
  //   <ServerFetchResult<IAvailableCity[]> result={citiesResult}>
  //     {(cities) => (
  //       <LocationSwitcher type="city" items={cities} className="w-full" />
  //     )}
  //   </ServerFetchResult>
  // );
};

const ProviderTypeContentBoundary = async ({ params }: PageProps) => {
  const { id: providerTypeId } = await params;

  const countriesResult = await withBaseHeaders((localeHeader, token) =>
    getAvailableCountries({ locale: localeHeader, token })
  );

  return (
    <ServerFetchResult<AvailableCountry[]> result={countriesResult}>
      {(countries) => (
        <Suspense fallback={<ProviderTypeLayoutSkeleton />}>
          <AttributesSuspenseBoundary
            providerTypeId={providerTypeId}
            countries={countries}
            params={params}
          />
        </Suspense>
      )}
    </ServerFetchResult>
  );
};

const AttributesSuspenseBoundary = async ({
  providerTypeId,
  countries,
  params,
}: {
  providerTypeId: string;
  countries: AvailableCountry[];
  params: Promise<{ locale: string; id: string }>;
}) => {
  const attributesResult = await withBaseHeaders((localeHeader, token) =>
    getProviderTypeAttributes({ locale: localeHeader, token }, providerTypeId)
  );

  return (
    <ServerFetchResult<ProviderTypeAttributesResponse>
      result={attributesResult}
    >
      {(data) => (
        <LocaleBoundary
          params={params}
          tanslationNameSpace={BY_TYPE_TRANSLATION_KEY}
        >
          {() => (
            <ProviderTypeLayout
              providerTypeId={data.providerTypeId}
              providerTypeName={data.providerTypeName}
              countries={countries}
              attributes={data.attributes}
            />
          )}
        </LocaleBoundary>
      )}
    </ServerFetchResult>
  );
};

const ProviderTypeLayoutSkeleton = () => {
  return (
    <div className="container">
      <Skeleton className="mb-6 h-10 w-64" />
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-64 w-full" />
        ))}
      </div>
    </div>
  );
};

export default ProviderTypeDetailsPage;
