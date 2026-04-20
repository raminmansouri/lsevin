import { notFound } from "next/navigation";
import { PageHeader } from "@/components/admin/ui/page-header";
import { DynamicForm } from "@/components/admin/forms/dynamic-form";
import { getResolvedTableDefinition } from "@/lib/admin/metadata";
import { getAdminSession } from "@/lib/admin/auth";
import { assertAdminPermission } from "@/lib/admin/guard";
import { getRecordById } from "@/lib/admin/record-query";
import { updateRecordAction } from "@/app/(admin)/admin/_actions";

type Props = {
  params: Promise<{ schema: string; table: string; id: string }>;
};

export default async function EditRecordPage({ params }: Props) {
  const { schema, table, id } = await params;
  await assertAdminPermission(schema, table, "update");

  const [definition, session, record] = await Promise.all([
    getResolvedTableDefinition({ schema, table }),
    getAdminSession(),
    getRecordById(schema, table, id),
  ]);

  if (!definition || !record) return notFound();

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Edit ${definition.label}`}
        description={`${schema}.${table}`}
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: definition.label, href: `/admin/${schema}/${table}` },
          { label: "Edit" },
        ]}
      />

      <div className="rounded-3xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <DynamicForm
          definition={definition}
          locale={session.locale}
          mode="edit"
          initialValues={record}
          onSubmitAction={async (values) => {
            "use server";
            return updateRecordAction({ schema, table, id, values });
          }}
        />
      </div>
    </div>
  );
}
