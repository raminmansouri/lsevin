import { ProviderProfileForm } from "@/features/provider-portal/components/profile-form";
import { getProviderWorkspace } from "@/features/provider-portal/server/repository";
import { requireCurrentUserId } from "@/features/provider-portal/server/session";

export default async function ProviderProfilePage({ params }: { params: Promise<{ locale: string; providerId: string }> }) {
  const { locale, providerId } = await params;
  const userId = await requireCurrentUserId();
  const workspace = await getProviderWorkspace(userId, providerId, locale);

  return <ProviderProfileForm workspace={workspace} />;
}
