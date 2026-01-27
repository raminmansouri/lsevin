import {
  createSearchParamsCache,
  parseAsInteger,
  parseAsString,
} from "nuqs/server";

export const DEFAULT_PAGE_NUMBER = 1;
export const DEFAULT_PAGE_SIZE = 10;

export const filterParams = {
  filters: parseAsString.withDefault(""),
  startDate: parseAsString.withDefault(""),
  endDate: parseAsString.withDefault(""),
  pageNumber: parseAsInteger.withDefault(DEFAULT_PAGE_NUMBER),
  pageSize: parseAsInteger.withDefault(DEFAULT_PAGE_SIZE),
  sortOrder: parseAsString.withDefault(""),
};

export const searchParamsCache = createSearchParamsCache(filterParams);

export type FilterParams = {
  [K in keyof typeof filterParams]: (typeof filterParams)[K] extends {
    withDefault: (defaultValue: infer D) => unknown;
  }
    ? D
    : (typeof filterParams)[K] extends { parse: (value: infer P) => unknown }
      ? P
      : never;
};

export type DateRangeParams = Partial<
  Pick<FilterParams, "startDate" | "endDate">
>;

export type SearchParams = Partial<Pick<FilterParams, "filters">>;

export type SortParams = Partial<Pick<FilterParams, "sortOrder">>;

export type PaginationParams = Pick<FilterParams, "pageNumber" | "pageSize">;

export type Pagination = Pick<FilterParams, "pageNumber" | "pageSize"> & {
  pages: number;
  allData: number;
};
