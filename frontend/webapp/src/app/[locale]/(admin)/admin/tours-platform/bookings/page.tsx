import { getTranslations } from "next-intl/server";

import { PageHeader } from "@/components/page/page-header";
import { actionError, adminPageActor, sp } from "@/features/tours/server/admin/page-actor";
import { filterLookups, listBookings } from "@/features/tours/server/admin/queries";
import { runAction } from "@/features/tours/server/platform/errors";
import { BookingsExplorer } from "@/features/tours/ui/admin/bookings-explorer";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata() {
  const t = await getTranslations("TourAdmin.bookings");
  return { title: t("title") };
}

export default async function BookingsPage({ searchParams }: Props) {
  const actor = await adminPageActor();
  const q = await searchParams;
  const t = await getTranslations("TourAdmin.bookings");
  const filters = {
    q: sp(q, "q"), status: sp(q, "status"), paymentStatus: sp(q, "payment"), providerId: sp(q, "provider"), departureId: sp(q, "departure"),
    from: sp(q, "from"), to: sp(q, "to"), calendar: sp(q, "calendar"), page: Number(sp(q, "page") ?? 1),
  };
  const [list, lookups] = await Promise.all([runAction("admin.listBookings", () => listBookings(actor, filters)), filterLookups(actor)]);
  return (
    <div className="space-y-5">
      <PageHeader title={t("title")} description={t("description")} />
      <BookingsExplorer
        filters={Object.fromEntries(Object.entries(q).map(([k, v]) => [k, (Array.isArray(v) ? v[0] : v) ?? ""]))}
        result={list.ok ? list.data : null}
        error={actionError(list)}
        providers={lookups.providers}
      />
    </div>
  );
}
