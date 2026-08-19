import { NextResponse } from "next/server";
import type { ExtendedModuleDefinition } from "@core/modules/types";
import { AdminServicesPage } from "./pages/AdminServicesPage";
import { EditServicePage } from "./pages/EditServicePage";
import { NewServicePage } from "./pages/NewServicePage";
import { ServicesPage } from "./pages/ServicesPage";
import { StaffServicePricingPage } from "./pages/StaffServicePricingPage";
import { listProviderServices } from "./repository";

const servicesModule: ExtendedModuleDefinition = {
  id: "provider-services",
  name: "Provider Services",
  version: "2.2.0",
  kind: "extended-module",
  dependsOn: ["core"],
  basePath: "src/modules/services",
  routes: [
    { key: "provider.services", scope: "provider", path: "providers/:providerId/services", title: "Services", icon: "services", providerPermission: "manageServices", component: ServicesPage },
    { key: "provider.services.new", scope: "provider", path: "providers/:providerId/services/new", title: "New service", icon: "services", providerPermission: "manageServices", component: NewServicePage },
    { key: "provider.services.edit", scope: "provider", path: "providers/:providerId/services/:serviceId/edit", title: "Edit service", icon: "services", providerPermission: "manageServices", component: EditServicePage },
    { key: "services.admin", scope: "admin", path: "admin/services", title: "Services", icon: "services", adminPermission: "PROVIDER_ADMIN", component: AdminServicesPage },
    { key: "staff.services.pricing", scope: "portal", path: "staff/:staffId/services/pricing", title: "My service prices", icon: "services", component: StaffServicePricingPage },
  ],
  apiRoutes: [
    { key: "api.provider.services", method: "GET", path: "providers/:providerId/services", providerPermission: "view", handler: async ({ params }) => NextResponse.json(await listProviderServices(params.providerId)) },
  ],
  navigation: [
    { scope: "provider", label: "Services", hrefTemplate: "/providers/:providerId/services", icon: "services", routeKey: "provider.services", providerPermission: "manageServices", order: 40 },
    { scope: "admin", label: "Services", hrefTemplate: "/admin/services", icon: "services", routeKey: "services.admin", adminPermission: "PROVIDER_ADMIN", order: 13 },
  ],
};
export default servicesModule;
