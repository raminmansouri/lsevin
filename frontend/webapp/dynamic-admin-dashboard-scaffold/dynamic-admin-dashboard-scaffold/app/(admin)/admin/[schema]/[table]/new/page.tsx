import { notFound } from "next/navigation";
import { PageHeader } from "@/components/admin/ui/page-header";
import { DynamicForm } from "@/components/admin/forms/dynamic-form";
import { getResolvedTableDefinition } from "@/lib/admin/metadata";
import { getAdminSession } from "@/lib/admin/auth";
import { assertAdminPermission } from "@/lib/admin/guard";
import { createRecordAction } from "@/app/(admin)/admin/_actions";

type Props = {
  params: Promise<{ schema: string; table: string }>;
};

export default async function CreateRecordPage({ params }: Props) {
  const { schema, table } = await params;
  await assertAdminPermission(schema, table, "create");

  const [definition, session] = await Promise.all([
    getResolvedTableDefinition({ schema, table }),
    getAdminSession(),
  ]);

  if (!definition) return notFound();

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Create ${definition.label}`}
        description={`${schema}.${table}`}
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: definition.label, href: `/admin/${schema}/${table}` },
          { label: "Create" },
        ]}
      />

      <div className="rounded-3xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <DynamicForm
          definition={definition}
          locale={session.locale}
          mode="create"
          onSubmitAction={async (values) => {
            "use server";
            return createRecordAction({ schema, table, values });
          }}
        />
      </div>
    </div>
  );
}
