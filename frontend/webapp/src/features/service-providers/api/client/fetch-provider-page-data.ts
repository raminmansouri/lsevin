import { getProviderPageAction } from "@/features/service-providers/actions/provider-page";
import type { ProviderPageDataResponse } from "@/features/service-providers/types/provider-page-types";
import type { IProblem } from "@/types/error";
import { queryOptions, useQuery } from "@tanstack/react-query";

export type ProviderPageCurrencyOptions = {
  targetCurrencyCode?: string | null;
  selectedCountryCode?: string | null;
  browserCountryCode?: string | null;
  userId?: string | null;
};

const fetchProviderPageData = async (
  providerId: string,
  locale: string,
  currencyOptions?: ProviderPageCurrencyOptions
): Promise<ProviderPageDataResponse> => {
  const response = await getProviderPageAction({
    providerId,
    locale,
    targetCurrencyCode: currencyOptions?.targetCurrencyCode,
    selectedCountryCode: currencyOptions?.selectedCountryCode,
    browserCountryCode: currencyOptions?.browserCountryCode,
    userId: currencyOptions?.userId,
  });

  if (response.error || !response.data) {
    const error = new Error(response.error?.detail || response.error?.title || "Could not load provider page.") as Error & {
      problem?: IProblem;
    };
    error.problem = response.error;
    throw error;
  }

  return response.data;
};

const PROVIDER_PAGE_CACHE_TAG = "provider-page-data";
const queryKey = (providerId?: string | null, locale?: string | null, options?: ProviderPageCurrencyOptions) =>
  [
    PROVIDER_PAGE_CACHE_TAG,
    providerId || "",
    locale || "",
    options?.targetCurrencyCode || "",
    options?.selectedCountryCode || "",
    options?.browserCountryCode || "",
    options?.userId || "",
  ] as const;

export const useFetchProviderPageData = (
  providerId?: string | null,
  locale?: string | null,
  currencyOptions?: ProviderPageCurrencyOptions,
  // Server-rendered payload from the route's server component. When present the
  // first render uses it directly — no client action round-trip — and React
  // Query only refetches in the background once the entry goes stale.
  initialData?: ProviderPageDataResponse
) => {
  const options = queryOptions<ProviderPageDataResponse, IProblem | Error>({
    queryKey: queryKey(providerId, locale, currencyOptions),
    queryFn: () => fetchProviderPageData(providerId as string, locale || "fa", currencyOptions),
    enabled: Boolean(providerId),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    initialData,
    // initialData is server-rendered with no visitor context (isFavorite is
    // always baked in as false). Marking it as already-stale (updated "at the
    // epoch") makes React Query refetch with the real userId right after
    // mount instead of trusting the static payload for staleTime (5 min).
    initialDataUpdatedAt: 0,
  });

  const { data, error, isFetching, refetch } = useQuery(options);
  return { data, error, isFetching, refetch };
};
