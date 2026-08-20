"use client";

import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

import { CONSULTATION_TRANSLATION_KEY, type ConsultationStatus } from "../../types";

/**
 * Hand-written colour pairs rather than the Badge variants: the five statuses need
 * to be told apart at a glance in a dense table, and the shadcn variants only offer
 * three distinguishable fills.
 */
const STATUS_CLASSES: Record<ConsultationStatus, string> = {
  new: "border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-500/30 dark:bg-sky-500/15 dark:text-sky-200",
  in_progress:
    "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/15 dark:text-amber-200",
  contacted:
    "border-violet-200 bg-violet-50 text-violet-800 dark:border-violet-500/30 dark:bg-violet-500/15 dark:text-violet-200",
  done: "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-200",
  rejected:
    "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-500/30 dark:bg-rose-500/15 dark:text-rose-200",
};

export function ConsultationStatusBadge({
  status,
  className,
}: {
  status: ConsultationStatus;
  className?: string;
}) {
  const t = useTranslations(CONSULTATION_TRANSLATION_KEY);

  return (
    <Badge
      variant="outline"
      className={cn("font-medium", STATUS_CLASSES[status], className)}
    >
      {t(`admin.status.${status}`)}
    </Badge>
  );
}
