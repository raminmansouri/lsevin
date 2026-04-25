import Link from "next/link";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import { AdminDataForm } from "@/features/admin-data/components/admin-data-form";
import { getAdminTableConfig, isAdminSchemaName } from "@/features/admin-data/config";
import { getAdminRow } from "@/features/admin-data/lib/db";
import { decodeRowId } from "@/features/admin-data/lib/ids";
import { buildRelationOptions } from "@/features/admin-data/lib/relation-options";

type Props = {
  params: Promise<{ locale: string; schemaName: string; tableName: string; rowId: string }>;
};

export default async function EditAdminRowPage({ params }: Props) {
  const { locale, schemaName, tableName, rowId } = await params;
  if (!isAdminSchemaName(schemaName)) notFound();
  const config = getAdminTableConfig(schemaName, tableName);
  if (!config) notFound();

  const decodedRowId = decodeRowId(rowId);
  const row = await getAdminRow(schemaName, tableName, decodedRowId);
  if (!row) notFound();

  const relationOptions = await buildRelationOptions(config, row);

  return (
    <div className="space-y-4">
      <Button asChild variant="ghost" className="px-0">
        <Link href={`/admin/platform-data/${schemaName}/${tableName}`}>← Back to {config.title}</Link>
      </Button>
      <AdminDataForm config={config} row={row} rowId={decodedRowId} relationOptions={relationOptions} mode="update" locale={locale} />
    </div>
  );
}
