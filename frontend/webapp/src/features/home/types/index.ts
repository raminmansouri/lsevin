import {
  createSearchParamsCache,
  parseAsJson,
  parseAsString,
} from "nuqs/server";

export const homeFilterParams = {
  slug: parseAsString.withDefault(""),
  countryCode: parseAsString.withDefault(""),
  cityCode: parseAsString.withDefault(""),
};
export const homeSearchParamsCache = createSearchParamsCache(homeFilterParams);

// Attribute filter value for by-type page
export interface AttributeFilterValue {
  attributeDefinitionId: string;
  value: string;
}

// By-Type page filter params
export const byTypeFilterParams = {
  search: parseAsString.withDefault(""),
  countryCode: parseAsString.withDefault(""),
  cityCode: parseAsString.withDefault(""),
  attributeFilters: parseAsJson<AttributeFilterValue[]>((value) =>
    Array.isArray(value) ? value : null
  ).withDefault([]),
};

export const byTypeSearchParamsCache =
  createSearchParamsCache(byTypeFilterParams);



  