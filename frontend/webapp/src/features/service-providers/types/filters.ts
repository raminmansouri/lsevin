import {
  createSearchParamsCache,
  parseAsArrayOf,
  parseAsString,
} from "nuqs/server";

export const providerTypeFilterParams = {
  providerTypeIds: parseAsArrayOf(parseAsString).withDefault([]),
};

export const providerTypeSearchParamsCache = createSearchParamsCache(
  providerTypeFilterParams
);
