import "server-only";

import {
  unstable_cacheLife as cacheLife,
  unstable_cacheTag as cacheTag,
} from "next/cache";

import { readData } from "@/config/http/http-service.server";
import {
  ADMIN_BASE_PATH,
  CATEGORY_MODULE_BASE_PATH,
} from "@/features/shared/types/constants";
import { LocaleHeaderTypes } from "@/types/common";

export interface ServiceDefinitionOption {
  id: string;
  name: string;
  description?: string;
  categoryName?: string;
  price?: number;
  currency?: string;
  durationMinutes?: number;
  isActive: boolean;
}

export const getServiceDefinitionOptions = async (
  locale: LocaleHeaderTypes,
  token: string
): Promise<ServiceDefinitionOption[]> => {
  "use cache: remote";
  cacheLife("hours");
  cacheTag("service-definition-options");

  const { data } = await readData<ServiceDefinitionOption[]>(
    `${CATEGORY_MODULE_BASE_PATH}/${ADMIN_BASE_PATH}/service-definitions/options`,
    {
      locale,
      token,
    }
  );

  return data?.filter((option) => option.isActive) ?? [];
};
