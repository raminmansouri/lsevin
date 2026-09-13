"use client";

import { useTransition } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

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
import useDirection from "@/hooks/use-direction";
import { formatDate } from "@/lib/formatters";
import { cn } from "@/lib/utils";

import {
  GYM_MEMBERSHIPS_TRANSLATION_KEY,
  type GymMembershipMonthAdminRow,
  type GymMembershipMonthListResult,
} from "../../types";
import { GymMembershipMonthStatusBadge } from "./gym-membership-month-status-badge";

export function GymMembershipMonthsTable({
  list,
  onReview,
}: {
  list: GymMembershipMonthListResult;
  onReview: (row: GymMembershipMonthAdminRow) => void;
}) {
  const t = useTranslations(GYM_MEMBERSHIPS_TRANSLATION_KEY);
  const locale = useLocale();
  const { isRtl } = useDirection();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const goToPage = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (page <= 1) params.delete("pageNumber");
    else params.set("pageNumber", String(page));

    startTransition(() => {
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    });
  };

  const PreviousIcon = isRtl ? ChevronRight : ChevronLeft;
  const NextIcon = isRtl ? ChevronLeft : ChevronRight;

  const dateTime = (value: string | null) =>
    formatDate(value, locale, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div className="space-y-3">
      <div className="bg-card overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-start">{t("admin.months.table.gym")}</TableHead>
              <TableHead className="text-start">{t("admin.months.table.plan")}</TableHead>
              <TableHead className="text-start">{t("admin.months.table.period")}</TableHead>
              <TableHead className="text-start">{t("admin.months.table.amount")}</TableHead>
              <TableHead className="text-start">{t("admin.months.table.reference")}</TableHead>
              <TableHead className="text-start">{t("admin.months.table.status")}</TableHead>
              <TableHead className="text-start">{t("admin.months.table.createdAt")}</TableHead>
              <TableHead className="text-end">{t("admin.months.table.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.items.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-muted-foreground py-10 text-center">
                  {t("admin.months.empty")}
                </TableCell>
              </TableRow>
            )}

            {list.items.map((row) => (
              <TableRow
                key={row.id}
                className={cn(row.isDue && row.status !== "approved" && "bg-amber-50 dark:bg-amber-500/10")}
              >
                <TableCell className="font-medium">{row.providerName}</TableCell>
                <TableCell>{row.planName}</TableCell>
                <TableCell dir="ltr" className="tabular-nums">
                  {row.periodMonth.slice(0, 7)}
                </TableCell>
                <TableCell dir="ltr" className="tabular-nums">
                  {row.amount.toLocaleString()} {row.currency}
                </TableCell>
                <TableCell className="max-w-[160px] truncate font-mono text-xs">
                  {row.paymentReference || "—"}
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap items-center gap-1">
                    <GymMembershipMonthStatusBadge status={row.status} />
                    {row.isDue && row.status !== "approved" ? (
                      <Badge variant="outline" className="border-amber-300 text-amber-800 dark:text-amber-200">
                        {t("customer.month.due")}
                      </Badge>
                    ) : null}
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                  {dateTime(row.createdAt)}
                </TableCell>
                <TableCell className="text-end">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => onReview(row)}
                    disabled={row.status !== "pending_review"}
                  >
                    {t("admin.months.table.review")}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {list.totalPages > 1 && (
        <div className="flex items-center justify-between gap-3">
          <p className="text-muted-foreground text-sm tabular-nums">
            {list.pageNumber} / {list.totalPages}
          </p>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="icon"
              variant="outline"
              aria-label={`${list.pageNumber - 1}`}
              disabled={!list.hasPrevious || isPending}
              onClick={() => goToPage(list.pageNumber - 1)}
            >
              <PreviousIcon className="size-4" />
            </Button>
            <Button
              type="button"
              size="icon"
              variant="outline"
              aria-label={`${list.pageNumber + 1}`}
              disabled={!list.hasNext || isPending}
              onClick={() => goToPage(list.pageNumber + 1)}
            >
              <NextIcon className="size-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
