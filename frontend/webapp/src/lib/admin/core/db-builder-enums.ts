// db-builder-enums.ts
import { SqlClient, ColumnMetadata } from "./db-introspection";


export async function getEnumValuesForColumn(
  sql: SqlClient,
  args: {
    schema: string;
    table: string;
    column: ColumnMetadata;
  }
): Promise<string[]> {
  if (!args.column.isEnum) return [];

  const rows = await sql`
    SELECT e.enumlabel AS value
    FROM pg_type t
    JOIN pg_enum e
      ON e.enumtypid = t.oid
    WHERE t.typname = ${args.column.udtName}
    ORDER BY e.enumsortorder
  `;

  return rows.map((r: any) => r.value);
}