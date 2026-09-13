import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";

import { GYM_MEMBERSHIPS_TRANSLATION_KEY, type GymMembershipMonth } from "../../types";

/** Small status pill for a single paid/pending/due month, shared by the "my
 * memberships" list and the subscribe dialog's month picker. */
export function GymMembershipMonthStatusPill({ month }: { month: GymMembershipMonth }) {
  const t = useTranslations(GYM_MEMBERSHIPS_TRANSLATION_KEY);

  const label = month.isDue && month.status !== "approved" ? t("customer.month.due") : t(`customer.month.${month.status}`);

  const className =
    month.status === "approved"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-200"
      : month.status === "rejected"
        ? "border-destructive/40 bg-destructive/10 text-destructive dark:bg-destructive/20"
        : month.isDue
          ? "border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/15 dark:text-amber-200"
          : "border-muted bg-muted text-muted-foreground";

  return (
    <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium", className)}>
      {label}
    </span>
  );
}
