import { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";

import { AdminBugReportsBoard } from "@/features/bug-reports/components/AdminBugReportsBoard";
import { getAdminBugReports, getBugReportAssignableAgents, getBugReportBoardColumnSettings, parseAdminBugReportFilters } from "@/features/bug-reports/data";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("AdminPages");

  return {
    title: t("bugReportsNotif.meta.bugReportsTitle"),
    description: t("bugReportsNotif.meta.bugReportsDescription"),
  };
}

type SearchParams =
  | Promise<Record<string, string | string[] | undefined>>
  | Record<string, string | string[] | undefined>;

export default async function AdminBugReportsPage({ searchParams }: { searchParams?: SearchParams }) {
  const locale = await getLocale().catch(() => "en");
  const params = await Promise.resolve(searchParams ?? {});
  const filters = parseAdminBugReportFilters(params);
  const [data, agents, boardColumns] = await Promise.all([
    getAdminBugReports(filters),
    getBugReportAssignableAgents().catch(() => []),
    getBugReportBoardColumnSettings().catch(() => []),
  ]);

  return (
    <AdminBugReportsBoard
      locale={locale}
      items={data.items}
      stats={data.stats}
      filters={filters}
      pageInfo={data.pageInfo}
      recentChanges={data.recentChanges}
      agents={agents}
      boardColumns={boardColumns}
    />
  );
}
