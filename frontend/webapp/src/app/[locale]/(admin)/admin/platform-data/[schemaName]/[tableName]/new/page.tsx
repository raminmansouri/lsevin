import Link from "next/link";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import { AdminDataForm } from "@/features/admin-data/components/admin-data-form";
import { getAdminTableConfig, isAdminSchemaName } from "@/features/admin-data/config";
import { buildRelationOptions } from "@/features/admin-data/lib/relation-options";

type Props = {
  params: Promise<{ locale: string; schemaName: string; tableName: string }>;
};

export default async function NewAdminRowPage({ params }: Props) {
  const { locale, schemaName, tableName } = await params;
  if (!isAdminSchemaName(schemaName)) notFound();
  const config = getAdminTableConfig(schemaName, tableName);
  if (!config || config.readOnly) notFound();

  const relationOptions = await buildRelationOptions(config);

  return (
    <div className="space-y-4">
      <Button asChild variant="ghost" className="px-0">
        <Link href={`/admin/platform-data/${schemaName}/${tableName}`}>← Back to {config.title}</Link>
      </Button>
      <AdminDataForm config={config} relationOptions={relationOptions} mode="create" locale={locale} />
    </div>
  );
}
