import { getPortalLocale } from "@core/i18n/server";
import { EmptyState } from "@core/ui/EmptyState";
import { PageHeader } from "@core/ui/PageHeader";
import type { ModulePageProps } from "@core/modules/types";
import { BookingsTable } from "../components/BookingsTable";
import { listProviderBookings } from "../repository";

export async function BookingsPage({ params }: ModulePageProps) {
  const providerId = params.providerId;
  const locale = await getPortalLocale();
  const bookings = await listProviderBookings(providerId);
  const fa = locale.locale === "fa";
  return <div><PageHeader title={fa ? "رزروها" : "Bookings"} description={fa ? "رزروها را بررسی کنید و وضعیت و یادداشت ارائه‌دهنده را به‌روزرسانی کنید." : "Review bookings, update provider notes and status."} />{bookings.length ? <BookingsTable providerId={providerId} bookings={bookings} locale={locale.header} /> : <EmptyState title={fa ? "هنوز رزروی ثبت نشده است" : "No bookings yet"} />}</div>;
}
