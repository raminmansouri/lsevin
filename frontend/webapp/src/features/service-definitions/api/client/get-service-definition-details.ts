import { readData } from "@/config/http/http-service.client";
import { ApiReturnType } from "@/types/network";

import { ServiceDefinitionDetails } from "../../types/service-definition";

export const getServiceDefinitionDetailsClient = async (
  serviceDefinitionId: string
) => {
  try {
    const result = await readData<ServiceDefinitionDetails>(
      `/service-definitions/${serviceDefinitionId}/details`
    );

    const response: ApiReturnType<ServiceDefinitionDetails> = { data: result };
    return response;
  } catch (error: unknown) {
    const response: ApiReturnType<ServiceDefinitionDetails> = {
      error: {
        title:
          (error as Error)?.message ||
          "Failed to fetch service definition details",
        status: (error as { status?: number })?.status || 500,
        detail:
          (error as { detail?: string })?.detail ||
          "An error occurred while fetching data",
      },
    };
    return response;
  }
};
