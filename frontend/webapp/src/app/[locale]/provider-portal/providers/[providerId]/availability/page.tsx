import { AvailabilityManager } from "@/features/provider-portal/components/availability-manager";
import { BlockedHoursManager } from "@/features/provider-portal/components/blocked-hours-manager";
import {
  getBlockedHoursDay,
  getProviderWorkspace,
  listOperatingHours,
} from "@/features/provider-portal/server/repository";
import { requireCurrentUserId } from "@/features/provider-portal/server/session";

export default async function ProviderAvailabilityPage({
  params,
}: {
  params: Promise<{ locale: string; providerId: string }>;
}) {
  const { locale, providerId } = await params;
  const userId = await requireCurrentUserId();
  const today = new Date().toISOString().slice(0, 10);

  const [workspace, hours, blockedHoursDay] = await Promise.all([
    getProviderWorkspace(userId, providerId, locale),
    listOperatingHours(userId, providerId),
    getBlockedHoursDay(userId, providerId, today),
  ]);

  return (
    <div className="space-y-6">
      <AvailabilityManager workspace={workspace} hours={hours} />
      <BlockedHoursManager workspace={workspace} day={blockedHoursDay} />
    </div>
  );
}
