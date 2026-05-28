import Link from "next/link";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import { AdminDataTable } from "@/features/admin-data/components/admin-data-table";
import { getAdminTableConfig, isAdminSchemaName } from "@/features/admin-data/config";
import { listAdminRows } from "@/features/admin-data/lib/db";

type Props = {
  params: Promise<{ locale: string; schemaName: string; tableName: string }>;
  searchParams: Promise<{ page?: string; q?: string; sort?: string }>;
};

export default async function AdminSchemaTablePage({ params, searchParams }: Props) {
  const { locale, schemaName, tableName } = await params;
  const query = await searchParams;
  if (!isAdminSchemaName(schemaName)) notFound();
  const config = getAdminTableConfig(schemaName, tableName);
  if (!config) notFound();

  const result = await listAdminRows({
    schema: schemaName,
    table: tableName,
    page: Number(query.page || 1),
    search: query.q,
    sort: query.sort,
  });

  return (
    <div className="space-y-4">
      <Button asChild variant="ghost" className="px-0">
        <Link href="/admin/platform-data">← Back to platform data</Link>
      </Button>
      <AdminDataTable config={config} result={result} search={query.q} locale={locale} />
    </div>
  );
}
