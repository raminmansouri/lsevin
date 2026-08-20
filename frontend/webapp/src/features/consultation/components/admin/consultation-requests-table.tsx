"use client";

import { useTransition } from "react";
import { AlertTriangle, ChevronLeft, ChevronRight } from "lucide-react";
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
  CONSULTATION_TRANSLATION_KEY,
  type ConsultationListResult,
  type ConsultationRequestListItem,
} from "../../types";
import { ConsultationStatusBadge } from "./consultation-status-badge";

function SmsSummary({ row }: { row: ConsultationRequestListItem }) {
  const t = useTranslations(CONSULTATION_TRANSLATION_KEY);
  const { notificationsSent, notificationsFailed, notificationsSkipped } = row;

  if (!notificationsSent && !notificationsFailed && !notificationsSkipped) {
    return <span className="text-muted-foreground">—</span>;
  }

  return (
    <div className="flex flex-wrap items-center gap-1">
      {notificationsFailed > 0 && (
        <Badge variant="destructive" className="gap-1 tabular-nums">
          <AlertTriangle className="size-3" />
          {t("admin.notification.failed")} {notificationsFailed}
        </Badge>
      )}
      {notificationsSent > 0 && (
        <Badge
          variant="outline"
          className="border-emerald-200 bg-emerald-50 tabular-nums text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-200"
        >
          {t("admin.notification.sent")} {notificationsSent}
        </Badge>
      )}
      {notificationsSkipped > 0 && (
        <Badge variant="secondary" className="tabular-nums">
          {t("admin.notification.skipped")} {notificationsSkipped}
        </Badge>
      )}
    </div>
  );
}

export function ConsultationRequestsTable({
  list,
  onView,
}: {
  list: ConsultationListResult;
  onView: (row: ConsultationRequestListItem) => void;
}) {
  const t = useTranslations(CONSULTATION_TRANSLATION_KEY);
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

  // The chevron has to point at the edge the previous page sits on, which flips
  // with the writing direction.
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
              <TableHead className="text-start">{t("admin.table.name")}</TableHead>
              <TableHead className="text-start">{t("admin.table.phone")}</TableHead>
              <TableHead className="text-start">{t("admin.table.topic")}</TableHead>
              <TableHead className="text-start">{t("admin.table.urgency")}</TableHead>
              <TableHead className="text-start">
                {t("admin.table.preferredTime")}
              </TableHead>
              <TableHead className="text-start">{t("admin.table.status")}</TableHead>
              <TableHead className="text-start">{t("admin.table.sms")}</TableHead>
              <TableHead className="text-start">
                {t("admin.table.createdAt")}
              </TableHead>
              <TableHead className="text-end">{t("admin.table.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.items.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={9}
                  className="text-muted-foreground py-10 text-center"
                >
                  {t("admin.empty")}
                </TableCell>
              </TableRow>
            )}

            {list.items.map((row) => (
              <TableRow
                key={row.id}
                className={cn(
                  row.notificationsFailed > 0 && "bg-destructive/5 dark:bg-destructive/10"
                )}
              >
                <TableCell className="font-medium">
                  {row.fullName || "—"}
                </TableCell>
                <TableCell>
                  <span dir="ltr" className="font-mono text-sm">
                    {row.phone}
                  </span>
                </TableCell>
                <TableCell className="max-w-[220px] truncate">
                  {row.categoryName || "—"}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={row.urgency === "urgent" ? "destructive" : "secondary"}
                  >
                    {t(`urgency.${row.urgency}`)}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm">
                  {t(`contactTime.${row.preferredContactTime}`)}
                </TableCell>
                <TableCell>
                  <ConsultationStatusBadge status={row.status} />
                </TableCell>
                <TableCell>
                  <SmsSummary row={row} />
                </TableCell>
                <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                  {dateTime(row.createdAt)}
                </TableCell>
                <TableCell className="text-end">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => onView(row)}
                  >
                    {t("admin.table.view")}
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
