import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { MembersPanel } from "@/features/access-control/components/members-panel";
import {
  type MatrixGroup,
  PermissionMatrix,
} from "@/features/access-control/components/permission-matrix";
import { RoleSettings } from "@/features/access-control/components/role-settings";
import { getRoleDetail } from "@/features/access-control/server/repository";
import { Link, redirect } from "@/i18n/navigation";
import { buildCatalog } from "@/lib/admin/access/catalog";
import { getAdminContext } from "@/lib/auth/admin-guard";

export const dynamic = "force-dynamic";

const GUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function RoleDetailPage({
  params,
}: {
  params: Promise<{ locale: string; roleId: string }>;
}) {
  const { locale, roleId } = await params;
  const ctx = await getAdminContext();
  if (!ctx.isAdmin) redirect({ href: "/admin/access-denied", locale });
  if (!GUID.test(roleId)) notFound();

  const [t, tNav, detail] = await Promise.all([
    getTranslations("AdminAccess"),
    getTranslations("Admin"),
    getRoleDetail(roleId),
  ]);
  if (!detail) notFound();

  const navLabel = (key: string) => (tNav.has(`nav.${key}`) ? tNav(`nav.${key}`) : key);

  // Labels are resolved here: the catalogue holds message keys, the browser should get words.
  const groups: MatrixGroup[] = buildCatalog().map((group) => ({
    groupKey: group.groupKey,
    label: group.groupKey === "general" ? navLabel("dashboard") : group.groupKey === "other" ? t("matrix.other") : navLabel(group.groupKey),
    resources: group.resources.map((resource) => ({
      key: resource.key,
      label: resource.origin === "nav" ? navLabel(resource.titleKey) : resource.titleKey,
      href: resource.href,
      origin: resource.origin,
      unlimitedOnly: resource.unlimitedOnly,
      pending: resource.pending,
      sensitive: resource.sensitive,
    })),
  }));

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Link
          href="/admin/access-control"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
        >
          <ChevronLeft className="size-4 rtl:rotate-180" />
          {t("role.back")}
        </Link>
        <h1 className="text-2xl font-semibold" data-testid="role-title">
          {detail.role.name}
        </h1>
      </div>

      <RoleSettings role={detail.role} />
      <PermissionMatrix roleId={detail.role.id} groups={groups} initialGrants={detail.grants} />
      <MembersPanel roleId={detail.role.id} members={detail.members} />
    </div>
  );
}
