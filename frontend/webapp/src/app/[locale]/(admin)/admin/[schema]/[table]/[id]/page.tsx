import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil } from "lucide-react";
import { PageHeader } from "@/components/admin/ui/page-header";
import { assertAdminPermission } from "@/lib/admin/guard";
import { getRecordById } from "@/lib/admin/record-query";
import { getResolvedTableDefinition } from "@/lib/admin/metadata";

type Props = {
  params: Promise<{ schema: string; table: string; id: string }>;
};

export default async function ViewRecordPage({ params }: Props) {
  const { schema, table, id } = await params;
  await assertAdminPermission(schema, table, "single");

  const [definition, record] = await Promise.all([
    getResolvedTableDefinition({ schema, table }),
    getRecordById(schema, table, id),
  ]);

  if (!definition || !record) return notFound();

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${definition.label} #${id}`}
        description={`${schema}.${table}`}
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: definition.label, href: `/admin/${schema}/${table}` },
          { label: "View" },
        ]}
      />

      <div className="rounded-3xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-4 flex justify-end">
          <Link
            href={`/admin/${schema}/${table}/${id}/edit`}
            className="inline-flex items-center gap-2 rounded-2xl bg-zinc-900 px-4 py-2 text-sm text-white dark:bg-white dark:text-zinc-950"
          >
            <Pencil className="h-4 w-4" />
            Edit
          </Link>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {definition.fields.map((field) => (
            <div key={field.columnName} className="rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
              <div className="mb-1 text-xs uppercase tracking-wide text-zinc-500">{field.label}</div>
              <div className="text-sm">
                {String(record[field.columnName] ?? "—")}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
