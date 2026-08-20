import { Suspense } from "react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import type { SearchParams } from "nuqs";

import ServerFetchResult from "@/components/fetcher/fetch.server";
import {
  NotificationTemplateAdmin,
  NotificationTemplateAdminSkeleton,
} from "@/features/notification/components/admin/notification-template-admin";
import { getAdminNotificationTemplatesPageData } from "@/features/notification/db/admin-notification-templates.queries";
import type { AdminNotificationTemplateFilterParams } from "@/features/notification/types/notification-template-types";
import type { PageProps } from "@/types/next";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("AdminPages");

  return {
    title: t("bugReportsNotif.meta.notificationTemplatesTitle"),
    description: t("bugReportsNotif.meta.notificationTemplatesDescription"),
  };
}

interface NotificationTemplatesPageProps extends PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<SearchParams>;
}

function firstString(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0] || "";
  return value || "";
}

function toFilters(searchParams: SearchParams): AdminNotificationTemplateFilterParams {
  const pageNumber = Number(firstString(searchParams.pageNumber) || firstString(searchParams.page) || 1);
  const pageSize = Number(firstString(searchParams.pageSize) || 20);

  return {
    pageNumber: Number.isFinite(pageNumber) ? pageNumber : 1,
    pageSize: Number.isFinite(pageSize) ? pageSize : 20,
    filters:
      firstString(searchParams.filters) ||
      firstString(searchParams.search) ||
      firstString(searchParams.q) ||
      firstString(searchParams.query) ||
      undefined,
    notificationType: firstString(searchParams.notificationType) as AdminNotificationTemplateFilterParams["notificationType"],
    isActive: firstString(searchParams.isActive) as AdminNotificationTemplateFilterParams["isActive"],
    channel: firstString(searchParams.channel) as AdminNotificationTemplateFilterParams["channel"],
  };
}

export default function NotificationTemplatesPage({ params, searchParams }: NotificationTemplatesPageProps) {
  return (
    <Suspense fallback={<NotificationTemplateAdminSkeleton />}>
      <SuspenseBoundary params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function SuspenseBoundary({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const [{ locale }, resolvedSearchParams] = await Promise.all([params, searchParams]);
  const data = await getAdminNotificationTemplatesPageData(locale, toFilters(resolvedSearchParams));

  return (
    <ServerFetchResult result={data}>
      {(templatesPageData) => <NotificationTemplateAdmin data={templatesPageData} />}
    </ServerFetchResult>
  );
}
