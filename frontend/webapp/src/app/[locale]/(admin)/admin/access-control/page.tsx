import { getTranslations } from "next-intl/server";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RolesPanel } from "@/features/access-control/components/roles-panel";
import { StaffPanel } from "@/features/access-control/components/staff-panel";
import {
  listRecentAudit,
  listRoles,
  listStaff,
  listUnmanagedAdmins,
} from "@/features/access-control/server/repository";
import { redirect } from "@/i18n/navigation";
import { getAdminContext } from "@/lib/auth/admin-guard";

export const dynamic = "force-dynamic";

/**
 * Roles, permissions and who holds them.
 *
 * Unlimited admins only — enforced here, by the middleware (`access-control` is never grantable)
 * and again inside every server action.
 */
export default async function AccessControlPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const ctx = await getAdminContext();
  if (!ctx.isAdmin) redirect({ href: "/admin/access-denied", locale });

  const [t, roles, staff, unmanaged, audit] = await Promise.all([
    getTranslations("AdminAccess"),
    listRoles(),
    listStaff(),
    listUnmanagedAdmins(),
    listRecentAudit(15),
  ]);

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <p className="text-muted-foreground max-w-3xl text-sm">{t("subtitle")}</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("howItWorks.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="text-muted-foreground list-disc space-y-1 ps-5 text-sm">
            <li>{t("howItWorks.full")}</li>
            <li>{t("howItWorks.limited")}</li>
            <li>{t("howItWorks.newPages")}</li>
          </ul>
        </CardContent>
      </Card>

      <RolesPanel roles={roles} />
      <StaffPanel staff={staff} unmanaged={unmanaged} />

      <Card data-testid="audit-panel">
        <CardHeader>
          <CardTitle>{t("audit.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          {audit.length === 0 ? (
            <p className="text-muted-foreground text-sm">{t("audit.empty")}</p>
          ) : (
            <ul className="divide-y text-sm">
              {audit.map((entry) => (
                <li key={entry.id} className="flex flex-wrap items-center gap-2 py-2">
                  <Badge variant="outline">{entry.action}</Badge>
                  {entry.roleName ? <span>{entry.roleName}</span> : null}
                  {entry.target ? <span dir="ltr">{entry.target}</span> : null}
                  <span className="text-muted-foreground">
                    {entry.actor ? t("audit.by", { actor: entry.actor }) : null}
                  </span>
                  <time className="text-muted-foreground ms-auto text-xs" dir="ltr">
                    {entry.createdAt.slice(0, 19)}
                  </time>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
