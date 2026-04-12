


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

import { GetBookingSpecialistByProviderAndServiceResponse } from "@/features/service-providers/types";

export const getSpecialistByProviderAndServiceClient = async (
  search: string,
  page: number,
  locale: Locale
) => {
  const searchParams = new URLSearchParams();
  if (search) {
    searchParams.set("Search", search);
  }
  searchParams.set("PageNumber", (page || DEFAULT_PAGE_NUMBER).toString());
  searchParams.set("PageSize", DEFAULT_PAGE_SIZE.toString());
  searchParams.set("Locale", locale);

  return await readData<GetBookingSpecialistByProviderAndServiceResponse>(
    `/booking/getSpecialistByProviderAndService?${searchParams.toString()}`
  );
};

const tag = "booking-getBookingSpecialistByProviderAndServiceResponse";
const queryServicesBySearchKey = (search: string, locale: Locale) =>
  [tag, search, locale] as const;

export const useGetSpecialistByProviderAndService = (
   serviceId,
        specialistId,
  search: string, locale: Locale) => {
  const options = queryOptions<GetBookingSpecialistByProviderAndServiceResponse, IProblem>({
    queryKey: queryServicesBySearchKey(search, locale),
    queryFn: ({ pageParam }) =>
      getSpecialistByProviderAndServiceClient(search, pageParam as number, locale),
    enabled: serviceId || specialistId,
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
