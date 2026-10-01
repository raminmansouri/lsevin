import { AdminCasesPage } from "@/features/case-management/components/admin-cases-page";
import { listAdminCases } from "@/features/case-management/server/admin-repository";

export default async function CasesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const result = await listAdminCases(locale);
  return <AdminCasesPage locale={locale} cases={result.cases} summary={result.summary} />;
}
