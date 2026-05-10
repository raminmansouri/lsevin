"use client";


import { useTranslations } from "next-intl";
import Link from "next/link";
import { useTransition } from "react";
import { toast } from "sonner";
import { Edit, Plus, Search, Trash2 } from "lucide-react";

import { hasLexicalContent, LexicalRenderer } from "@/components/editor/lexical-renderer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import useAction from "@/hooks/use-action";
import { usePathname, useRouter } from "@/i18n/navigation";

import { deleteAdminRowAction } from "../actions";
import { encodeRowId } from "../lib/ids";
import { getFieldKind, getLocalizedDisplayValue } from "../lib/values";
import type { AdminFieldConfig, AdminListResult, AdminRow, AdminTableConfig } from "../types";

type Props = {
  config: AdminTableConfig;
  result: AdminListResult;
  search?: string;
  locale: string;
};

function formatValue(value: unknown, fieldConfig?: AdminFieldConfig, locale = "en-US") {
  if (fieldConfig) {
    const kind = getFieldKind(fieldConfig);
    if (kind === "localized" || kind === "localized-rich") {
      const content = getLocalizedDisplayValue(value, locale, "fa-IR");
      if (!content || String(content).trim() === "") return <span className="text-muted-foreground">—</span>;
      if (kind === "localized-rich" && hasLexicalContent(content as never)) {
        return <LexicalRenderer content={content as never} className="line-clamp-3 max-w-[360px] text-muted-foreground" />;
      }
      return <span className="line-clamp-2 max-w-[320px]">{String(content)}</span>;
    }
  }

  if (value === null || value === undefined || value === "") return <span className="text-muted-foreground">—</span>;
  if (typeof value === "boolean") {
    return <span className={value ? "text-emerald-700" : "text-gray-500"}>{value ? "Yes" : "No"}</span>;
  }
  if (typeof value === "object") {
    return <code className="line-clamp-2 max-w-[280px] rounded bg-gray-50 px-2 py-1 text-xs">{JSON.stringify(value)}</code>;
  }
  return <span className="line-clamp-2 max-w-[280px]">{String(value)}</span>;
}

function badge(value: unknown) {
  if (value === null || value === undefined) return null;
  return <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-700">{String(value)}</span>;
}

export function AdminDataTable({ config, result, search, locale }: Props) {
  const tAdmin = useTranslations("AdminGenerated");
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const columns = config.listColumns?.length ? config.listColumns : config.fields.slice(0, 7).map((field) => field.name);

  const { execute } = useAction(deleteAdminRowAction, {
    startTransition,
    onSuccess: () => {
      toast.success(tAdmin("recordDeleted"));
      router.refresh();
    },
    onError: (error) => toast.error(error.detail || "Delete failed."),
  });

  const handleSearch = (formData: FormData) => {
    const q = String(formData.get("q") || "").trim();
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    router.push(`${pathname}${params.size ? `?${params.toString()}` : ""}`);
  };

  const handleDelete = async (row: AdminRow) => {
    if (!window.confirm(`Delete this ${config.title} record?`)) return;
    const rowId = Object.fromEntries(config.primaryKey.map((key) => [key, row[key]]));
    await execute({ schema: config.schema, table: config.table, rowId });
  };

  return (
    <Card className="rounded-2xl border-gray-100 shadow-sm">
      <CardHeader className="space-y-4">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
          <div>
            <CardTitle className="text-2xl">{config.title}</CardTitle>
            <CardDescription>{config.description}</CardDescription>
          </div>
          {!config.readOnly && (
            <Button asChild>
              <Link href={`/admin/platform-data/${config.schema}/${config.table}/new`}>
                <Plus className="mr-2 h-4 w-4" /> New record
              </Link>
            </Button>
          )}
        </div>
        <form action={handleSearch} className="flex w-full max-w-xl gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input name="q" defaultValue={search} className="pl-9" placeholder={`Search ${config.searchableColumns?.join(", ") || config.title}`} />
          </div>
          <Button type="submit" variant="outline">{tAdmin("search")}</Button>
        </form>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full min-w-[960px] text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
              <tr>
                {columns.map((column) => <th key={column} className="px-4 py-3 font-semibold">{column.replaceAll("_", " ")}</th>)}
                <th className="px-4 py-3 text-right font-semibold">{tAdmin("actions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {result.rows.map((row) => {
                const rowId = encodeRowId(config, row);
                return (
                  <tr key={rowId} className="bg-white hover:bg-gray-50/70">
                    {columns.map((column) => {
                      const fieldConfig = config.fields.find((field) => field.name === column);
                      return (
                        <td key={column} className="px-4 py-3 align-top">
                          {column === config.badgeColumn ? badge(row[column]) : formatValue(row[column], fieldConfig, locale)}
                        </td>
                      );
                    })}
                    <td className="px-4 py-3 text-right align-top">
                      <div className="flex justify-end gap-2">
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/admin/platform-data/${config.schema}/${config.table}/${rowId}/edit`}>
                            <Edit className="mr-1 h-3.5 w-3.5" /> View/Edit
                          </Link>
                        </Button>
                        {!config.readOnly && (
                          <Button size="sm" variant="destructive" disabled={isPending} onClick={() => handleDelete(row)}>
                            <Trash2 className="mr-1 h-3.5 w-3.5" /> Delete
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!result.rows.length && (
                <tr>
                  <td colSpan={columns.length + 1} className="px-4 py-16 text-center text-muted-foreground">{tAdmin("noRecordsFound")}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
          <span>{result.total} records · page {result.page} of {result.pageCount}</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={result.page <= 1} onClick={() => router.push(`${pathname}?page=${result.page - 1}${search ? `&q=${encodeURIComponent(search)}` : ""}`)}>Previous</Button>
            <Button variant="outline" size="sm" disabled={result.page >= result.pageCount} onClick={() => router.push(`${pathname}?page=${result.page + 1}${search ? `&q=${encodeURIComponent(search)}` : ""}`)}>Next</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
