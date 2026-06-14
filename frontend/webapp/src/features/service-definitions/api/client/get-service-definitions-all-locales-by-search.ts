import {
  infiniteQueryOptions,
  useInfiniteQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { Locale } from "next-intl";

import { IProblem } from "@/types/error";
import { DEFAULT_PAGE_NUMBER } from "@/types/filter";
import { PaginatedResult } from "@/types/network";

import { searchServiceDefinitionsAllLocalesForClient } from "../../actions/search-service-definitions";
import {
  ServiceDefinitionOptionWithAllLocales,
  ServiceDefinitionWithAllLocales,
} from "../../types/service-definition";

export type { ServiceDefinitionOptionWithAllLocales };

export const getServiceDefinitionsAllLocalesBySearchClient = async (
  search: string,
  page: number,
  locale: Locale
) => searchServiceDefinitionsAllLocalesForClient(search, page || DEFAULT_PAGE_NUMBER, locale);

const SERVICE_DEFINITIONS_ALL_LOCALES_BY_SEARCH_CACHE_TAG =
  "service-definitions-all-locales-by-search";

const queryServiceDefinitionsAllLocalesBySearchKey = (search: string, locale: Locale) =>
  [SERVICE_DEFINITIONS_ALL_LOCALES_BY_SEARCH_CACHE_TAG, search, locale] as const;

export const useServiceDefinitionsAllLocalesBySearch = (search: string, locale: Locale) => {
  const options = infiniteQueryOptions<PaginatedResult<ServiceDefinitionWithAllLocales>, IProblem>({
    queryKey: queryServiceDefinitionsAllLocalesBySearchKey(search, locale),
    queryFn: ({ pageParam }) =>
      getServiceDefinitionsAllLocalesBySearchClient(search, pageParam as number, locale),
    initialPageParam: DEFAULT_PAGE_NUMBER,
    getNextPageParam: (lastPage, allPages) => {
      const currentPage = allPages.length;
      return currentPage < lastPage.totalPages ? currentPage + 1 : undefined;
    },
    enabled: true,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 60,
  });

  const query = useInfiniteQuery(options);
  const flatData: ServiceDefinitionOptionWithAllLocales[] =
    query.data?.pages.flatMap((page) =>
      page.items.map((serviceDefinition) => ({
        id: serviceDefinition.id,
        name: serviceDefinition.name,
        description: serviceDefinition.description,
        categoryName: serviceDefinition.categoryName,
        price: serviceDefinition.basePrice,
        currency: serviceDefinition.currency,
        durationMinutes: serviceDefinition.durationMinutes,
        isActive: serviceDefinition.isActive,
      }))
    ) ?? [];

  return { ...query, data: flatData, pages: query.data?.pages };
};

export const useServiceDefinitionsAllLocalesBySearchCacheManagement = () => {
  const queryClient = useQueryClient();
  const invalidateAllCache = () => {
    queryClient.invalidateQueries({ queryKey: [SERVICE_DEFINITIONS_ALL_LOCALES_BY_SEARCH_CACHE_TAG] });
  };
  return { invalidateAllCache };
};
