import { Metadata } from "next";
import { getLocale } from "next-intl/server";

import { AdminBugReportsBoard } from "@/features/bug-reports/components/AdminBugReportsBoard";
import { getAdminBugReports, getBugReportAssignableAgents, getBugReportBoardColumnSettings, parseAdminBugReportFilters } from "@/features/bug-reports/data";

export const metadata: Metadata = {
  title: "Bug reports",
  description: "Admin bug report board",
};

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
