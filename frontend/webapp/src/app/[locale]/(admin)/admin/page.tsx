import { getTranslations } from "next-intl/server";
import { Database, ShieldCheck, TableProperties, Trash2 } from "lucide-react";

import { PageHeader } from "@/components/admin/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { getAdminPermissions } from "@/lib/admin/guard";
import { getAdminTableGroups } from "@/lib/admin/table-groups";
import { getSession } from "@/lib/auth/session";
import { UserRole } from "@/types/common";

import { PurgeCacheButton } from "./purge-cache-button";

export default async function AdminHomePage() {
  const [schemas, permissions, session, t] = await Promise.all([
    getAdminTableGroups(),
    getAdminPermissions(),
    getSession().catch(() => null),
    getTranslations("Admin"),
  ]);

  const roles = session?.user?.roles;
  const isPrivileged = Boolean(
    roles?.includes(UserRole.SuperAdmin) || roles?.includes(UserRole.Admin)
  );

  const tableCount = schemas.reduce((sum, group) => sum + group.tables.length, 0);

  const stats = [
    { key: "tables", icon: Database, value: tableCount },
    { key: "permissions", icon: ShieldCheck, value: permissions.length },
    { key: "schemas", icon: TableProperties, value: schemas.length },
  ] as const;

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("home.title")}
        description={t("home.description")}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map(({ key, icon: Icon, value }) => (
          <Card key={key}>
            <CardContent className="flex items-center gap-4 p-5">
              <div className="bg-muted text-muted-foreground flex size-11 shrink-0 items-center justify-center rounded-xl">
                <Icon className="size-5" />
              </div>
              <div className="min-w-0">
                <div className="text-2xl font-semibold tabular-nums">{value}</div>
                <p className="text-muted-foreground truncate text-sm">
                  {t(`home.stats.${key}`)}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {isPrivileged ? (
        <Card className="border-destructive/30">
          <CardHeader className="flex flex-row items-start gap-3 space-y-0">
            <div className="bg-destructive/10 text-destructive flex size-10 shrink-0 items-center justify-center rounded-xl">
              <Trash2 className="size-5" />
            </div>
            <div className="min-w-0 flex-1">
              <CardTitle className="text-base">{t("home.cache.title")}</CardTitle>
              <p className="text-muted-foreground mt-1 text-sm">
                {t("home.cache.description")}
              </p>
            </div>
          </CardHeader>
          <CardContent>
            <PurgeCacheButton />
          </CardContent>
        </Card>
      ) : null}

      {schemas.length === 0 ? (
        <Card>
          <CardContent className="text-muted-foreground p-10 text-center text-sm">
            {t("home.empty")}
          </CardContent>
        </Card>
      ) : (
        schemas.map((group) => (
          <Card key={group.schema}>
            <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
              <CardTitle className="text-base">{group.label}</CardTitle>
              <Badge variant="secondary" className="tabular-nums">
                {group.tables.length}
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {group.tables.map((table) => (
                  <Link
                    key={table.key}
                    href={table.href}
                    className="hover:border-primary/40 hover:bg-accent focus-visible:ring-ring rounded-lg border p-3 transition-colors focus-visible:ring-2 focus-visible:outline-none"
                  >
                    <div className="truncate text-sm font-medium">{table.label}</div>
                    <div className="text-muted-foreground truncate text-xs" dir="ltr">
                      {table.qualified}
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
