import { Locale } from "next-intl";

import { ApiReturnType } from "@/types/network";

import { getServiceDefinitionDetailsForClient } from "../../actions/get-service-definition-details";
import { ServiceDefinitionDetails } from "../../types/service-definition";

export const getServiceDefinitionDetailsClient = async (
  serviceDefinitionId: string,
  locale: Locale = "en" as Locale
) => {
  try {
    const result = await getServiceDefinitionDetailsForClient(serviceDefinitionId, locale);
    return { data: result } as ApiReturnType<ServiceDefinitionDetails>;
  } catch (error: unknown) {
    return {
      error: {
        title: (error as Error)?.message || "Failed to fetch service definition details",
        status: (error as { status?: number })?.status || 500,
        detail: (error as { detail?: string })?.detail || "An error occurred while fetching data",
      },
    } as ApiReturnType<ServiceDefinitionDetails>;
  }
};
