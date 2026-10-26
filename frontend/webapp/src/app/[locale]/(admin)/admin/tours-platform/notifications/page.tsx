import { getTranslations } from "next-intl/server";

import { PageHeader } from "@/components/page/page-header";
import { isCalendarId } from "@/features/tours/domain/calendar";
import { notificationPreviews } from "@/features/tours/server/admin/notification-preview";
import { adminPageActor, sp } from "@/features/tours/server/admin/page-actor";
import { NotificationPreviews } from "@/features/tours/ui/admin/notification-previews";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata() {
  const t = await getTranslations("TourAdmin.notifications");
  return { title: t("title") };
}

export default async function NotificationsPage({ searchParams }: Props) {
  const actor = await adminPageActor();
  const q = await searchParams;
  const t = await getTranslations("TourAdmin.notifications");
  const cal = sp(q, "calendar");
  const data = await notificationPreviews(actor, { calendar: isCalendarId(cal) ? cal : undefined });
  return (
    <div className="space-y-5">
      <PageHeader title={t("title")} description={t("description")} />
      <NotificationPreviews data={data} selected={isCalendarId(cal) ? cal : ""} />
    </div>
  );
}
