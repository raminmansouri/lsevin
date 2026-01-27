"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Options, useQueryState } from "nuqs";

import {
  DateRangeParams,
  filterParams,
  FilterParams,
  PaginationParams,
  SortParams,
} from "@/types/filter";

export const defaultQueryStateOptions: Options = {
  history: "push",
  // scroll: true,
  shallow: false,
  throttleMs: 1000,
};

export function useFilterParams() {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const [startDate, setStartDate] = useQueryState(
    "startDate",
    filterParams.startDate.withOptions({})
  );
  const [endDate, setEndDate] = useQueryState(
    "endDate",
    filterParams.endDate.withOptions({})
  );
  const [pageNumber, setPageNumber] = useQueryState(
    "pageNumber",
    filterParams.pageNumber.withOptions({})
  );
  const [pageSize, setPageSize] = useQueryState(
    "pageSize",
    filterParams.pageSize.withOptions({})
  );
  const [sortOrder, setSortOrder] = useQueryState(
    "sortOrder",
    filterParams.sortOrder.withOptions({})
  );
  const [filters, setFilters] = useQueryState(
    "filters",
    filterParams.filters.withOptions({})
  );

  const updateFilters = async (updates: Partial<FilterParams>) => {
    startTransition(async () => {
      await Promise.all(
        Object.entries(updates).map(async ([key, value]) => {
          switch (key) {
            case "startDate":
              return setStartDate(value?.toString() ?? null);
            case "endDate":
              return setEndDate(value?.toString() ?? null);
            case "pageNumber":
              return setPageNumber(Number(value) ?? 1);
            case "pageSize":
              return setPageSize(Number(value) ?? 10);
            case "sortOrder":
              return setSortOrder(value?.toString() ?? null);
            case "filters":
              return setFilters(value?.toString() ?? null);
          }
        })
      );
      router.refresh();
    });
  };

  const updateDateRange = (params: Partial<DateRangeParams>) => {
    updateFilters({ ...params, pageNumber: 1 });
  };

  const updatePagination = (params: Partial<PaginationParams>) => {
    updateFilters(params);
  };

  const updateSort = (params: Partial<SortParams>) => {
    updateFilters({ ...params, pageNumber: 1 });
  };

  const updateSearch = (searchValue?: string) => {
    updateFilters({ filters: searchValue || "", pageNumber: 1 });
  };

  const resetFilters = async () => {
    startTransition(async () => {
      await Promise.all([
        setStartDate(null),
        setEndDate(null),
        setPageNumber(1),
        setPageSize(10),
        setFilters(null),
        setSortOrder(null),
      ]);
      router.refresh();
    });
  };

  return {
    isPending,
    startDate,
    endDate,
    pageNumber,
    pageSize,
    sortOrder,
    filters,
    updateDateRange,
    updatePagination,
    updateSort,
    updateSearch,
    resetFilters,
    updateFilters,
  };
}
