import { Suspense } from "react";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { SearchParams } from "nuqs/server";

import ServerFetchResult from "@/components/fetcher/fetch.server";
import LocaleBoundary from "@/components/locale/locale-boundary";
import {
  LocationSwitcher,
  LocationSwitcherSkeleton,
} from "@/components/location-switcher";
import { withBaseHeaders } from "@/config/http/http-service.server";
import { ConsultingSection } from "@/features/home/components/consulting-section";
import { HeroSection } from "@/features/home/components/hero-section";
import ProviderTypesSection, {
  ProviderTypesSectionSkeleton,
} from "@/features/home/components/provider-types-section";
import HomeServiceProviders, {
  HomeServiceProvidersSkeleton,
} from "@/features/home/components/service-providers-section";
import UserInformationWarning from "@/features/home/components/user-information-alert";
import { homeSearchParamsCache } from "@/features/home/types";
import { TRANSLATION_KEY } from "@/features/home/types/constants";
import { getPublicProviderTypes } from "@/features/provider-types/api/server/get-public-provider-types";
import { PublicProviderType } from "@/features/provider-types/types/provider-type";
import { getAvailableCitiesByCountry } from "@/features/service-providers/api/server/get-available-cities-by-country";
import { getAvailableCountries } from "@/features/service-providers/api/server/get-available-countries";
import { getPublicServiceProviders } from "@/features/service-providers/api/server/get-public-service-providers";
import {
  IAvailableCity,
  IAvailableCountry,
  IServiceProvidersGroupedResponse,
} from "@/features/service-providers/types";
import { getCurrentUser } from "@/features/shared/api/server/get-current-user";
import { ICurrentUser } from "@/features/shared/types/user";
import { getUserRoles } from "@/lib/auth/session";
import { UserRole } from "@/types/common";
import { PageProps } from "@/types/next";
import { redirect } from "next/navigation";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations(TRANSLATION_KEY);

  return {
    title: t("title"),
    description: t("description"),
    keywords: t("keywords").split(","),
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

const HomePage = async ({ params, searchParams }: PageProps) => {
  redirect('/n/app/mobile/home')
  return (
    <div className="container flex flex-col gap-8">
      <HeroSection />
      <ConsultingSection />
      <Suspense>
        <UserSuspenseBoundary />
      </Suspense>
      <Suspense fallback={<ProviderTypesSectionSkeleton />}>
        <ProviderTypesSuspenseBoundary />
      </Suspense>
      <div className="flex flex-col items-center gap-4">
        <Suspense
          fallback={
            <LocationSwitcherSkeleton
              type="country"
              className="w-full"
              itemCount={6}
            />
          }
        >
          <CountriesSuspenseBoundary />
        </Suspense>
        <Suspense
          fallback={
            <LocationSwitcherSkeleton
              type="city"
              className="w-full"
              itemCount={4}
            />
          }
        >
          <CitiesSuspenseBoundary searchParams={searchParams} />
        </Suspense>
      </div>
      <Suspense fallback={<HomeServiceProvidersSkeleton />}>
        <ServiceProvidersSuspenseBoundary
          params={params}
          searchParams={searchParams}
        />
      </Suspense>
    </div>
  );
};

const ProviderTypesSuspenseBoundary = async () => {
  const providerTypesResult = await withBaseHeaders((locale, token) =>
    getPublicProviderTypes({ locale, token })
  );

  return (
    <ServerFetchResult<PublicProviderType[]> result={providerTypesResult}>
      {(providerTypes) => (
        <ProviderTypesSection showLabel={false} providerTypes={providerTypes} />
      )}
    </ServerFetchResult>
  );
};

const UserSuspenseBoundary = async () => {
  const roles = await getUserRoles();
  if (roles?.includes(UserRole.Admin)) {
    return;
  }

  const currentUser = await withBaseHeaders((locale, token) =>
    getCurrentUser({ locale, token })
  );

  return (
    <ServerFetchResult<ICurrentUser> result={currentUser}>
      {(user) => <UserInformationWarning {...user} />}
    </ServerFetchResult>
  );
};

const CountriesSuspenseBoundary = async () => {
  const countriesResult = await withBaseHeaders((locale, token) =>
    getAvailableCountries({ locale, token })
  );
  return (
    <ServerFetchResult<IAvailableCountry[]> result={countriesResult}>
      {(countries) => (
        <LocationSwitcher type="country" className="w-full" items={countries} />
      )}
    </ServerFetchResult>
  );
};

const CitiesSuspenseBoundary = async ({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) => {
  const searchParamsData = await searchParams;
  const { countryCode } = homeSearchParamsCache.parse(searchParamsData);
  if (!countryCode) {
    return null;
  }

  const citiesResult = await withBaseHeaders((locale, token) =>
    getAvailableCitiesByCountry({ locale, token }, countryCode)
  );
  return (
    <ServerFetchResult<IAvailableCity[]> result={citiesResult}>
      {(cities) => (
        <LocationSwitcher type="city" items={cities} className="w-full" />
      )}
    </ServerFetchResult>
  );
};

const ServiceProvidersSuspenseBoundary = async ({
  params,
  searchParams,
}: PageProps) => {
  const searchParamsData = await searchParams;
  const { countryCode, cityCode, slug } =
    homeSearchParamsCache.parse(searchParamsData);

  const serviceProviders = await withBaseHeaders((locale, token) =>
    getPublicServiceProviders(
      { locale, token },
      {
        filters: slug,
        countryCode,
        cityCode,
      }
    )
  );

  return (
    <LocaleBoundary params={params} tanslationNameSpace={TRANSLATION_KEY}>
      {(t) => (
        <>
          <ServerFetchResult<IServiceProvidersGroupedResponse>
            result={serviceProviders}
          >
            {(serviceProvidersData) => (
              <div>
                <HomeServiceProviders
                  serviceProvidersGroups={serviceProvidersData}
                  t={t}
                />
              </div>
            )}
          </ServerFetchResult>
        </>
      )}
    </LocaleBoundary>
  );
};

export default HomePage;
