import { useFetchProviderPageData } from "@/features/service-providers/api/client/fetch-provider-page-data";

export function useProviderPage(providerId: string, locale: string) {
  return useFetchProviderPageData(providerId, locale);
}
