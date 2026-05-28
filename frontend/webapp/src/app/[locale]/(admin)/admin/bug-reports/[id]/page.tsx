import { notFound } from "next/navigation";

import { AdminBugReportDetails } from "@/features/bug-reports/components/AdminBugReportDetails";
import { getAdminBugReportDetails, getBugReportAssignableAgents } from "@/features/bug-reports/data";

type Params = Promise<{ id: string }> | { id: string };

export default async function AdminBugReportDetailsPage({ params }: { params: Params }) {
  const { id } = await Promise.resolve(params);
  const [report, agents] = await Promise.all([
    getAdminBugReportDetails(id),
    getBugReportAssignableAgents(),
  ]);
  if (!report) notFound();

  return <AdminBugReportDetails report={report} agents={agents} />;
}
