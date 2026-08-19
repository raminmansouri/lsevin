
import type { ExtendedModuleDefinition } from "@core/modules/types";
import { ProviderPage } from "./pages/ProviderPage";
import { AdminPage } from "./pages/AdminPage";
import { ModerationPage } from "./pages/ModerationPage";

const moduleDefinition: ExtendedModuleDefinition = {
  id: "provider-portal",
  name: "Provider Portal",
  version: "3.2.0",
  kind: "extended-module",
  dependsOn: ["core"],
  basePath: "src/modules/provider-portal",
  databaseSchema: "provider_portal_ext",
  installMode: "optional",
  capabilities: ["provider_portal.claim_profile", "provider_portal.approve_claim", "provider_portal.manage_profile", "provider_portal.manage_staff_schedule", "provider_portal.submit_content_draft", "provider_portal.moderate_content"],
  migrations: ["migrations/001_provider_portal.sql"],
  routes: [
    { key: "provider-portal.provider", scope: "provider", path: "providers/:providerId/portal", title: "Provider Portal Command Center", icon: "building", providerPermission: "manageMembers", component: ProviderPage },
    { key: "provider-portal.admin", scope: "admin", path: "admin/provider-claims", title: "Provider Claims & Ownership", icon: "building", adminPermission: "PROVIDER_ADMIN", component: AdminPage },
    { key: "provider-portal.moderation", scope: "admin", path: "admin/moderation", title: "Content Moderation", icon: "shield-check", adminPermission: "CONTENT_ADMIN", component: ModerationPage },
  ],
  apiRoutes: [
  ],
  navigation: [
    { scope: "provider", label: "Provider Portal", hrefTemplate: "/providers/:providerId/portal", icon: "building", routeKey: "provider-portal.provider", providerPermission: "manageMembers", order: 20 },
    { scope: "admin", label: "Provider Portal", hrefTemplate: "/admin/provider-claims", icon: "building", routeKey: "provider-portal.admin", adminPermission: "PROVIDER_ADMIN", order: 20 },
    { scope: "admin", label: "Moderation", hrefTemplate: "/admin/moderation", icon: "shield-check", routeKey: "provider-portal.moderation", adminPermission: "CONTENT_ADMIN", order: 22 },
  ],
};

export default moduleDefinition;
