"use client";

import * as React from "react";
import { Table } from "@tanstack/react-table";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useFilterParams } from "@/hooks/use-filter-params";
import { useTableState } from "@/hooks/use-table-state";
import { Pagination } from "@/types/filter";

interface DataTablePaginationProps<TData> {
  table: Table<TData>;
  pagination?: Pagination;
}

export function DataTablePagination<TData>({
  table,
  pagination,
}: DataTablePaginationProps<TData>) {
  const { isPending, handlePaginationChange } = useTableState();
  const { pageNumber, pageSize } = useFilterParams();
  const t = useTranslations("Common.DataTable");

  const totalPages = pagination
    ? Math.ceil(pagination.allData / (pagination.pageSize ?? 10))
    : table.getPageCount();

  const handlePageSizeChange = (value: string) => {
    const newSize = Number(value);
    handlePaginationChange(0, newSize);
  };

  const handlePageChange = (newIndex: number) => {
    handlePaginationChange(newIndex, Number(pageSize));
  };
  return (
    <div
      className="flex items-center justify-between px-2"
      data-pending={isPending ? "" : undefined}
    >
      <div className="flex w-[100px] items-center justify-center text-sm font-medium">
        {t("page", {
          current: pageNumber,
          total: totalPages === 0 ? 1 : totalPages,
        })}{" "}
      </div>
      <div className="text-muted-foreground flex-1 text-sm">
        {table.getFilteredSelectedRowModel &&
        table.getFilteredSelectedRowModel().rows.length > 0 ? (
          <>
            {t("rowsSelected", {
              count: table.getFilteredSelectedRowModel().rows.length,
              total:
                pagination?.allData || table.getFilteredRowModel().rows.length,
            })}
          </>
        ) : null}
      </div>
      <div className="flex items-center space-x-6 lg:space-x-8">
        <div className="flex items-center space-x-2">
          <Select value={`${pageSize}`} onValueChange={handlePageSizeChange}>
            {" "}
            {/* Updated from takeEntity */}
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue placeholder={pageSize} />{" "}
              {/* Updated from takeEntity */}
            </SelectTrigger>
            <SelectContent side="top">
              {[10, 20, 30, 40, 50].map((size) => (
                <SelectItem key={size} value={`${size}`}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            className="hidden size-8 p-0 lg:flex"
            onClick={() => handlePageChange(0)}
            disabled={!table.getCanPreviousPage()}
          >
            <span className="sr-only">Go to first page</span>
            <ChevronsLeft className="size-4 rtl:rotate-180" />
          </Button>
          <Button
            variant="outline"
            className="size-8 p-0"
            onClick={() => handlePageChange(Number(pageNumber) - 2)}
            disabled={!table.getCanPreviousPage()}
          >
            <span className="sr-only">Go to previous page</span>
            <ChevronLeft className="size-4 rtl:rotate-180" />
          </Button>
          <Button
            variant="outline"
            className="size-8 p-0"
            onClick={() => handlePageChange(Number(pageNumber))}
            disabled={!table.getCanNextPage()}
          >
            <span className="sr-only">Go to next page</span>
            <ChevronRight className="size-4 rtl:rotate-180" />
          </Button>
          <Button
            variant="outline"
            className="hidden size-8 p-0 lg:flex"
            onClick={() => handlePageChange(totalPages - 1)}
            disabled={!table.getCanNextPage()}
          >
            <span className="sr-only">Go to last page</span>
            <ChevronsRight className="size-4 rtl:rotate-180" />
          </Button>
        </div>
      </div>
    </div>
  );
}
