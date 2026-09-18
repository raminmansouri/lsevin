import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";

import { TOURS_TRANSLATION_KEY, type GatheringParticipantStatus } from "../../types";

export function GatheringParticipantStatusBadge({ status }: { status: GatheringParticipantStatus }) {
  const t = useTranslations(TOURS_TRANSLATION_KEY);

  const variant = status === "approved" ? "outline" : status === "rejected" ? "destructive" : "secondary";
  const className =
    status === "approved"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-200"
      : undefined;

  return (
    <Badge variant={variant} className={className}>
      {t(`admin.gathering.participantStatus.${status}`)}
    </Badge>
  );
}
