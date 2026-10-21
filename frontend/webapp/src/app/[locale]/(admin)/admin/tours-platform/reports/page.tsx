import { getTranslations } from "next-intl/server";

import { PageHeader } from "@/components/page/page-header";
import { actionError, adminPageActor, sp } from "@/features/tours/server/admin/page-actor";
import { filterLookups } from "@/features/tours/server/admin/queries";
import { kpis, parseRange } from "@/features/tours/server/admin/reports";
import { runAction } from "@/features/tours/server/platform/errors";
import { ReportsView } from "@/features/tours/ui/admin/reports-view";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata() {
  const t = await getTranslations("TourAdmin.reports");
  return { title: t("title") };
}

export default async function ReportsPage({ searchParams }: Props) {
  const actor = await adminPageActor();
  const q = await searchParams;
  const t = await getTranslations("TourAdmin.reports");
  const input = { from: sp(q, "from"), to: sp(q, "to"), calendar: sp(q, "calendar"), timezone: sp(q, "tz"), providerId: sp(q, "provider") };
  const [result, lookups] = await Promise.all([runAction("admin.kpis", async () => kpis(actor, parseRange(input))), filterLookups(actor)]);
  return (
    <div className="space-y-5">
      <PageHeader title={t("title")} description={t("description")} />
      <ReportsView
        filters={Object.fromEntries(Object.entries(q).map(([k, v]) => [k, (Array.isArray(v) ? v[0] : v) ?? ""]))}
        data={result.ok ? result.data : null}
        error={actionError(result)}
        providers={lookups.providers}
      />
    </div>
  );
}
