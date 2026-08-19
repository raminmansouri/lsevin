import { NextResponse } from "next/server";
import type { ExtendedModuleDefinition } from "@core/modules/types";
import { requireCurrentUser } from "@core/auth/session";
import { MyProvidersPage } from "./pages/MyProvidersPage";
import { ProviderSettingsPage } from "./pages/ProviderSettingsPage";
import { MembershipInvitationPage } from "./pages/MembershipInvitationPage";
import { listMyProviders } from "./repository";

const providerAccessModule: ExtendedModuleDefinition = {
  id: "provider-access",
  name: "Provider Access",
  version: "3.0.0",
  kind: "extended-module",
  dependsOn: ["core"],
  basePath: "src/modules/provider-access",
  migrations: ["migrations/001_provider_membership_lifecycle.sql"],
  routes: [
    { key: "portal.providers", scope: "portal", path: "providers", title: "My providers", icon: "building", component: MyProvidersPage },
    { key: "provider.invitation.accept", scope: "public", path: "membership-invitations/:invitationId", title: "Provider invitation", icon: "building", component: MembershipInvitationPage },
    { key: "provider.settings", scope: "provider", path: "providers/:providerId/settings", title: "Settings", icon: "settings", providerPermission: "manageMembers", component: ProviderSettingsPage },
  ],
  apiRoutes: [
    { key: "api.providers", method: "GET", path: "providers", handler: async () => { const user = await requireCurrentUser(); return NextResponse.json(await listMyProviders(user.id)); } },
  ],
  navigation: [
    { scope: "portal", label: "My providers", hrefTemplate: "/providers", icon: "building", routeKey: "portal.providers", order: 30 },
    { scope: "provider", label: "Settings", hrefTemplate: "/providers/:providerId/settings", icon: "settings", routeKey: "provider.settings", providerPermission: "manageMembers", order: 130 },
  ],
};
export default providerAccessModule;
