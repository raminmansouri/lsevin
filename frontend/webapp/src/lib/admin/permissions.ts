// lib/admin/permissions.ts
import { SqlClient } from "./db-introspection";

export type TablePermission = {
  schemaName: string;
  tableName: string;
  canRead: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
};

export async function getUserAllowedTables(
  sql: SqlClient,
  userId: string
): Promise<TablePermission[]> {
  return sql`
    select
      p.schema_name as "schemaName",
      p.table_name as "tableName",
      bool_or(p.can_read)   as "canRead",
      bool_or(p.can_create) as "canCreate",
      bool_or(p.can_update) as "canUpdate",
      bool_or(p.can_delete) as "canDelete"
    from auth.user_roles ur
    join auth.role_table_permissions p
      on p.role_id = ur.role_id
    where ur.user_id = ${userId}
    group by p.schema_name, p.table_name
    having bool_or(p.can_read) = true
    order by p.schema_name, p.table_name
  `;
}