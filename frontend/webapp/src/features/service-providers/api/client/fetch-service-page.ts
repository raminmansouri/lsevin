import { useQuery } from "@tanstack/react-query";
import type { Locale } from "next-intl";

import { getServicePageAction } from "../../actions/service-page";
import type {
  GetServicePageByIdResponse,
  GetServicePageQueryKey,
} from "../../types/service-page.types";

export const getServicePageQueryKey = (
  serviceId: string,
  locale: string
): GetServicePageQueryKey => ["service-page", serviceId, locale];

export const fetchServicePageData = async (serviceId: string, locale: Locale | string) => {
  const data = await getServicePageAction({ serviceId, locale: String(locale) });

  if (!data) {
    throw new Error("Service was not found.");
  }

  return data;
};

export const useFetchServicePage = (serviceId: string, locale: string) => {
  const queryKey = getServicePageQueryKey(serviceId, locale);

  return useQuery<GetServicePageByIdResponse>({
    queryKey,
    queryFn: () => fetchServicePageData(serviceId, locale),
    enabled: Boolean(serviceId),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  });
};
