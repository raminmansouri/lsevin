import { queryOptions, useQuery, useQueryClient } from "@tanstack/react-query";

import { IProblem } from "@/types/error";

import { StaffDetails } from "../../types";
import { getStaffDetailsClient } from "./get-staff-details";

const STAFF_DETAILS_CACHE_TAG = "staff-details";

const queryStaffDetailsKey = (staffId: string) =>
  [STAFF_DETAILS_CACHE_TAG, staffId] as const;

export const useStaffDetails = (staffId: string) => {
  const options = queryOptions<StaffDetails, IProblem>({
    queryKey: queryStaffDetailsKey(staffId),
    queryFn: () => getStaffDetailsClient(staffId),
    enabled: !!staffId, // Only run when staffId is provided
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

export const useStaffDetailsCacheManagement = () => {
  const queryClient = useQueryClient();

  const invalidateAllCache = () => {
    queryClient.invalidateQueries({
      queryKey: [STAFF_DETAILS_CACHE_TAG],
    });
  };

  const invalidateStaffCache = (staffId: string) => {
    queryClient.invalidateQueries({
      queryKey: queryStaffDetailsKey(staffId),
    });
  };

  return {
    invalidateAllCache,
    invalidateStaffCache,
  };
};
