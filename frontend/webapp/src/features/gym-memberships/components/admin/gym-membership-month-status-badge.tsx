import { Badge } from "@/components/ui/badge";
import { useTranslations } from "next-intl";

import { GYM_MEMBERSHIPS_TRANSLATION_KEY, type MembershipMonthStatus } from "../../types";

export function GymMembershipMonthStatusBadge({ status }: { status: MembershipMonthStatus }) {
  const t = useTranslations(GYM_MEMBERSHIPS_TRANSLATION_KEY);

  const variant =
    status === "approved" ? "outline" : status === "rejected" ? "destructive" : "secondary";

  const className =
    status === "approved"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-200"
      : undefined;

  return (
    <Badge variant={variant} className={className}>
      {t(`admin.months.status.${status}`)}
    </Badge>
  );
}
