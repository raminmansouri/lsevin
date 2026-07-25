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

/**
 * Authorize one action against one table.
 *
 * This function body started with a bare `return;`, so every call site — all of the
 * generic admin CRUD — was a no-op. Enforcement is restored in two layers:
 *
 * 1. The role gate, in getAdminSession(): the caller must hold Admin or SuperAdmin.
 *    That is the actual security boundary, and it is what `/api/admin/**` needs,
 *    since the middleware matcher excludes `/api`.
 *
 * 2. auth.role_table_permissions, as *narrowing* on top of that. It is deliberately
 *    not the gate: production holds a handful of rows for a single role while several
 *    accounts carry the admin role, so treating "no rows" as "deny" would empty the
 *    panel for most admins the moment this stopped being a no-op. An admin with no
 *    grants keeps the access they have today; an admin who has grants is held to them.
 *    Seed the table for everyone and this degradation stops firing on its own.
 */
export async function assertAdminPermission(
  schema: string,
  table: string,
  action: AdminAction
) {
  const permissions = await getAdminPermissions();

  if (permissions.length === 0) {
    return null;
  }

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
