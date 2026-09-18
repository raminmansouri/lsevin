"use client";

import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { TOURS_TRANSLATION_KEY, type TourGatheringParticipant } from "../../types";

type Participation = TourGatheringParticipant & {
  providerName: string;
  serviceName: string;
  campaignStatus: "gathering" | "confirmed" | "cancelled";
};

export function MyGatheringParticipationsList({ participations }: { participations: Participation[] }) {
  const t = useTranslations(TOURS_TRANSLATION_KEY);

  if (participations.length === 0) {
    return <p className="text-muted-foreground py-8 text-sm">{t("customer.myParticipationsEmpty")}</p>;
  }

  const statusClassName = (status: Participation["status"]) =>
    status === "approved"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-200"
      : status === "rejected"
        ? "border-destructive/40 bg-destructive/10 text-destructive dark:bg-destructive/20"
        : "border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/15 dark:text-amber-100";

  return (
    <div className="space-y-3">
      {participations.map((row) => (
        <Card key={row.id}>
          <CardHeader>
            <CardTitle className="flex flex-wrap items-center gap-2 text-base">
              {row.providerName}
              <span className="text-muted-foreground font-normal">· {row.serviceName}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className={statusClassName(row.status)}>
                {t(`admin.gathering.participantStatus.${row.status}`)}
              </Badge>
              {row.campaignStatus === "confirmed" ? (
                <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-200">
                  {t("customer.tourConfirmed")}
                </Badge>
              ) : null}
              {row.campaignStatus === "cancelled" ? (
                <Badge variant="secondary">{t("customer.gatheringCancelled")}</Badge>
              ) : null}
            </div>
            <p dir="ltr" className="text-muted-foreground text-sm tabular-nums">
              {row.amount.toLocaleString()} {row.currency}
            </p>
            {row.status === "rejected" && row.reviewNote ? (
              <p className="text-destructive text-xs">
                <span className="font-medium">{t("customer.reviewNoteLabel")}:</span> {row.reviewNote}
              </p>
            ) : null}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
