import { PageProps } from "@/types/next";
import { homeSearchParamsCache } from "@/features/home/types";
import { withBaseHeaders } from "@/config/http/http-service.server";
import { getPublicServiceProviders } from "@/features/service-providers/api/server/get-public-service-providers";
import LocaleBoundary from "@/components/locale/locale-boundary";
import { TRANSLATION_KEY } from "@/features/consulting/types/constants";
import ServerFetchResult from "@/components/fetcher/fetch.server";
import { IServiceProvidersGroupedResponse } from "@/features/service-providers/types";
import { HomeServiceProvidersCategories } from "./service-providers-category-section";

export const ServiceProvidersCategoriesSuspenseBoundary = async ({
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
              <>
                <HomeServiceProvidersCategories
                  serviceProvidersGroups={serviceProvidersData.slice(0,6)}
                  t={t}
                />
              </>
            )}
          </ServerFetchResult>
        </>
      )}
    </LocaleBoundary>
  );
};
