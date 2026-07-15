import { useTranslations } from "next-intl";
import { Edit, Plus, Trash2 } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

import { deleteSpecialPackageAction } from "../server/actions";
import type { SpecialPackageAdminRow } from "../server/repository";

function pickTranslation(value?: Record<string, string>) {
  return value?.["fa-IR"] || value?.["en-US"] || Object.values(value || {}).find(Boolean) || "—";
}

function formatPrice(row: SpecialPackageAdminRow) {
  if (row.priceAmount == null) return "—";
  const amount = row.priceAmount.toLocaleString();
  return row.currencyCode ? `${amount} ${row.currencyCode}` : amount;
}

export function SpecialPackagesTable({ rows }: { rows: SpecialPackageAdminRow[] }) {
  const t = useTranslations("SpecialPackagesAdmin");

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950">{t("listTitle")}</h1>
          <p className="mt-1 text-sm text-slate-500">{t("listDescription")}</p>
        </div>
        <Button asChild className="gap-2 rounded-2xl">
          <Link href="/admin/special-packages/add">
            <Plus className="h-4 w-4" />
            {t("addButton")}
          </Link>
        </Button>
      </div>

      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>{t("listTitle")}</CardTitle>
          <CardDescription>{t("countLabel", { count: rows.length })}</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">{t("columnOrder")}</TableHead>
                  <TableHead>{t("columnTitle")}</TableHead>
                  <TableHead>{t("columnPrice")}</TableHead>
                  <TableHead>{t("columnStatus")}</TableHead>
                  <TableHead className="text-end">{t("columnActions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">{row.displayOrder}</TableCell>
                    <TableCell>
                      <div className="max-w-[320px]">
                        <div className="line-clamp-1 font-semibold text-slate-950">
                          {pickTranslation(row.titleTranslations)}
                        </div>
                        <div className="mt-1 line-clamp-1 text-xs text-slate-500">
                          {pickTranslation(row.subtitleTranslations)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{formatPrice(row)}</TableCell>
                    <TableCell>
                      <Badge className="rounded-full" variant={row.isActive ? "default" : "outline"}>
                        {row.isActive ? t("statusActive") : t("statusHidden")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button asChild size="icon" variant="ghost" title={t("edit")}>
                          <Link href={`/admin/special-packages/${row.id}/update`}>
                            <Edit className="h-4 w-4" />
                          </Link>
                        </Button>
                        <form action={deleteSpecialPackageAction.bind(null, row.id)}>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="text-red-600 hover:text-red-700"
                            title={t("delete")}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </form>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {!rows.length && (
                  <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center text-sm text-slate-500">
                      {t("emptyList")}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
