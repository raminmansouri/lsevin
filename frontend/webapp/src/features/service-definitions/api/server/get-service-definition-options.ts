import "server-only";

import {
  unstable_cacheLife as cacheLife,
  unstable_cacheTag as cacheTag,
} from "next/cache";

import { LocaleHeaderTypes } from "@/types/common";

import { getServiceDefinitionOptionsFromDb } from "../../db/service-definition-repository";

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

function pickTranslation(value: { translations?: Record<string, string> }, locale: string) {
  const translations = value.translations || {};
  return translations[locale] || translations[locale.split("-")[0]] || translations.en || Object.values(translations)[0] || "";
}

export const getServiceDefinitionOptions = async (
  locale: LocaleHeaderTypes,
  _token: string
): Promise<ServiceDefinitionOption[]> => {
  "use cache: remote";
  cacheLife("hours");
  cacheTag("service-definition-options");

  const options = await getServiceDefinitionOptionsFromDb(locale);
  return options.map((option) => ({
    id: option.id,
    name: pickTranslation(option.name, locale),
    description: pickTranslation(option.description, locale),
    categoryName: option.categoryName,
    price: option.price,
    currency: option.currency,
    durationMinutes: option.durationMinutes,
    isActive: option.isActive,
  }));
};
