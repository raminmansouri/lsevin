import { ShieldAlert } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ADMIN_NAV, type AdminNavLeaf, isNavGroup } from "@/features/shared/config/admin-nav";
import { allowedNavHrefs } from "@/features/shared/config/admin-nav-filter";
import { Link } from "@/i18n/navigation";
import { AdminAccessInfrastructureError } from "@/lib/admin/access/store";
import { getAdminContext } from "@/lib/auth/admin-guard";

export const dynamic = "force-dynamic";

/**
 * Where a limited admin lands when they open something their roles do not include.
 *
 * Exempt from the access check on purpose (see ALWAYS_ALLOWED_PAGES): a person with no
 * permissions must still have somewhere to go, and this page only ever lists links the person
 * may already open.
 */
export default async function AccessDeniedPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  const { from } = await searchParams;
  const [t, tNav] = await Promise.all([getTranslations("AdminAccess"), getTranslations("Admin")]);

  let allowed: AdminNavLeaf[] = [];
  let unavailable = false;
  try {
    const ctx = await getAdminContext();
    const hrefs = allowedNavHrefs(ctx.access);
    const leaves = ADMIN_NAV.flatMap((entry) => (isNavGroup(entry) ? entry.items : [entry]));
    allowed = hrefs === null ? leaves : leaves.filter((leaf) => hrefs.includes(leaf.href));
  } catch (error) {
    if (!(error instanceof AdminAccessInfrastructureError)) throw error;
    unavailable = true;
  }

  const label = (key: string) => (tNav.has(`nav.${key}`) ? tNav(`nav.${key}`) : key);
  // Only echo a path-shaped value, as text — it is never used as a link target.
  const requested = typeof from === "string" && /^\/[A-Za-z0-9/_\-.[\]]*$/.test(from) ? from : null;

  return (
    <div className="mx-auto max-w-2xl space-y-6 py-8" data-testid="access-denied">
      <div className="flex items-start gap-3">
        <ShieldAlert className="text-muted-foreground mt-1 size-6 shrink-0" aria-hidden />
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">{t("denied.title")}</h1>
          <p className="text-muted-foreground text-sm">{unavailable ? t("denied.unavailable") : t("denied.body")}</p>
          {requested ? (
            <p className="text-muted-foreground text-xs" dir="ltr">
              {t("denied.from", { path: requested })}
            </p>
          ) : null}
        </div>
      </div>

      {!unavailable ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("denied.available")}</CardTitle>
          </CardHeader>
          <CardContent>
            {allowed.length === 0 ? (
              <p className="text-muted-foreground text-sm" data-testid="denied-none">
                {t("denied.none")}
              </p>
            ) : (
              <ul className="grid gap-2 sm:grid-cols-2" data-testid="denied-allowed">
                {allowed.map((leaf) => (
                  <li key={leaf.href}>
                    <Link href={leaf.href} className="hover:bg-muted flex items-center gap-2 rounded-md border p-2 text-sm">
                      <leaf.icon className="size-4" aria-hidden />
                      {label(leaf.titleKey)}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
