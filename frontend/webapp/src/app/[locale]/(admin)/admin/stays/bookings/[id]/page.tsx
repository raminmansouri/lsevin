import { notFound } from "next/navigation";
import { getLocale } from "next-intl/server";

import { getBookingAdmin } from "@/features/stays/server/admin/operations";
import { BookingAdminDetail, type AdminBookingDetail } from "@/features/stays/ui/admin/operations-admin";
import { contentLocaleFor } from "@/features/tours/domain/content";
import { adminPageActor } from "@/features/tours/server/admin/page-actor";
import { ToursError } from "@/features/tours/server/platform/errors";

export default async function StaysAdminBookingPage({ params }: { params: Promise<{ id: string }> }) {
  await adminPageActor();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  let booking;
  try {
    booking = await getBookingAdmin(id, contentLocaleFor(await getLocale()));
  } catch (e) {
    if (e instanceof ToursError && e.kind === "not_found") notFound();
    throw e;
  }
  return <BookingAdminDetail booking={booking as unknown as AdminBookingDetail} />;
}
