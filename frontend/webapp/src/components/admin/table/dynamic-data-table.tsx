"use client";


import { useTranslations } from "next-intl";
import { resolveAdminTableCellExtension } from "@/lib/admin/extensions/form-and-table-renderers";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ColumnDef,
  PaginationState,
  RowSelectionState,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ChevronLeft, ChevronRight, Filter, Pencil, Trash2, Eye } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ResolvedTableDefinition, ListQueryResultRow } from "@/lib/admin/types";
import { hasLexicalContent, LexicalRenderer } from "@/components/editor/lexical-renderer";

type Props = {
  definition: ResolvedTableDefinition;
  rows: ListQueryResultRow[];
  page: number;
  pageSize: number;
  pageCount: number;
  total: number;
};

export function DynamicDataTable({
  definition,
  rows,
  page,
  pageSize,
  pageCount,
  total,
}: Props) {
  const tAdmin = useTranslations("AdminGenerated");
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [globalSearch, setGlobalSearch] = useState(params.get("q") ?? "");

  const columns = useMemo<ColumnDef<ListQueryResultRow>[]>(() => {
    const defs: ColumnDef<ListQueryResultRow>[] = definition.listFields.map((field) => ({
      accessorKey: field.columnName,
      header: field.label,
      cell: ({ row }) => {


        const relationLabel = row.original[`${field.columnName}__label`];
        const value = relationLabel ?? row.getValue(field.columnName);
        if (value === null || value === undefined || value === "") {
          return <span className="text-zinc-400">—</span>;
        }

        const customCell = resolveAdminTableCellExtension({
          definition,
          field,
          row: row.original,
          value,
        });

        if (customCell) {
          return customCell;
        }
        if (typeof value === "boolean") {
          return (
            <span className={value ? "text-emerald-600" : "text-zinc-500"}>
              {value ? "Yes" : "No"}
            </span>
          );
        }

        return <span className="truncate">{String(value)}</span>;
      },
    }));

    defs.push({
      id: "__actions",
      header: "",
      cell: ({ row }) => {
        const id = row.original.__pk;
        return (
          <div className="flex items-center justify-end gap-1">
            <Link
              href={`${pathname}/${id}`}
              className="rounded-xl p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              <Eye className="h-4 w-4" />
            </Link>
            <Link
              href={`${pathname}/${id}/edit`}
              className="rounded-xl p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              <Pencil className="h-4 w-4" />
            </Link>
            <button className="rounded-xl p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        );
      },
    });

    return defs;
  }, [definition.listFields, pathname]);

  const table = useReactTable({
    data: rows,
    columns,
    pageCount,
    state: {
      rowSelection,
      pagination: {
        pageIndex: page - 1,
        pageSize,
      } satisfies PaginationState,
    },
    manualPagination: true,
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
  });

  function updateQuery(next: Record<string, string | number | undefined>) {
    const q = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(next)) {
      if (value === undefined || value === "") q.delete(key);
      else q.set(key, String(value));
    }
    router.push(`${pathname}?${q.toString()}`);
  }

  return (
    <div className="rounded-3xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex flex-col gap-3 border-b border-zinc-200 p-4 dark:border-zinc-800 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 items-center gap-2">
          <input
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") updateQuery({ q: globalSearch, page: 1 });
            }}
            placeholder={tAdmin("searchRecords")}
            className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-2 text-sm outline-none ring-0 placeholder:text-zinc-400 focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950"
          />
          <button
            onClick={() => updateQuery({ q: globalSearch, page: 1 })}
            className="inline-flex items-center gap-2 rounded-2xl border border-zinc-200 px-3 py-2 text-sm hover:bg-zinc-100 dark:border-zinc-800 dark:hover:bg-zinc-800"
          >
            <Filter className="h-4 w-4" />
            Apply
          </button>
        </div>

        <div className="text-sm text-zinc-500">
          {Object.keys(rowSelection).length} selected · {total} total
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-zinc-50 dark:bg-zinc-950">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id} className="border-b border-zinc-200 dark:border-zinc-800">
                {hg.headers.map((header) => (
                  <th key={header.id} className="whitespace-nowrap px-4 py-3 text-left font-medium text-zinc-600 dark:text-zinc-300">
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-14 text-center text-zinc-500">
                  No records found.
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-zinc-100 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-950"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="max-w-[280px] px-4 py-3 align-middle">

                      {cell.column.columnDef.cell &&
                        hasLexicalContent(cell.getValue()?.toString()) ? (
                        <div style={{ overflow: "hidden", height: '50px' }}>
                          <LexicalRenderer
                            content={cell.getValue()?.toString()}

                          />
                        </div>
                      ) : (
                        <>
                          <div style={{ overflow: "hidden", height: '50px', maxWidth: '100px' }}>
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </div>
                        </>
                      )}

                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
        <div className="text-sm text-zinc-500">
          Page {page} of {pageCount}
        </div>

        <div className="flex items-center gap-2">
          <button
            disabled={page <= 1}
            onClick={() => updateQuery({ page: page - 1 })}
            className="inline-flex items-center gap-2 rounded-2xl border border-zinc-200 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800"
          >
            <ChevronLeft className="h-4 w-4" />
            Prev
          </button>
          <button
            disabled={page >= pageCount}
            onClick={() => updateQuery({ page: page + 1 })}
            className="inline-flex items-center gap-2 rounded-2xl border border-zinc-200 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
