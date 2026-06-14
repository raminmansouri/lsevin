"use client";

import { Table } from "@tanstack/react-table";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import Form from "next/form";
import { useDebouncedCallback } from "use-debounce";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useFilterParams } from "@/hooks/use-filter-params";
import { useTableState } from "@/hooks/use-table-state";
import { cn } from "@/lib/utils";

import { DataTableFacetedFilter } from "./data-table-faceted-filter";
import { DataTableFilter } from "./types";

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
  filters?: DataTableFilter[];
}

export function DataTableToolbar<TData>({
  table,
  filters: tableFilters,
}: DataTableToolbarProps<TData>) {
  const { isPending, handleSearchChange, handleReset } = useTableState();
  const { filters, startDate, endDate } = useFilterParams();
  const t = useTranslations("Common.DataTable");

  const isFiltered = table.getState().columnFilters.length > 0;

  const handleSearch = useDebouncedCallback((term: string) => {
    handleSearchChange(term);
  }, 300);

  return (
    <div
      data-pending={isPending ? "" : undefined}
      className="flex items-center justify-between"
    >
      <div className="flex flex-1 flex-col items-center justify-between gap-2 md:flex-row">
        <Form action="" className="flex w-full items-center gap-2">
          <Input
            placeholder={t("search")}
            name="filters"
            defaultValue={filters ?? ""}
            className={cn("h-8 w-full md:w-[250px]", "sm:pr-8")}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </Form>

        <div className="flex w-full items-center space-x-2 md:w-auto">
          {tableFilters?.map(
            (filter) =>
              filter.options && (
                <DataTableFacetedFilter
                  key={filter.id}
                  column={table.getColumn(filter.id)}
                  title={filter.title}
                  options={filter.options}
                />
              )
          )}
          {(isFiltered || startDate || endDate) && (
            <Button
              variant="ghost"
              onClick={handleReset}
              className="h-8 px-2 lg:px-3"
            >
              {t("reset")}
              <X className="ml-2 size-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
