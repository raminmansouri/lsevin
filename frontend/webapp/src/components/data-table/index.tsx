"use client";

import * as React from "react";
import {
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ArrowDownIcon, ArrowUpIcon, ChevronsUpDown } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useFilterParams } from "@/hooks/use-filter-params";
import { useTableState } from "@/hooks/use-table-state";

import { DataTablePagination } from "./data-table-pagination";
import { DataTableToolbar } from "./data-table-toolbar";
import type { DataTableProps } from "./types";

interface DataTableSkeletonProps {
  columnCount?: number;
  rowCount?: number;
  showToolbar?: boolean;
  showPagination?: boolean;
  children?: React.ReactNode;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  filters,
  pagination,
  children,
  rowClassName,
  onRowClick,
}: DataTableProps<TData, TValue>) {
  const {
    isPending,
    columnFilters,
    setColumnFilters,
    sorting,
    handleSortingChange,
    handlePaginationChange,
  } = useTableState();
  const { pageNumber, pageSize } = useFilterParams();
  const t = useTranslations("Common.DataTable");

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      pagination: {
        pageIndex: Number(pageNumber) - 1,
        pageSize: Number(pageSize),
      },
    },
    pageCount: pagination
      ? Math.ceil(pagination.allData / pagination.pageSize)
      : 1,
    manualPagination: true,
    manualSorting: true,
    onSortingChange: handleSortingChange,
    onPaginationChange: (updater) => {
      const state = table.getState();
      const newPagination =
        typeof updater === "function" ? updater(state.pagination) : updater;
      handlePaginationChange(newPagination.pageIndex, newPagination.pageSize);
    },
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  });
  return (
    <div
      className="space-y-4 group-has-data-pending:animate-pulse group-has-data-pending:cursor-wait"
      data-pending={isPending ? "" : undefined}
      aria-disabled={isPending}
      aria-busy={isPending}
      style={{ pointerEvents: isPending ? "none" : undefined }}
    >
      <DataTableToolbar table={table} filters={filters} />
      {children}
      {/* Mobile Card View */}
      <div className="block space-y-4 md:hidden">
        {table.getRowModel().rows?.length ? (
          table.getRowModel().rows.map((row) => (
            <Card
              key={row.id}
              className={rowClassName}
              onClick={() => onRowClick?.(row.original)}
            >
              <CardContent className="space-y-2 p-4">
                {row.getVisibleCells().map((cell) => (
                  <div
                    key={cell.id}
                    className="flex items-start justify-between gap-2"
                  >
                    <span className="text-muted-foreground text-sm font-medium">
                      {cell.column.columnDef.header?.toString() ||
                        cell.column.id}
                    </span>
                    <span className="overflow-hidden text-right text-sm break-words text-ellipsis whitespace-nowrap">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="flex h-24 items-center justify-center">
              <p className="text-muted-foreground pt-6 text-center">
                {t("noResults")}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
      {/* Desktop Table View */}
      <div className="hidden rounded-md border md:block">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="whitespace-nowrap">
                    {header.isPlaceholder ? null : (
                      <div className="flex items-center space-x-2">
                        {header.column.getCanSort() ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="data-[state=open]:bg-accent -ml-3 h-8"
                            onClick={header.column.getToggleSortingHandler()}
                          >
                            <span>
                              {flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                            </span>
                            {{
                              asc: <ArrowUpIcon className="ml-2 size-4" />,
                              desc: <ArrowDownIcon className="ml-2 size-4" />,
                            }[header.column.getIsSorted() as string] ?? (
                              <ChevronsUpDown className="ml-2 size-4" />
                            )}
                          </Button>
                        ) : (
                          flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )
                        )}
                      </div>
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className={rowClassName}
                  onClick={() => onRowClick?.(row.original)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  {t("noResults")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <DataTablePagination table={table} pagination={pagination} />
    </div>
  );
}

export function DataTableSkeleton({
  columnCount = 5,
  rowCount = 10,
  showToolbar = true,
  showPagination = true,
  children,
}: DataTableSkeletonProps) {
  return (
    <div className="space-y-4">
      {showToolbar && (
        <div className="flex flex-1 flex-col items-center justify-between gap-2 md:flex-row">
          <Skeleton className="h-8 w-full md:w-[250px]" />
        </div>
      )}
      {children}
      {/* Mobile Card Skeleton */}
      <div className="block space-y-4 md:hidden">
        {Array.from({ length: rowCount }).map((_, i) => (
          <Card key={i}>
            <CardContent className="space-y-2 p-4">
              {Array.from({ length: columnCount }).map((_, j) => (
                <div key={j} className="flex items-center justify-between">
                  <Skeleton className="h-4 w-[100px]" />
                  <Skeleton className="h-4 w-[100px]" />
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
      {/* Desktop Table Skeleton */}
      <div className="hidden rounded-md border md:block">
        <Table>
          <TableHeader>
            <TableRow>
              {Array.from({ length: columnCount }).map((_, i) => (
                <TableHead key={i}>
                  <Skeleton className="h-6 w-[100px]" />
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: rowCount }).map((_, i) => (
              <TableRow key={i}>
                {Array.from({ length: columnCount }).map((_, j) => (
                  <TableCell key={j}>
                    <Skeleton className="h-5 w-[100px]" />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {showPagination && (
        <div className="flex items-center justify-between px-2">
          <Skeleton className="h-8 w-[150px]" />
          <div className="flex items-center space-x-6 lg:space-x-8">
            <Skeleton className="h-8 w-[70px]" />
            <div className="flex items-center space-x-2">
              <Skeleton className="size-8" />
              <Skeleton className="size-8" />
              <Skeleton className="size-8" />
              <Skeleton className="size-8" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
