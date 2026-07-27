import { PropsWithChildren } from "react";
import { AdminShell } from "@/components/admin/layout/admin-shell";
import { getResolvedAdminNavigation } from "@/lib/admin/metadata";
import { getAdminPermissions, permissionForTable } from "@/lib/admin/guard";

export default async function AdminLayout({ children }: PropsWithChildren) {
  const [navigation, permissions] = await Promise.all([
    getResolvedAdminNavigation(),
    getAdminPermissions(),
  ]);

  // Same degradation as assertAdminPermission: auth.role_table_permissions narrows the
  // menu when it has grants for this admin, but an admin with no rows at all sees the
  // full menu rather than an empty sidebar. Without this the nav and the guard disagree
  // — the guard would let them open a table the menu never offered.
  const allowed =
    permissions.length === 0
      ? navigation
      : navigation.filter((item) => permissionForTable(permissions, item.schema, item.table)?.canRead);

  return <AdminShell navigation={allowed}>{children}</AdminShell>;
}
