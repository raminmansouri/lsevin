import { ColumnDef } from "@tanstack/react-table";

import { Pagination } from "@/types/filter";

export interface PaginationState {
  pageIndex: number;
  pageSize: number;
}

export interface SortingState {
  id: string;
  desc: boolean;
}

export interface DataTableFilterOption {
  label: string;
  value: string;
  icon?: React.ComponentType<{ className?: string }>;
}

export interface DataTableFilter {
  id: string;
  title: string;
  options: DataTableFilterOption[];
}

export interface DataTablePagination {
  pageCount: number;
  pageSize: number;
}

export interface DataTableToolbarProps<TData> {
  table: TData;
  filters?: DataTableFilter[];
}

export interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  filters?: DataTableFilter[];
  pagination?: Pagination;
  children?: React.ReactNode;
  onRowClick?: (row: TData) => void;
  rowClassName?: string;
}
