import type { ExtendedModuleDefinition } from "@core/modules/types";
import { AdminProvidersPage } from "./pages/AdminProvidersPage";
import { ProviderProfilePage } from "./pages/ProviderProfilePage";

const providersModule: ExtendedModuleDefinition = {
  id: "provider-profile",
  name: "Provider Profile",
  version: "2.2.0",
  kind: "extended-module",
  dependsOn: ["core"],
  basePath: "src/modules/providers",
  routes: [
    { key: "provider.profile", scope: "provider", path: "providers/:providerId/profile", title: "Profile", icon: "building", providerPermission: "manageProfile", component: ProviderProfilePage },
    { key: "providers.admin", scope: "admin", path: "admin/providers", title: "Providers", icon: "building", adminPermission: "PROVIDER_ADMIN", component: AdminProvidersPage },
  ],
  navigation: [
    { scope: "provider", label: "Profile", hrefTemplate: "/providers/:providerId/profile", icon: "building", routeKey: "provider.profile", providerPermission: "manageProfile", order: 30 },
    { scope: "admin", label: "Providers", hrefTemplate: "/admin/providers", icon: "building", routeKey: "providers.admin", adminPermission: "PROVIDER_ADMIN", order: 12 },
  ],
};
export default providersModule;
