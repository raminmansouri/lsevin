import { notFound } from "next/navigation";

import { ProviderResourceListPage } from "@/features/provider-portal/components/resources/provider-resource-list-page";
import { listProviderResourceRows } from "@/features/provider-portal/server/resource-repository";
import { requireCurrentUserId } from "@/features/provider-portal/server/session";

export default async function ProviderManageResourcePage({
  params,
}: {
  params: Promise<{ locale: string; providerId: string; resource: string }>;
}) {
  const { locale, providerId, resource } = await params;
  const userId = await requireCurrentUserId();

  try {
    const { config, rows, role } = await listProviderResourceRows(
      userId,
      providerId,
      resource,
    );
    return (
      <ProviderResourceListPage
        locale={locale}
        providerId={providerId}
        config={config}
        rows={rows}
        role={role}
      />
    );
  } catch (error) {
    if (error instanceof Error && error.message.includes("Unknown")) notFound();
    throw error;
  }
}
