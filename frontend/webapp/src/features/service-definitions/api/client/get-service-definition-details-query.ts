import { queryOptions, useQuery, useQueryClient } from "@tanstack/react-query";
import { Locale } from "next-intl";

import { IProblem } from "@/types/error";

import { getServiceDefinitionDetailsForClient } from "../../actions/get-service-definition-details";
import { ServiceDefinitionDetails } from "../../types/service-definition";

export const getServiceDefinitionDetailsClient = async (
  serviceDefinitionId: string,
  locale: Locale
) => getServiceDefinitionDetailsForClient(serviceDefinitionId, locale);

const SERVICE_DEFINITION_DETAILS_CACHE_TAG = "service-definition-details";
const queryServiceDefinitionDetailsKey = (serviceDefinitionId: string, locale: Locale) =>
  [SERVICE_DEFINITION_DETAILS_CACHE_TAG, serviceDefinitionId, locale] as const;

export const useServiceDefinitionDetails = (serviceDefinitionId: string, locale: Locale) => {
  const options = queryOptions<ServiceDefinitionDetails, IProblem>({
    queryKey: queryServiceDefinitionDetailsKey(serviceDefinitionId, locale),
    queryFn: () => getServiceDefinitionDetailsClient(serviceDefinitionId, locale),
    enabled: !!serviceDefinitionId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const { data, error, isFetching, refetch } = useQuery(options);
  return { data, error, isFetching, refetch };
};

export const useServiceDefinitionDetailsCacheManagement = () => {
  const queryClient = useQueryClient();

  const invalidateAllCache = () => {
    queryClient.invalidateQueries({ queryKey: [SERVICE_DEFINITION_DETAILS_CACHE_TAG] });
  };

  const invalidateServiceDefinitionCache = (serviceDefinitionId: string) => {
    queryClient.invalidateQueries({
      queryKey: [SERVICE_DEFINITION_DETAILS_CACHE_TAG, serviceDefinitionId],
    });
  };

  return { invalidateAllCache, invalidateServiceDefinitionCache };
};
