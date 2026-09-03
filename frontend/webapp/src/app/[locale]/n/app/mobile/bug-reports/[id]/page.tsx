import { notFound } from "next/navigation";

import { CustomerBugReportDetails } from "@/features/bug-reports/components/CustomerBugReportDetails";
import { getCustomerBugReportDetails } from "@/features/bug-reports/data";

export const dynamic = "force-dynamic";

type Params = Promise<{ id: string }> | { id: string };

export default async function CustomerBugReportDetailsPage({ params }: { params: Params }) {
  const { id } = await Promise.resolve(params);
  const report = await getCustomerBugReportDetails(id);
  if (!report) notFound();

  return <CustomerBugReportDetails report={report} />;
}
