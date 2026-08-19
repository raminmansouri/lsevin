import type { ExtendedModuleDefinition } from "@core/modules/types";
import { ProviderSupportPage } from "./pages/ProviderSupportPage";
import { SupportPage } from "./pages/SupportPage";

const supportModule: ExtendedModuleDefinition = {
  id: "provider-support",
  name: "Provider Support",
  version: "2.0.0",
  kind: "extended-module",
  dependsOn: ["core"],
  basePath: "src/modules/support",
  routes: [
    { key: "portal.support", scope: "portal", path: "support", title: "Support", icon: "support", component: SupportPage },
    { key: "provider.support", scope: "provider", path: "providers/:providerId/support", title: "Provider support", icon: "support", providerPermission: "view", component: ProviderSupportPage },
  ],
  navigation: [
    { scope: "portal", label: "Support", hrefTemplate: "/support", icon: "support", routeKey: "portal.support", order: 200 },
    { scope: "provider", label: "Support", hrefTemplate: "/providers/:providerId/support", icon: "support", routeKey: "provider.support", providerPermission: "view", order: 120 },
  ],
};
export default supportModule;
