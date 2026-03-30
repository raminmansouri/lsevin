import { SearchParams } from "nuqs/server";

import {
  DateRangeParams,
  FilterParams,
  Pagination,
  PaginationParams,
  searchParamsCache,
  SortParams,
} from "@/types/filter";
import { PaginatedResult } from "@/types/network";

export function addDateRangeParams(
  searchParams: URLSearchParams,
  params: DateRangeParams
) {
  if (params.startDate) {
    searchParams.set("startDate", params.startDate);
  }
  if (params.endDate) {
    searchParams.set("endDate", params.endDate);
  }
  return searchParams;
}

export function addPaginationParams(
  searchParams: URLSearchParams,
  params: PaginationParams
) {
  searchParams.set("pageNumber", params.pageNumber.toString());
  searchParams.set("pageSize", params.pageSize.toString());
  return searchParams;
}

export function addSortingParams(
  searchParams: URLSearchParams,
  params: SortParams
) {
  if (params.sortOrder) {
    searchParams.set("sortOrder", params.sortOrder);
  }
  return searchParams;
}

export function addSearchParam(
  searchParams: URLSearchParams,
  filters?: string
) {
  if (filters) {
    searchParams.set("filters", filters);
  }
  return searchParams;
}
export function addAllParams(
  searchParams: URLSearchParams,
  params: FilterParams
) {
  if(Object.keys(params).length>0){
    Object.keys(params).map(key=>{
      searchParams.set(key,params[key])
    })
  }
  return searchParams;
}


export function addAllFilterParams(
  searchParams: URLSearchParams,
  params: FilterParams
) {
  addDateRangeParams(searchParams, params);
  addPaginationParams(searchParams, params);
  addSortingParams(searchParams, params);
  addSearchParam(searchParams, params.filters);
  return searchParams;
}

export const transformSearchParamsToFilterParams = (
  searchParams: SearchParams
): FilterParams => {
  const { filters, startDate, endDate, pageNumber, pageSize, sortOrder } =
    searchParamsCache.parse(searchParams);

  return {
    filters: filters ?? undefined,
    startDate: startDate ?? undefined,
    endDate: endDate ?? undefined,
    pageNumber: pageNumber ?? 1,
    pageSize: pageSize ?? 10,
    sortOrder: sortOrder ?? undefined,
  };
};

export const transformPaginatedResultToPagination = <T>(
  result: Omit<PaginatedResult<T>, "items">
): Pagination => {
  return {
    pageNumber: result.pageNumber === 0 ? 1 : result.pageNumber,
    pageSize: result.pageSize === 0 ? 10 : result.pageSize,
    pages: result.totalPages === 0 ? 1 : result.totalPages,
    allData: result.totalCount === 0 ? 0 : result.totalCount,
  };
};
