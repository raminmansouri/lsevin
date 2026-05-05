"use client";

import { IconButton } from "@/app/[locale]/n/app/design-system/mobile-components";
import { useNotificationCount } from "@/features/notification/api/client/get-notification-count";
import { Link } from "@/i18n/navigation";
import { Bell } from "lucide-react";
import { useLocale } from "next-intl";

export default function NotificationsBar() {
  const locale = useLocale();
  const { data } = useNotificationCount(locale);

  const unreadCount = Number(data?.count ?? data?.unreadCount ?? 0);
  const badge = unreadCount > 99 ? "99+" : unreadCount > 0 ? unreadCount : undefined;

  return (
    <Link href="/n/app/mobile/notifications" aria-label="Open notifications">
      <IconButton icon={<Bell size={22} />} badge={badge} />
    </Link>
  );
}
