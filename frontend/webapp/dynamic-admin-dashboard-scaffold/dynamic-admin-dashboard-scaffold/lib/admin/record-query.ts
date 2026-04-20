import "server-only";

import { getAdminSql } from "./db";
import { getResolvedTableDefinition } from "./metadata";
import { AdminNotFoundError } from "./errors";

export async function getRecordById(
  schema: string,
  table: string,
  id: string | number
) {
  const sql = getAdminSql();
  const resolved = await getResolvedTableDefinition({ schema, table });
  if (!resolved || !resolved.primaryKey) {
    throw new AdminNotFoundError();
  }

  const rows = await sql`
    select *
    from ${sql(schema)}.${sql(table)}
    where ${sql(resolved.primaryKey)} = ${id}
    limit 1
  `;

  return rows[0] ?? null;
}
