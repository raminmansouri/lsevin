import "server-only";

import type { BaseRequest } from "@/types/common";
import type { ApiReturnType } from "@/types/network";
import type { ProviderPageDataResponse } from "@/features/service-providers/types/provider-page-types";
import { getProviderPageDataFromDb } from "@/features/service-providers/server/provider-page.repository";

export async function getProviderPageData(
  request: BaseRequest,
  providerId: string,
  options?: {
    targetCurrencyCode?: string | null;
    selectedCountryCode?: string | null;
    browserCountryCode?: string | null;
  }
): Promise<ApiReturnType<ProviderPageDataResponse>> {
  return getProviderPageDataFromDb({
    providerId,
    locale: request.locale,
    userId: request.userId,
    targetCurrencyCode: options?.targetCurrencyCode,
    selectedCountryCode: options?.selectedCountryCode,
    browserCountryCode: options?.browserCountryCode,
  });
}
