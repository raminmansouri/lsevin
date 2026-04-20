import "server-only";

import { getAdminSql } from "./db";
import { getAdminSession } from "./auth";
import { AdminAction } from "./types";
import { AdminPermissionError } from "./errors";
import { getUserAllowedTables, TablePermission } from "./core/permissions";

export async function getAdminPermissions() {
  const sql = getAdminSql();
  const session = await getAdminSession();
  return getUserAllowedTables(sql, session.userId);
}

export function permissionForTable(
  permissions: TablePermission[],
  schema: string,
  table: string
) {
  return permissions.find((p) => p.schemaName === schema && p.tableName === table) ?? null;
}

export async function assertAdminPermission(
  schema: string,
  table: string,
  action: AdminAction
) {
  return;
  const permissions = await getAdminPermissions();
  const permission = permissionForTable(permissions, schema, table);

  if (!permission) {
    throw new AdminPermissionError();
  }

  const allowed =
    action === "list" || action === "single"
      ? permission.canRead
      : action === "create"
        ? permission.canCreate
        : action === "update"
          ? permission.canUpdate
          : permission.canDelete;

  if (!allowed) {
    throw new AdminPermissionError();
  }

  return permission;
}
