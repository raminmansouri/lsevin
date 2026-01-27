import { queryOptions, useQuery, useQueryClient } from "@tanstack/react-query";

import { readData } from "@/config/http/http-service.client";
import { IProblem } from "@/types/error";

import {
  convertProviderType,
  ProviderType,
  ProviderTypeResponse,
} from "../../types/provider-type";

export const getProviderTypeDetailsClient = async (
  providerTypeId: string
): Promise<ProviderType> => {
  const response = await readData<ProviderTypeResponse>(
    `/provider-types/${providerTypeId}/details`
  );
  return convertProviderType(response);
};

const PROVIDER_TYPE_DETAILS_CACHE_TAG = "provider-type-details";
const queryProviderTypeDetailsKey = (providerTypeId: string) =>
  [PROVIDER_TYPE_DETAILS_CACHE_TAG, providerTypeId] as const;

export const useProviderTypeDetails = (providerTypeId: string) => {
  const options = queryOptions<ProviderType, IProblem>({
    queryKey: queryProviderTypeDetailsKey(providerTypeId),
    queryFn: () => getProviderTypeDetailsClient(providerTypeId),
    enabled: !!providerTypeId, // Only run when providerTypeId is provided
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

export const useProviderTypeDetailsCacheManagement = () => {
  const queryClient = useQueryClient();

  const invalidateAllCache = () => {
    queryClient.invalidateQueries({
      queryKey: [PROVIDER_TYPE_DETAILS_CACHE_TAG],
    });
  };

  const invalidateProviderTypeCache = (providerTypeId: string) => {
    queryClient.invalidateQueries({
      queryKey: queryProviderTypeDetailsKey(providerTypeId),
    });
  };

  return {
    invalidateAllCache,
    invalidateProviderTypeCache,
  };
};
