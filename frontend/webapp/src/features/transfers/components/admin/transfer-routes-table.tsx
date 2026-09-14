"use client";

import { ArrowRight, Pencil, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
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

import { deleteTransferRouteAction } from "../../server/actions";
import { TRANSFERS_TRANSLATION_KEY, type TransferRouteAdminRow } from "../../types";

export function TransferRoutesTable({
  routes,
  onEdit,
}: {
  routes: TransferRouteAdminRow[];
  onEdit: (route: TransferRouteAdminRow) => void;
}) {
  const t = useTranslations(TRANSFERS_TRANSLATION_KEY);
  const router = useRouter();

  const remove = async (route: TransferRouteAdminRow) => {
    if (!window.confirm(t("admin.routes.confirmDelete"))) return;

    const result = await deleteTransferRouteAction({ id: route.id });
    if (result.ok) {
      toast.success(t("admin.routes.deleted"));
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
            <TableHead className="text-start">{t("admin.routes.provider")}</TableHead>
            <TableHead className="text-start">{t("admin.routes.route")}</TableHead>
            <TableHead className="text-start">{t("admin.routes.vehicleType")}</TableHead>
            <TableHead className="text-start">{t("admin.routes.price")}</TableHead>
            <TableHead className="text-start">{t("admin.routes.isActive")}</TableHead>
            <TableHead className="text-end">{t("admin.routes.edit")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {routes.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="text-muted-foreground py-10 text-center">
                {t("admin.routes.empty")}
              </TableCell>
            </TableRow>
          )}
          {routes.map((route) => (
            <TableRow key={route.id}>
              <TableCell className="font-medium">{route.providerName}</TableCell>
              <TableCell>
                <div className="flex items-center gap-1.5 text-sm">
                  <span>{route.from}</span>
                  <ArrowRight className="text-muted-foreground size-3.5 rtl:rotate-180" />
                  <span>{route.to}</span>
                </div>
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">{route.vehicleType || "—"}</TableCell>
              <TableCell dir="ltr" className="tabular-nums">
                {route.price.toLocaleString()} {route.currency}
              </TableCell>
              <TableCell>
                <Badge variant={route.isActive ? "outline" : "secondary"}>
                  {route.isActive ? t("admin.routes.isActive") : "—"}
                </Badge>
              </TableCell>
              <TableCell className="text-end">
                <div className="flex justify-end gap-1.5">
                  <Button type="button" size="sm" variant="outline" onClick={() => onEdit(route)}>
                    <Pencil className="size-4" />
                  </Button>
                  <Button type="button" size="sm" variant="outline" onClick={() => remove(route)}>
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
