import { BookingCalendarSettingsForm } from "@/features/booking-pro/admin/components/booking-calendar-settings-form";
import { BookingSettingsForm } from "@/features/booking-pro/admin/components/booking-settings-form";
import { listBookingCalendarSettings } from "@/features/booking-pro/server/booking-calendar-settings.repository";
import { getBookingSettings } from "@/features/booking-pro/server/booking-settings.repository";

export default async function AdminBookingCalendarPage() {
  const [settings, bookingSettings] = await Promise.all([
    listBookingCalendarSettings(),
    getBookingSettings(),
  ]);
  return (
    <>
      <BookingCalendarSettingsForm settings={settings} />
      <BookingSettingsForm settings={bookingSettings} />
    </>
  );
}
