import { getLocale, getTranslations } from "next-intl/server";

import { listBookingsAdmin } from "@/features/stays/server/admin/operations";
import { BookingsAdmin } from "@/features/stays/ui/admin/operations-admin";
import { contentLocaleFor } from "@/features/tours/domain/content";
import { adminPageActor, sp } from "@/features/tours/server/admin/page-actor";

export async function generateMetadata() {
  const t = await getTranslations("StayAdmin.bookings");
  return { title: t("title") };
}

const STATUSES = ["pending_payment", "requested", "confirmed", "declined", "cancelled", "completed", "no_show", "expired"];

export default async function StaysAdminBookingsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await adminPageActor();
  const params = await searchParams;
  const filters = { status: sp(params, "status") ?? "", q: sp(params, "q") ?? "" };
  const rows = await listBookingsAdmin(
    { status: STATUSES.includes(filters.status) ? filters.status : null, q: filters.q.slice(0, 64) || null },
    contentLocaleFor(await getLocale()),
  );
  return <BookingsAdmin rows={rows} filters={filters} />;
}
