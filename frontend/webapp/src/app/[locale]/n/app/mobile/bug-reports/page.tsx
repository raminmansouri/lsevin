import { getLocale } from "next-intl/server";

import { CustomerBugReportPage } from "@/features/bug-reports/components/CustomerBugReportPage";
import { getCustomerBugReportPageData } from "@/features/bug-reports/data";

export const dynamic = "force-dynamic";

type SearchParams =
  | Promise<Record<string, string | string[] | undefined>>
  | Record<string, string | string[] | undefined>;

function single(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] || "" : value || "";
}

export default async function BugReportsPage({ searchParams }: { searchParams?: SearchParams }) {
  const locale = await getLocale().catch(() => "en");
  const params = await Promise.resolve(searchParams ?? {});
  const data = await getCustomerBugReportPageData();

  return (
    <CustomerBugReportPage
      locale={locale}
      userId={data.userId}
      reports={data.reports}
      defaults={{
        sourceArea: single(params.sourceArea) || single(params.area) || "booking",
        sourceUrl: single(params.sourceUrl) || single(params.url),
        bookingId: single(params.bookingId),
        providerId: single(params.providerId),
        serviceId: single(params.serviceId),
        specialistId: single(params.specialistId),
      }}
    />
  );
}
