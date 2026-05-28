import { notFound } from "next/navigation";

import { ProviderResourceFormPage } from "@/features/provider-portal/components/resources/provider-resource-form-page";
import { getProviderResourceConfig } from "@/features/provider-portal/resource-config";
import { getOptionsForResourceForm } from "@/features/provider-portal/server/resource-repository";
import { requireCurrentUserId } from "@/features/provider-portal/server/session";
import { getMembershipRole } from "@/features/provider-portal/server/repository";
import { hasPortalPermission } from "@/features/provider-portal/lib/permissions";

export default async function ProviderNewResourcePage({
  params,
}: {
  params: Promise<{ locale: string; providerId: string; resource: string }>;
}) {
  const { locale, providerId, resource } = await params;
  const userId = await requireCurrentUserId();
  const config = getProviderResourceConfig(resource);
  if (!config || !config.create) notFound();

  const role = await getMembershipRole(userId, providerId);
  const permission = config.createPermission || config.permission;
  if (!role || !hasPortalPermission(role, permission))
    throw new Error(
      "You do not have permission to create this provider resource.",
    );

  const options = await getOptionsForResourceForm(providerId, config, locale);
  return (
    <ProviderResourceFormPage
      locale={locale}
      providerId={providerId}
      config={config}
      options={options}
    />
  );
}
