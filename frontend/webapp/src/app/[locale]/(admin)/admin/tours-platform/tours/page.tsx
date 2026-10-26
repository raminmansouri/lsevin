import { getTranslations } from "next-intl/server";

import { PageHeader } from "@/components/page/page-header";
import { actionError, adminPageActor, sp } from "@/features/tours/server/admin/page-actor";
import { filterLookups, listTours } from "@/features/tours/server/admin/queries";
import { ToursCatalog } from "@/features/tours/ui/admin/tours-catalog";
import { runAction } from "@/features/tours/server/platform/errors";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata() {
  const t = await getTranslations("TourAdmin.tours");
  return { title: t("title") };
}

export default async function ToursPlatformToursPage({ searchParams }: Props) {
  const actor = await adminPageActor();
  const params = await searchParams;
  const t = await getTranslations("TourAdmin.tours");
  const filters = {
    q: sp(params, "q"), providerId: sp(params, "provider"), country: sp(params, "country"), destinationId: sp(params, "destination"),
    category: sp(params, "category"), status: sp(params, "status"), verification: sp(params, "verification") as never,
    publishedFrom: sp(params, "from"), publishedTo: sp(params, "to"), calendar: sp(params, "calendar"),
    queue: sp(params, "queue") === "1", page: Number(sp(params, "page") ?? 1),
  };
  // Invalid filter input (e.g. a nonexistent Jalali date) is shown as a message, not a crash.
  const [list, lookups] = await Promise.all([runAction("admin.listTours", () => listTours(actor, filters)), filterLookups(actor)]);
  return (
    <div className="space-y-5">
      <PageHeader title={filters.queue ? t("queueTitle") : t("title")} description={t("description")} />
      <ToursCatalog
        filters={Object.fromEntries(Object.entries(params).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v ?? ""])) as Record<string, string>}
        result={list.ok ? list.data : null}
        error={actionError(list)}
        lookups={lookups}
      />
    </div>
  );
}
