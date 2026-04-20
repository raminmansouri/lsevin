import { PropsWithChildren } from "react";
import { AdminShell } from "@/components/admin/layout/admin-shell";
import { getResolvedAdminNavigation } from "@/lib/admin/metadata";
import { getAdminPermissions, permissionForTable } from "@/lib/admin/guard";

export default async function AdminLayout({ children }: PropsWithChildren) {
  const [navigation, permissions] = await Promise.all([
    getResolvedAdminNavigation(),
    getAdminPermissions(),
  ]);

  const allowed = navigation.filter((item) =>
    permissionForTable(permissions, item.schema, item.table)?.canRead
  );

  return <AdminShell navigation={allowed}>{children}</AdminShell>;
}
