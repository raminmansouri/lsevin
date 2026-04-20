import { notFound } from "next/navigation";
import { assertAdminPermission } from "@/lib/admin/guard";
import { getAdminSession } from "@/lib/admin/auth";
import { getResolvedTableDefinition } from "@/lib/admin/metadata";
import { parseListQuery, runListQuery } from "@/lib/admin/list-query";
import { DynamicDataTable } from "@/components/admin/table/dynamic-data-table";
import { PageHeader } from "@/components/admin/ui/page-header";

type Props = {
  params: Promise<{ schema: string; table: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function DynamicTablePage({ params, searchParams }: Props) {
  const { schema, table } = await params;
  const search = await searchParams;

  await assertAdminPermission(schema, table, "list");

  const [session, definition] = await Promise.all([
    getAdminSession(),
    getResolvedTableDefinition({ schema, table }),
  ]);

  if (!definition) return notFound();

  const listQuery = parseListQuery(search);
  const result = await runListQuery({ schema, table }, listQuery, session.locale);

  return (
    <div className="space-y-6">
      <PageHeader
        title={definition.pageTitle}
        description={`${schema}.${table}`}
        createHref={!definition.readonly ? `/admin/${schema}/${table}/new` : undefined}
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: schema, href: `/admin` },
          { label: definition.label },
        ]}
      />

      <DynamicDataTable
        definition={definition}
        rows={result.rows}
        page={result.page}
        pageSize={result.pageSize}
        pageCount={result.pageCount}
        total={result.total}
      />
    </div>
  );
}
