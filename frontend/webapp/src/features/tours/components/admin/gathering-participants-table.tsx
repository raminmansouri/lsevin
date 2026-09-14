"use client";

import { useLocale, useTranslations } from "next-intl";

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

import { TOURS_TRANSLATION_KEY, type TourGatheringParticipantAdminRow } from "../../types";
import { GatheringParticipantStatusBadge } from "./gathering-participant-status-badge";

export function GatheringParticipantsTable({
  participants,
  onReview,
}: {
  participants: TourGatheringParticipantAdminRow[];
  onReview: (row: TourGatheringParticipantAdminRow) => void;
}) {
  const t = useTranslations(TOURS_TRANSLATION_KEY);
  const locale = useLocale();

  const dateTime = (value: string | null) =>
    formatDate(value, locale, { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-start">{t("admin.departures.tour")}</TableHead>
            <TableHead className="text-start">{t("admin.departures.provider")}</TableHead>
            <TableHead className="text-start">{t("admin.gathering.amount")}</TableHead>
            <TableHead className="text-start">{t("admin.gathering.reference")}</TableHead>
            <TableHead className="text-start">{t("admin.gathering.status.label")}</TableHead>
            <TableHead className="text-start">{t("admin.gathering.createdAt")}</TableHead>
            <TableHead className="text-end">{t("admin.departures.edit")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {participants.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="text-muted-foreground py-10 text-center">
                {t("admin.gathering.participantsEmpty")}
              </TableCell>
            </TableRow>
          )}
          {participants.map((row) => (
            <TableRow key={row.id}>
              <TableCell className="font-medium">{row.serviceName}</TableCell>
              <TableCell className="text-muted-foreground text-sm">{row.providerName}</TableCell>
              <TableCell dir="ltr" className="tabular-nums">
                {row.amount.toLocaleString()} {row.currency}
              </TableCell>
              <TableCell className="max-w-[160px] truncate font-mono text-xs">{row.paymentReference || "—"}</TableCell>
              <TableCell>
                <GatheringParticipantStatusBadge status={row.status} />
              </TableCell>
              <TableCell className="text-muted-foreground text-sm whitespace-nowrap">{dateTime(row.createdAt)}</TableCell>
              <TableCell className="text-end">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => onReview(row)}
                  disabled={row.status !== "pending_review"}
                >
                  {t("admin.gathering.review")}
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
