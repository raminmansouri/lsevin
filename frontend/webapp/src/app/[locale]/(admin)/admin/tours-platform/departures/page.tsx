import { getTranslations } from "next-intl/server";

import { PageHeader } from "@/components/page/page-header";
import { actionError, adminPageActor, sp } from "@/features/tours/server/admin/page-actor";
import { departuresBoard, filterLookups } from "@/features/tours/server/admin/queries";
import { runAction } from "@/features/tours/server/platform/errors";
import { getTourSettings } from "@/features/tours/server/platform/settings";
import { DeparturesBoard } from "@/features/tours/ui/admin/departures-board";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata() {
  const t = await getTranslations("TourAdmin.departures");
  return { title: t("title") };
}

export default async function DeparturesPage({ searchParams }: Props) {
  const actor = await adminPageActor();
  const q = await searchParams;
  const t = await getTranslations("TourAdmin.departures");
  const filters = { from: sp(q, "from"), to: sp(q, "to"), calendar: sp(q, "calendar"), providerId: sp(q, "provider"), tourId: sp(q, "tour"), status: sp(q, "status"), page: Number(sp(q, "page") ?? 1) };
  const [board, lookups, settings] = await Promise.all([runAction("admin.departuresBoard", () => departuresBoard(actor, filters)), filterLookups(actor), getTourSettings()]);
  return (
    <div className="space-y-5">
      <PageHeader title={t("title")} description={t("description")} />
      <DeparturesBoard
        filters={Object.fromEntries(Object.entries(q).map(([k, v]) => [k, (Array.isArray(v) ? v[0] : v) ?? ""]))}
        board={board.ok ? board.data : null}
        error={actionError(board)}
        providers={lookups.providers}
        locales={settings.enabledLocales}
      />
    </div>
  );
}
