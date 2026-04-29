import { BookingsManager } from "@/features/provider-portal/components/bookings-manager";
import { getProviderWorkspace, listProviderBookings } from "@/features/provider-portal/server/repository";
import { requireCurrentUserId } from "@/features/provider-portal/server/session";

export default async function ProviderBookingsPage({ params }: { params: Promise<{ locale: string; providerId: string }> }) {
  const { locale, providerId } = await params;
  const userId = await requireCurrentUserId();

  const [workspace, bookings] = await Promise.all([
    getProviderWorkspace(userId, providerId, locale),
    listProviderBookings(userId, providerId, locale),
  ]);

  return <BookingsManager workspace={workspace} bookings={bookings} />;
}
