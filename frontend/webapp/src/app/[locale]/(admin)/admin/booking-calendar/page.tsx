import { BookingCalendarSettingsForm } from "@/features/booking-pro/admin/components/booking-calendar-settings-form";
import { listBookingCalendarSettings } from "@/features/booking-pro/server/booking-calendar-settings.repository";

export default async function AdminBookingCalendarPage() {
  const settings = await listBookingCalendarSettings();
  return <BookingCalendarSettingsForm settings={settings} />;
}
