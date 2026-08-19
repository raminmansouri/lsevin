import type { ExtendedModuleDefinition } from "@core/modules/types";
import { ProviderManagePage } from "./pages/ProviderManagePage";

const manageModule: ExtendedModuleDefinition = {
  id: "provider-management-hub",
  name: "Provider Management Hub",
  version: "2.0.0",
  kind: "extended-module",
  dependsOn: ["core"],
  basePath: "src/modules/manage",
  routes: [{ key: "provider.manage", scope: "provider", path: "providers/:providerId/manage", title: "Manage", icon: "wrench", providerPermission: "view", component: ProviderManagePage }],
  navigation: [{ scope: "provider", label: "Manage", hrefTemplate: "/providers/:providerId/manage", icon: "wrench", routeKey: "provider.manage", providerPermission: "view", order: 20 }],
};
export default manageModule;
