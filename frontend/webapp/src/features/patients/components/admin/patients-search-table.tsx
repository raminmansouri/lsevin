"use client";

import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Link } from "@/i18n/navigation";

import { PATIENTS_TRANSLATION_KEY } from "../../types";
import type { PatientSearchResultRow } from "../../types";

function formatDate(value?: string | null) {
  if (!value) return "-";
  try {
    return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(value));
  } catch {
    return value;
  }
}

export function PatientsSearchTable({ results }: { results: PatientSearchResultRow[] }) {
  const t = useTranslations(PATIENTS_TRANSLATION_KEY);

  // Exact matches (public id / identifier / contact) surfaced above weak name
  // matches, per spec V1.4 -- searchPatients() already returns them in this
  // priority order, this just groups the badge variant with it.
  const matchTypeVariant: Record<PatientSearchResultRow["matchType"], "default" | "outline" | "secondary"> = {
    public_id: "default",
    identifier: "default",
    contact: "outline",
    name: "secondary",
  };

  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-start">{t("admin.fields.name")}</TableHead>
            <TableHead className="text-start">{t("admin.fields.publicId")}</TableHead>
            <TableHead className="text-start">{t("admin.fields.birthDate")}</TableHead>
            <TableHead className="text-start">{t("admin.search.matchType")}</TableHead>
            <TableHead className="text-start">{t("admin.fields.status")}</TableHead>
            <TableHead className="text-end" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {results.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="text-muted-foreground py-10 text-center">
                {t("admin.search.empty")}
              </TableCell>
            </TableRow>
          )}
          {results.map((patient) => (
            <TableRow key={patient.id}>
              <TableCell className="font-medium">
                {patient.firstName} {patient.lastName}
                {patient.preferredName ? (
                  <span className="text-muted-foreground ms-1 text-xs">({patient.preferredName})</span>
                ) : null}
              </TableCell>
              <TableCell dir="ltr" className="text-muted-foreground text-sm">
                {patient.publicId}
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">{formatDate(patient.birthDate)}</TableCell>
              <TableCell>
                <Badge variant={matchTypeVariant[patient.matchType]}>{t(`admin.search.matchTypes.${patient.matchType}`)}</Badge>
              </TableCell>
              <TableCell>
                <Badge variant={patient.status === "active" ? "outline" : "secondary"}>
                  {t(`admin.status.${patient.status}`)}
                </Badge>
              </TableCell>
              <TableCell className="text-end">
                <Link href={`/admin/patients/${patient.id}`} className="text-primary text-sm font-medium hover:underline">
                  {t("admin.search.open")}
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
