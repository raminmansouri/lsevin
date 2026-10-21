import { getTranslations } from "next-intl/server";

import { PageHeader } from "@/components/page/page-header";
import { adminLevelOf, listAdminRoles, listDisputes } from "@/features/tours/server/admin/disputes";
import { adminPageActor, sp } from "@/features/tours/server/admin/page-actor";
import { AdminRolesPanel, DisputesPanel } from "@/features/tours/ui/admin/ops-panels";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata() {
  const t = await getTranslations("TourAdmin.disputes");
  return { title: t("title") };
}

export default async function DisputesPage({ searchParams }: Props) {
  const actor = await adminPageActor();
  const q = await searchParams;
  const t = await getTranslations("TourAdmin.disputes");
  const status = sp(q, "status") ?? "active";
  const [disputes, level, roles] = await Promise.all([listDisputes(actor, { status }), adminLevelOf(actor), listAdminRoles(actor)]);
  return (
    <div className="space-y-5">
      <PageHeader title={t("title")} description={t("description")} />
      <DisputesPanel disputes={disputes} myLevel={level} status={status} />
      <AdminRolesPanel roles={roles} />
    </div>
  );
}
