"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { TRANSFERS_TRANSLATION_KEY, type TransferRouteAdminRow, type TransferRoutesAdminPageData } from "../../types";
import {
  EMPTY_TRANSFER_ROUTE_FORM,
  transferRouteToFormState,
  TransferRouteFormDialog,
  type TransferRouteFormState,
} from "./transfer-route-form-dialog";
import { TransferRoutesTable } from "./transfer-routes-table";

/** Everything on the page is driven from one server read -- mirrors
 * gym-memberships-admin-board.tsx. The only state owned here is the
 * create/edit dialog's open flag and form values. */
export function TransferRoutesAdminBoard({ data }: { data: TransferRoutesAdminPageData }) {
  const t = useTranslations(TRANSFERS_TRANSLATION_KEY);
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<TransferRouteFormState>(EMPTY_TRANSFER_ROUTE_FORM);

  const openCreate = () => {
    setForm(EMPTY_TRANSFER_ROUTE_FORM);
    setOpen(true);
  };

  const openEdit = (route: TransferRouteAdminRow) => {
    setForm(transferRouteToFormState(route, locale));
    setOpen(true);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle>{t("admin.routes.title")}</CardTitle>
        <Button type="button" size="sm" onClick={openCreate}>
          <Plus className="size-4" />
          {t("admin.routes.create")}
        </Button>
      </CardHeader>
      <CardContent>
        <TransferRoutesTable routes={data.routes} onEdit={openEdit} />
      </CardContent>

      <TransferRouteFormDialog form={form} setForm={setForm} open={open} onOpenChange={setOpen} />
    </Card>
  );
}
