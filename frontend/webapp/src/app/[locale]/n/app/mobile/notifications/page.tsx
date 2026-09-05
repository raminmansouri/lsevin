import { getNotificationsPageData, parseNotificationsFilters } from "./notifications.data";
import NotificationsClient from "./NotificationsClient";

export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<SearchParams>;
}) {
  const { locale } = await params;
  const resolvedSearchParams = (await searchParams) ?? {};
  const filters = parseNotificationsFilters(resolvedSearchParams);
  const data = await getNotificationsPageData({ locale, filters });

  return <NotificationsClient {...data} filters={filters} />;
}
