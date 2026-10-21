import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { adminPageActor } from "@/features/tours/server/admin/page-actor";
import { supportBooking } from "@/features/tours/server/admin/support";
import { ToursError } from "@/features/tours/server/platform/errors";
import { BookingSupportView } from "@/features/tours/ui/admin/booking-support";

type Props = { params: Promise<{ locale: string; bookingId: string }> };

export async function generateMetadata() {
  const t = await getTranslations("TourAdmin.booking");
  return { title: t("title") };
}

export default async function BookingSupportPage({ params }: Props) {
  const actor = await adminPageActor();
  const { bookingId } = await params;
  try {
    const booking = await supportBooking(actor, bookingId);
    return <BookingSupportView booking={booking} />;
  } catch (e) {
    if (e instanceof ToursError && (e.kind === "not_found" || e.code === "booking_not_found")) notFound();
    throw e;
  }
}
