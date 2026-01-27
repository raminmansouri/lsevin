import { queryOptions, useQuery, useQueryClient } from "@tanstack/react-query";

import { readData } from "@/config/http/http-service.client";
import { IProblem } from "@/types/error";

import { ServiceDefinitionDetails } from "../../types/service-definition";

export const getServiceDefinitionDetailsClient = async (
  serviceDefinitionId: string
) =>
  await readData<ServiceDefinitionDetails>(
    `/service-definitions/${serviceDefinitionId}/details`
  );

const SERVICE_DEFINITION_DETAILS_CACHE_TAG = "service-definition-details";
const queryServiceDefinitionDetailsKey = (serviceDefinitionId: string) =>
  [SERVICE_DEFINITION_DETAILS_CACHE_TAG, serviceDefinitionId] as const;

export const useServiceDefinitionDetails = (serviceDefinitionId: string) => {
  const options = queryOptions<ServiceDefinitionDetails, IProblem>({
    queryKey: queryServiceDefinitionDetailsKey(serviceDefinitionId),
    queryFn: () => getServiceDefinitionDetailsClient(serviceDefinitionId),
    enabled: !!serviceDefinitionId, // Only run when serviceDefinitionId is provided
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  const { data, error, isFetching, refetch } = useQuery(options);
  return {
    data,
    error,
    isFetching,
    refetch,
  };
};

export const useServiceDefinitionDetailsCacheManagement = () => {
  const queryClient = useQueryClient();

  const invalidateAllCache = () => {
    queryClient.invalidateQueries({
      queryKey: [SERVICE_DEFINITION_DETAILS_CACHE_TAG],
    });
  };

  const invalidateServiceDefinitionCache = (serviceDefinitionId: string) => {
    queryClient.invalidateQueries({
      queryKey: queryServiceDefinitionDetailsKey(serviceDefinitionId),
    });
  };

  return {
    invalidateAllCache,
    invalidateServiceDefinitionCache,
  };
};
