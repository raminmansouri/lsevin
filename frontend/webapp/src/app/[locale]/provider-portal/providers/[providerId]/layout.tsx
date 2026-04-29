import type { ReactNode } from "react";
import { ProviderPortalShell } from "@/features/provider-portal/components/portal-shell";
import { getProviderWorkspace } from "@/features/provider-portal/server/repository";
import { requireCurrentUserId } from "@/features/provider-portal/server/session";

export default async function ProviderWorkspaceLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string; providerId: string }>;
}) {
  const { locale, providerId } = await params;
  const userId = await requireCurrentUserId();
  const workspace = await getProviderWorkspace(userId, providerId, locale);

  return (
    <ProviderPortalShell locale={locale} workspace={workspace}>
      {children}
    </ProviderPortalShell>
  );
}
