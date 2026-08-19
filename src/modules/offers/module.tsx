import type { ExtendedModuleDefinition } from "@core/modules/types";
import { AdminOffersPage } from "./pages/AdminOffersPage";
import { OffersPage } from "./pages/OffersPage";

const offersModule: ExtendedModuleDefinition = {
  id: "provider-offers",
  name: "Provider Offers",
  version: "2.2.0",
  kind: "extended-module",
  dependsOn: ["core"],
  basePath: "src/modules/offers",
  routes: [
    { key: "provider.offers", scope: "provider", path: "providers/:providerId/offers", title: "Offers", icon: "gift", providerPermission: "manageServices", component: OffersPage },
    { key: "offers.admin", scope: "admin", path: "admin/offers", title: "Offers", icon: "gift", adminPermission: "CONTENT_ADMIN", component: AdminOffersPage },
  ],
  navigation: [
    { scope: "provider", label: "Offers", hrefTemplate: "/providers/:providerId/offers", icon: "gift", routeKey: "provider.offers", providerPermission: "manageServices", order: 90 },
    { scope: "admin", label: "Offers", hrefTemplate: "/admin/offers", icon: "gift", routeKey: "offers.admin", adminPermission: "CONTENT_ADMIN", order: 16 },
  ],
};
export default offersModule;
