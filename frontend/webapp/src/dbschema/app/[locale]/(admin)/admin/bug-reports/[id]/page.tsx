import { notFound } from "next/navigation";

import { AdminBugReportDetails } from "@/features/bug-reports/components/AdminBugReportDetails";
import { getAdminBugReportDetails } from "@/features/bug-reports/data";

type Params = Promise<{ id: string }> | { id: string };

export default async function AdminBugReportDetailsPage({ params }: { params: Params }) {
  const { id } = await Promise.resolve(params);
  const report = await getAdminBugReportDetails(id);
  if (!report) notFound();

  return <AdminBugReportDetails report={report} />;
}
