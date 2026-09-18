"use client";

import { useLocale, useTranslations } from "next-intl";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/formatters";

import { GYM_MEMBERSHIPS_TRANSLATION_KEY, type GymMembership } from "../../types";
import { GymMembershipMonthStatusPill } from "./gym-membership-month-status-pill";

/** Renders the signed-in customer's own memberships in their own locale -- month
 * labels come from `formatDate`, the same helper the rest of the account surface
 * uses to resolve Jalali/Hijri/Gregorian per viewer. */
export function GymMembershipsList({ memberships }: { memberships: GymMembership[] }) {
  const t = useTranslations(GYM_MEMBERSHIPS_TRANSLATION_KEY);
  const locale = useLocale();

  if (memberships.length === 0) {
    return <p className="text-muted-foreground py-8 text-sm">{t("customer.empty")}</p>;
  }

  const monthLabel = (periodMonth: string) =>
    formatDate(periodMonth, locale, { year: "numeric", month: "long" });

  return (
    <div className="space-y-4">
      {memberships.map((membership) => (
        <Card key={membership.id}>
          <CardHeader>
            <CardTitle className="flex flex-wrap items-center gap-2 text-base">
              {membership.providerName}
              <span className="text-muted-foreground font-normal">· {membership.planName}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y">
              {membership.months.map((month) => (
                <li key={month.id} className="py-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm font-medium">{monthLabel(month.periodMonth)}</span>
                    <div className="flex items-center gap-2">
                      <span dir="ltr" className="text-muted-foreground text-xs tabular-nums">
                        {month.amount.toLocaleString()} {month.currency}
                      </span>
                      <GymMembershipMonthStatusPill month={month} />
                    </div>
                  </div>
                  {month.status === "rejected" && month.reviewNote ? (
                    <p className="text-destructive mt-1 text-xs">
                      <span className="font-medium">{t("customer.month.reviewNoteLabel")}:</span> {month.reviewNote}
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
