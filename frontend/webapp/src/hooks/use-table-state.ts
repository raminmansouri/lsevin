import { useState } from "react";
import { ColumnFiltersState, SortingState } from "@tanstack/react-table";

import { useFilterParams } from "./use-filter-params";

export function useTableState() {
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const {
    isPending,
    sortOrder,
    updateDateRange,
    updatePagination,
    updateSort,
    updateSearch,
    resetFilters,
  } = useFilterParams();

  const [sorting, setSorting] = useState<SortingState>(() => {
    if (!sortOrder) return [];

    // Backend format: "columnName" or "-columnName" for descending
    const isDesc = sortOrder.startsWith("-");
    const columnName = isDesc ? sortOrder.substring(1) : sortOrder;

    return [
      {
        id: columnName,
        desc: isDesc,
      },
    ];
  });

  const handleSortingChange = (
    updater: SortingState | ((state: SortingState) => SortingState)
  ) => {
    const newSorting =
      typeof updater === "function" ? updater(sorting) : updater;
    setSorting(newSorting);

    // Convert to backend format (-columnName for desc)
    let sortOrderValue: string | undefined;
    if (newSorting.length > 0 && newSorting[0]) {
      const { id, desc } = newSorting[0];
      sortOrderValue = desc ? `-${id}` : id;
    }

    updateSort({ sortOrder: sortOrderValue });
  };

  const handlePaginationChange = (pageIndex: number, pageSize: number) => {
    updatePagination({
      pageNumber: pageIndex + 1,
      pageSize: pageSize,
    });
  };

  const handleSearchChange = (term: string) => {
    updateSearch(term);
  };

  const handleDateRangeChange = (startDate?: string, endDate?: string) => {
    updateDateRange({ startDate, endDate });
  };

  const handleReset = () => {
    setColumnFilters([]);
    resetFilters();
  };

  return {
    isPending,
    columnFilters,
    sorting,
    setColumnFilters,
    handleSortingChange,
    handlePaginationChange,
    handleSearchChange,
    handleDateRangeChange,
    handleReset,
  };
}
