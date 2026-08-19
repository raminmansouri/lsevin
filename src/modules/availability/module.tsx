import type { ExtendedModuleDefinition } from "@core/modules/types";
import { AdminAvailabilityPage } from "./pages/AdminAvailabilityPage";
import { AvailabilityPage } from "./pages/AvailabilityPage";
import { StaffAvailabilityPage } from "./pages/StaffAvailabilityPage";

const availabilityModule: ExtendedModuleDefinition = {
  id: "provider-availability",
  name: "Provider Availability",
  version: "2.3.0",
  kind: "extended-module",
  dependsOn: ["core"],
  basePath: "src/modules/availability",
  routes: [
    { key: "provider.availability", scope: "provider", path: "providers/:providerId/availability", title: "Availability", icon: "calendar", providerPermission: "manageAvailability", component: AvailabilityPage },
    { key: "availability.admin", scope: "admin", path: "admin/availability", title: "Availability", icon: "calendar", adminPermission: "PROVIDER_ADMIN", component: AdminAvailabilityPage },
    { key: "staff.availability", scope: "portal", path: "staff/:staffId/availability", title: "My availability", icon: "calendar", component: StaffAvailabilityPage },
  ],
  navigation: [
    { scope: "provider", label: "Availability", hrefTemplate: "/providers/:providerId/availability", icon: "calendar", routeKey: "provider.availability", providerPermission: "manageAvailability", order: 70 },
    { scope: "admin", label: "Availability", hrefTemplate: "/admin/availability", icon: "calendar", routeKey: "availability.admin", adminPermission: "PROVIDER_ADMIN", order: 15 },
  ],
};
export default availabilityModule;
