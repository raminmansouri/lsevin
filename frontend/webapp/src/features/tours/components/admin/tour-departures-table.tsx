"use client";

import { Pencil, Trash2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/formatters";

import { deleteTourDepartureAction } from "../../server/actions";
import { TOURS_TRANSLATION_KEY, type TourDepartureAdminRow } from "../../types";

export function TourDeparturesTable({
  departures,
  onEdit,
}: {
  departures: TourDepartureAdminRow[];
  onEdit: (row: TourDepartureAdminRow) => void;
}) {
  const t = useTranslations(TOURS_TRANSLATION_KEY);
  const locale = useLocale();
  const router = useRouter();

  const dateLabel = (value: string) => formatDate(value, locale, { year: "numeric", month: "short", day: "numeric" });

  const remove = async (row: TourDepartureAdminRow) => {
    if (!window.confirm(t("admin.departures.confirmDelete"))) return;

    const result = await deleteTourDepartureAction({ id: row.id });
    if (result.ok) {
      toast.success(t("admin.departures.deleted"));
      router.refresh();
      return;
    }
    toast.error(result.error || t("admin.errors.generic"));
  };

  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-start">{t("admin.departures.tour")}</TableHead>
            <TableHead className="text-start">{t("admin.departures.provider")}</TableHead>
            <TableHead className="text-start">{t("admin.departures.dates")}</TableHead>
            <TableHead className="text-start">{t("admin.departures.booked")}</TableHead>
            <TableHead className="text-start">{t("admin.departures.isActive")}</TableHead>
            <TableHead className="text-end">{t("admin.departures.edit")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {departures.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="text-muted-foreground py-10 text-center">
                {t("admin.departures.empty")}
              </TableCell>
            </TableRow>
          )}
          {departures.map((row) => (
            <TableRow key={row.id}>
              <TableCell className="font-medium">{row.serviceName}</TableCell>
              <TableCell className="text-muted-foreground text-sm">{row.providerName}</TableCell>
              <TableCell dir="ltr" className="text-sm tabular-nums">
                {dateLabel(row.startsOn)} – {dateLabel(row.endsOn)}
              </TableCell>
              <TableCell dir="ltr" className="tabular-nums">
                {row.bookedCount} / {row.capacity}
              </TableCell>
              <TableCell>
                <Badge variant={row.isActive ? "outline" : "secondary"}>
                  {row.isActive ? t("admin.departures.isActive") : "—"}
                </Badge>
              </TableCell>
              <TableCell className="text-end">
                <div className="flex justify-end gap-1.5">
                  <Button type="button" size="sm" variant="outline" onClick={() => onEdit(row)}>
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => remove(row)}
                    disabled={row.bookedCount > 0}
                    title={row.bookedCount > 0 ? t("admin.departures.cannotDeleteWithBookings") : undefined}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
