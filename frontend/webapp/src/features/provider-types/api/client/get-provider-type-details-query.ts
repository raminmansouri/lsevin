
import { queryOptions, useQuery, useQueryClient } from "@tanstack/react-query";

import { IProblem } from "@/types/error";

import { ProviderType } from "../../types/provider-type";

export const getProviderTypeDetailsClient = async (
  providerTypeId: string
): Promise<ProviderType> => {
  const response = await fetch(`/api/admin/provider-types/${providerTypeId}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw (await response.json()) as IProblem;
  }

  return (await response.json()) as ProviderType;
};

const PROVIDER_TYPE_DETAILS_CACHE_TAG = "provider-type-details";
const queryProviderTypeDetailsKey = (providerTypeId: string) =>
  [PROVIDER_TYPE_DETAILS_CACHE_TAG, providerTypeId] as const;

export const useProviderTypeDetails = (providerTypeId: string) => {
  const options = queryOptions<ProviderType, IProblem>({
    queryKey: queryProviderTypeDetailsKey(providerTypeId),
    queryFn: () => getProviderTypeDetailsClient(providerTypeId),
    enabled: !!providerTypeId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const { data, error, isFetching, refetch } = useQuery(options);
  return { data, error, isFetching, refetch };
};

export const useProviderTypeDetailsCacheManagement = () => {
  const queryClient = useQueryClient();

  const invalidateAllCache = () => {
    queryClient.invalidateQueries({ queryKey: [PROVIDER_TYPE_DETAILS_CACHE_TAG] });
  };

  const invalidateProviderTypeCache = (providerTypeId: string) => {
    queryClient.invalidateQueries({ queryKey: queryProviderTypeDetailsKey(providerTypeId) });
  };

  return { invalidateAllCache, invalidateProviderTypeCache };
};
