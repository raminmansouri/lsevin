import { AvailabilityManager } from "@/features/provider-portal/components/availability-manager";
import {
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

  const [workspace, hours] = await Promise.all([
    getProviderWorkspace(userId, providerId, locale),
    listOperatingHours(userId, providerId),
  ]);

  return <AvailabilityManager workspace={workspace} hours={hours} />;
}
