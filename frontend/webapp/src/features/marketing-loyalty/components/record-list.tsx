"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { Edit, Eye, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { hasLexicalContent, LexicalRenderer } from "@/components/editor/lexical-renderer";
import { Input } from "@/components/ui/input";

import { deleteMarketingLoyaltyRecordAction } from "../actions/delete-record";
import type { AdminEntityConfig, AdminListResult } from "../types";

type Props = {
  config: AdminEntityConfig;
  data: AdminListResult;
  q?: string;
  locale?: string;
};

export function MarketingLoyaltyRecordList({ config, data, q = "", locale = "en" }: Props) {
  const [isPending, startTransition] = useTransition();
  const [items, setItems] = useState(data.items);

  const canCreate = config.creatable !== false;
  const canEdit = config.editable !== false && !config.appendOnly;
  const canDelete = config.deletable !== false && !config.appendOnly;

  const pageLinks = useMemo(() => {
    const links = [];
    for (let page = 1; page <= data.pageCount; page += 1) {
      if (page === 1 || page === data.pageCount || Math.abs(page - data.page) <= 2) {
        const params = new URLSearchParams();
        params.set("page", String(page));
        if (q) params.set("q", q);
        links.push({ page, href: `${config.routeBase}?${params.toString()}` });
      }
    }
    return links;
  }, [config.routeBase, data.page, data.pageCount, q]);

  const handleDelete = (id: string) => {
    const confirmed = window.confirm(`Delete this ${config.title.toLowerCase()} record?`);
    if (!confirmed) return;

    startTransition(async () => {
      const previous = items;
      setItems((current) => current.filter((item) => String(item.id) !== id));
      const result = await deleteMarketingLoyaltyRecordAction({ entityKey: config.key, id });
      if (result.error) {
        setItems(previous);
        toast.error(result.error.detail);
        return;
      }
      toast.success("Record deleted.");
    });
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="border-b bg-white/80">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="text-2xl font-semibold tracking-tight">{config.title}</CardTitle>
            <p className="mt-1 max-w-3xl text-sm text-muted-foreground">{config.description}</p>
          </div>
          {canCreate && (
            <Button asChild>
              <Link href={`${config.routeBase}/add`}>
                <Plus className="mr-2 h-4 w-4" />
                Add new
              </Link>
            </Button>
          )}
        </div>
        <form className="mt-5 flex flex-col gap-3 md:flex-row" action={config.routeBase}>
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input name="q" defaultValue={q} placeholder="Search by customer, code, title, status..." className="pl-9" />
          </div>
          <Button type="submit" variant="outline">Search</Button>
          {q && (
            <Button asChild type="button" variant="ghost">
              <Link href={config.routeBase}>Clear</Link>
            </Button>
          )}
        </form>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse text-sm">
            <thead>
              <tr className="border-b bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                {config.listColumns.map((column) => (
                  <th key={column.key} className={`px-4 py-3 font-medium ${column.className || ""}`}>{column.label}</th>
                ))}
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={config.listColumns.length + 1} className="px-4 py-16 text-center text-muted-foreground">
                    No records found.
                  </td>
                </tr>
              ) : (
                items.map((item) => {
                  const id = String(item.id);
                  return (
                    <tr key={id} className="border-b transition-colors hover:bg-muted/30">
                      {config.listColumns.map((column) => (
                        <td key={column.key} className={`px-4 py-3 align-middle ${column.className || ""}`}>
                          <CellValue value={item[column.key]} type={column.type} locale={locale} />
                        </td>
                      ))}
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          {canEdit ? (
                            <Button asChild size="sm" variant="ghost">
                              <Link href={`${config.routeBase}/${id}/update`}>
                                <Edit className="h-4 w-4" />
                              </Link>
                            </Button>
                          ) : (
                            <Button size="sm" variant="ghost" disabled title="Append-only record">
                              <Eye className="h-4 w-4" />
                            </Button>
                          )}
                          {canDelete && (
                            <Button size="sm" variant="ghost" disabled={isPending} onClick={() => handleDelete(id)} className="text-destructive hover:text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="flex flex-col gap-3 border-t px-4 py-4 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
          <span>
            Showing page {data.page} of {data.pageCount} · {data.totalCount} total records
          </span>
          {data.pageCount > 1 && (
            <div className="flex flex-wrap gap-2">
              {pageLinks.map((link) => (
                <Button key={link.page} asChild size="sm" variant={link.page === data.page ? "default" : "outline"}>
                  <Link href={link.href}>{link.page}</Link>
                </Button>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function CellValue({ value, type, locale }: { value: unknown; type?: string; locale?: string }) {
  if (value === undefined || value === null || value === "") return <span className="text-muted-foreground">—</span>;

  if (type === "boolean") {
    const active = Boolean(value);
    return (
      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${active ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20" : "bg-gray-50 text-gray-600 ring-1 ring-gray-500/20"}`}>
        {active ? "Yes" : "No"}
      </span>
    );
  }

  if (type === "badge") {
    return <span className="inline-flex max-w-[220px] rounded-full bg-muted px-2 py-1 text-xs font-medium text-foreground">{String(value)}</span>;
  }


  if (type === "richtext") {
    const content = typeof value === "string" ? value : JSON.stringify(value);
    return hasLexicalContent(content) ? (
      <LexicalRenderer content={content} className="line-clamp-2 max-w-[360px] text-sm text-muted-foreground" />
    ) : (
      <span className="line-clamp-2 max-w-[360px]">{content}</span>
    );
  }

  if (type === "localized-richtext") {
    const localized = pickLocalizedValue(value, locale);
    return hasLexicalContent(localized) ? (
      <LexicalRenderer content={localized} className="line-clamp-2 max-w-[360px] text-sm text-muted-foreground" />
    ) : (
      <span className="line-clamp-2 max-w-[360px]">{localized}</span>
    );
  }

  if (type === "datetime") {
    const date = new Date(String(value));
    return Number.isNaN(date.getTime()) ? <span>{String(value)}</span> : <span>{date.toLocaleString()}</span>;
  }

  if (type === "percent") {
    return <span>{Number(value).toLocaleString()}%</span>;
  }

  if (type === "currency") {
    return <span>{Number(value).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</span>;
  }

  if (type === "number") {
    return <span>{Number(value).toLocaleString()}</span>;
  }

  if (typeof value === "object") {
    return <code className="line-clamp-2 text-xs text-muted-foreground">{JSON.stringify(value)}</code>;
  }

  return <span className="line-clamp-2 max-w-[320px]">{String(value)}</span>;
}


function pickLocalizedValue(value: unknown, locale = "en") {
  if (!value) return "";
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (parsed && typeof parsed === "object") return pickLocalizedValue(parsed, locale);
    } catch {
      return value;
    }
    return value;
  }

  if (typeof value !== "object") return String(value);

  const record = value as Record<string, unknown>;
  const normalized = locale.replace(/_/g, "-").toLowerCase();
  const base = normalized.split("-")[0];
  const alias: Record<string, string> = {
    ar: "ar-SA",
    de: "de-DE",
    en: "en-US",
    es: "es-ES",
    fa: "fa-IR",
    fr: "fr-FR",
    ku: "ku-KU",
    tr: "tr-TR",
  };
  const candidates = [
    locale,
    alias[normalized],
    alias[base],
    ...Object.keys(record).filter((key) => key.toLowerCase() === normalized),
    ...Object.keys(record).filter((key) => key.toLowerCase().split("-")[0] === base),
    ...Object.keys(record),
  ].filter(Boolean) as string[];

  for (const key of candidates) {
    const candidate = record[key];
    if (typeof candidate === "string" && candidate.trim()) return candidate;
  }

  return "";
}
