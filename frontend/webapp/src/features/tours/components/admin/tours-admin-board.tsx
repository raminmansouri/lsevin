"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { TOURS_TRANSLATION_KEY, type TourDepartureAdminRow, type TourDeparturesAdminPageData } from "../../types";
import {
  EMPTY_TOUR_DEPARTURE_FORM,
  tourDepartureToFormState,
  TourDepartureFormDialog,
  type TourDepartureFormState,
} from "./tour-departure-form-dialog";
import { TourDeparturesTable } from "./tour-departures-table";

/** Everything on the page is driven from one server read -- mirrors
 * transfer-routes-admin-board.tsx / gym-memberships-admin-board.tsx. The only state
 * owned here is the create/edit dialog's open flag and form values. */
export function ToursAdminBoard({ data }: { data: TourDeparturesAdminPageData }) {
  const t = useTranslations(TOURS_TRANSLATION_KEY);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<TourDepartureFormState>(EMPTY_TOUR_DEPARTURE_FORM);

  const openCreate = () => {
    setForm(EMPTY_TOUR_DEPARTURE_FORM);
    setOpen(true);
  };

  const openEdit = (row: TourDepartureAdminRow) => {
    setForm(tourDepartureToFormState(row));
    setOpen(true);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle>{t("admin.departures.title")}</CardTitle>
        <Button type="button" size="sm" onClick={openCreate}>
          <Plus className="size-4" />
          {t("admin.departures.create")}
        </Button>
      </CardHeader>
      <CardContent>
        <TourDeparturesTable departures={data.departures} onEdit={openEdit} />
      </CardContent>

      <TourDepartureFormDialog form={form} setForm={setForm} open={open} onOpenChange={setOpen} />
    </Card>
  );
}
