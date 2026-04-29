import {
  infiniteQueryOptions,
  queryOptions,
  useInfiniteQuery,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { Locale } from "next-intl";

import { CategoryOption } from "@/components/selectors/category-selector";
import { readData } from "@/config/http/http-service.client";
import { IProblem } from "@/types/error";
import { DEFAULT_PAGE_NUMBER, DEFAULT_PAGE_SIZE } from "@/types/filter";
import { PaginatedResult } from "@/types/network";

import { GetBookingGetServicesByProviderAndSpecialistResponse } from "@/features/service-providers/types";

export const getServicesByProviderAndSpecialistClient = async (
  providerId,
    serviceId,
    specialistId,
  locale: Locale
) => {
 const searchParams = new URLSearchParams();
  if (providerId) {
    searchParams.set("providerId", providerId);
  }
  if (serviceId) {
    searchParams.set("serviceId", serviceId);
  }
  if (specialistId) {
    searchParams.set("specialistId", specialistId);
  }

  searchParams.set("Locale", locale);

  return await readData<GetBookingGetServicesByProviderAndSpecialistResponse>(
    `/booking/getServicesByProviderAndSpecialist?${searchParams.toString()}`
  );
};

const tag = "booking-getServicesByProviderAndSpecialist";
const queryServicesBySearchKey = (search: string, locale: Locale) =>
  [tag, search, locale] as const;

export const useGetServicesByProviderAndSpecialist = (
   providerId,
    serviceId,
    specialistId,
        search: string, locale: Locale) => {
  const options = queryOptions<GetBookingGetServicesByProviderAndSpecialistResponse, IProblem>({
    queryKey: queryServicesBySearchKey(search, locale),
    queryFn: ({ pageParam }) =>
      getServicesByProviderAndSpecialistClient(  providerId,
    serviceId,
    specialistId,  locale),
    // enabled: providerId || specialistId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 60, // 1 hour
  });

  const {
    data,
    error,
    isFetching,
    refetch,
  } = useQuery(options);


  return {
    data,
    error,
    isFetching,
    refetch,
  };
};
