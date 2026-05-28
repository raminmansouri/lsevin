import { notFound } from "next/navigation";

import { ProviderResourceFormPage } from "@/features/provider-portal/components/resources/provider-resource-form-page";
import {
  getProviderResourceRow,
  getOptionsForResourceForm,
} from "@/features/provider-portal/server/resource-repository";
import { requireCurrentUserId } from "@/features/provider-portal/server/session";
import { hasPortalPermission } from "@/features/provider-portal/lib/permissions";
import type { ProviderPortalRole } from "@/features/provider-portal/types";

export default async function ProviderEditResourcePage({
  params,
}: {
  params: Promise<{
    locale: string;
    providerId: string;
    resource: string;
    recordId: string;
  }>;
}) {
  const { locale, providerId, resource, recordId } = await params;
  const userId = await requireCurrentUserId();

  try {
    const { config, row, role } = await getProviderResourceRow(
      userId,
      providerId,
      resource,
      recordId,
    );
    if (!config.update) notFound();
    const permission = config.updatePermission || config.permission;
    if (!hasPortalPermission(role as ProviderPortalRole, permission))
      throw new Error(
        "You do not have permission to edit this provider resource.",
      );
    const options = await getOptionsForResourceForm(providerId, config, locale);
    return (
      <ProviderResourceFormPage
        locale={locale}
        providerId={providerId}
        config={config}
        row={row}
        options={options}
      />
    );
  } catch (error) {
    if (error instanceof Error && error.message.includes("Unknown")) notFound();
    throw error;
  }
}
