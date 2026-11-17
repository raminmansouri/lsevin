import { redirect } from "next/navigation";

// The admin create-booking page lives at /admin/bookings/new; keep old links working.
export default async function AddBookingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  redirect(`/${locale}/admin/bookings/new`);
}
