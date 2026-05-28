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
<<<<<<< HEAD
  params: any,
  dontAddNulls=false
=======
  params: any
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965
) {
  const excludeNames = [
    "filters",
    "startDate",
    "endDate",
    "pageNumber",
    "pageSize",
    "sortOrder",
  ]
  console.log('searchParams changed', params)
<<<<<<< HEAD
  console.log('searchParams before', searchParams.toString(), params)
  if (Object.keys(params).length > 0) {
    for (let key in params) {
=======
  console.log('searchParams before', searchParams.toString(),params)
  if (Object.keys(params).length > 0) {
    for ( let key in params){
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965
      if (
        searchParams.has(key) == false &&
        excludeNames.indexOf(key) < 0) {

        if (Array.isArray(params[key])) { // Check if the value is an array
<<<<<<< HEAD
          console.log('searchParams arr', key, params[key], 'ex:' + excludeNames[key])
          params[key].forEach((value, index) => {

            if (!dontAddNulls)
              searchParams.set(`${key}[]`, value ?? '')
          });
        } else {
          console.log('searchParams add', key, params[key], 'ex:' + excludeNames[key])
          if (!dontAddNulls)
            searchParams.set(key, params[key] ?? '')
=======
         console.log('searchParams arr', key, params[key], 'ex:' + excludeNames[key])
  params[key].forEach((value, index) => {
            searchParams.set(`${key}[]`,value)
          });
        } else {
            console.log('searchParams add', key, params[key], 'ex:' + excludeNames[key])
          searchParams.set(key, params[key])
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965

        }

      }
    }
  }
  console.log('searchParams after', searchParams.toString())
  return searchParams;
}
export function objToQueryString(obj: any) {
  let query = '';

  for (let key in obj) {
    if (Array.isArray(obj[key])) { // Handle arrays as comma-separated values
      obj[key].forEach((value, index) => {
        query += `${encodeURIComponent(key)}=${encodeURIComponent(value)}${index < obj[key].length - 1 ?
          ',' : ''}&`;
      });
    } else if (typeof obj[key] === 'object') { // Recursively handle nested objects
      query += objToQueryString(obj[key]) + '&';
    } else {
      query += `${encodeURIComponent(key)}=${encodeURIComponent(obj[key])}&`;
    }
  }

  return query.slice(0, -1); // Remove the last ampersand character
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
