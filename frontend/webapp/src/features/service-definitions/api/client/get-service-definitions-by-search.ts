import {
  infiniteQueryOptions,
  useInfiniteQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { Locale } from "next-intl";

import { IProblem } from "@/types/error";
import { DEFAULT_PAGE_NUMBER } from "@/types/filter";
import { PaginatedResult } from "@/types/network";

import { searchServiceDefinitionsForClient } from "../../actions/search-service-definitions";
import { ServiceDefinition } from "../../types/service-definition";

export interface ServiceDefinitionOption {
  id: string;
  name: string;
  description?: string;
  categoryName?: string;
  price?: number;
  currency?: string;
  durationMinutes?: number;
  isActive?: boolean;
}

export const getServiceDefinitionsBySearchClient = async (
  search: string,
  page: number,
  locale: Locale
) => searchServiceDefinitionsForClient(search, page || DEFAULT_PAGE_NUMBER, locale);

const SERVICE_DEFINITIONS_BY_SEARCH_CACHE_TAG = "service-definitions-by-search";
const queryServiceDefinitionsBySearchKey = (search: string, locale: Locale) =>
  [SERVICE_DEFINITIONS_BY_SEARCH_CACHE_TAG, search, locale] as const;

export const useServiceDefinitionsBySearch = (search: string, locale: Locale) => {
  const options = infiniteQueryOptions<PaginatedResult<ServiceDefinition>, IProblem>({
    queryKey: queryServiceDefinitionsBySearchKey(search, locale),
    queryFn: ({ pageParam }) =>
      getServiceDefinitionsBySearchClient(search, pageParam as number, locale),
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
  const flatData: ServiceDefinitionOption[] =
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

export const useServiceDefinitionsBySearchCacheManagement = () => {
  const queryClient = useQueryClient();
  const invalidateAllCache = () => {
    queryClient.invalidateQueries({ queryKey: [SERVICE_DEFINITIONS_BY_SEARCH_CACHE_TAG] });
  };
  return { invalidateAllCache };
};
