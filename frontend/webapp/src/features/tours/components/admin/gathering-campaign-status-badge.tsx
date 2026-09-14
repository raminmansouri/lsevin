import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";

import { TOURS_TRANSLATION_KEY, type GatheringStatus } from "../../types";

export function GatheringCampaignStatusBadge({ status }: { status: GatheringStatus }) {
  const t = useTranslations(TOURS_TRANSLATION_KEY);

  const className =
    status === "confirmed"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-200"
      : status === "cancelled"
        ? "border-destructive/40 bg-destructive/10 text-destructive dark:bg-destructive/20"
        : "border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/15 dark:text-amber-100";

  return <Badge variant="outline" className={className}>{t(`admin.gathering.status.${status}`)}</Badge>;
}
