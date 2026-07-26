"use client";

import { IconButton } from "@/app/[locale]/n/app/design-system/mobile-components";
import { useNotificationCount } from "@/features/notification/api/client/get-notification-count";
import { Link } from "@/i18n/navigation";
import { Bell } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

type Props = {
  /** `glass` when the bar sits on the dark pine app bar. */
  variant?: "default" | "glass";
};

export default function NotificationsBar({ variant = "default" }: Props) {
  const locale = useLocale();
  const { data } = useNotificationCount(locale);
  const t = useTranslations("Home.appBar");

  const unreadCount = Number(data?.count ?? data?.unreadCount ?? 0);
  const badge = unreadCount > 99 ? "99+" : unreadCount > 0 ? unreadCount : undefined;

  return (
    <Link href="/n/app/mobile/notifications" aria-label={t("notifications")}>
      <IconButton icon={<Bell size={20} />} badge={badge} variant={variant} />
    </Link>
  );
}
