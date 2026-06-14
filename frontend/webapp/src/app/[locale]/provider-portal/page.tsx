import { ProviderPortalHome } from "@/features/provider-portal/components/portal-home";
import {
  listMyProviderApplications,
  listMyProviders,
} from "@/features/provider-portal/server/repository";
import { requireCurrentUserId } from "@/features/provider-portal/server/session";

export default async function ProviderPortalPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const userId = await requireCurrentUserId();

  const [providers, applications] = await Promise.all([
    listMyProviders(userId, locale),
    listMyProviderApplications(userId, locale),
  ]);

  return (
    <ProviderPortalHome providers={providers} applications={applications} />
  );
}
