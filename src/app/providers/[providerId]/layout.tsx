import type { ReactNode } from "react";
import { requireCurrentUser } from "@core/auth/session";
import { requireProviderPermission } from "@core/auth/permissions";
import { PortalShell } from "@core/ui/PortalShell";

export default async function ProviderWorkspaceLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ providerId: string }>;
}) {
  const { providerId } = await params;
  const user = await requireCurrentUser(`/providers/${providerId}/dashboard`);
  await requireProviderPermission(user.id, providerId, "view");
  return <PortalShell providerId={providerId}>{children}</PortalShell>;
}
