import type { ExtendedModuleDefinition } from "@core/modules/types";
import { AdminDashboardPage } from "./pages/AdminDashboardPage";
import { ProviderDashboardPage } from "./pages/ProviderDashboardPage";
import { UserDashboardPage } from "./pages/UserDashboardPage";

const dashboardModule: ExtendedModuleDefinition = {
  id: "provider-dashboard",
  name: "Dashboard",
  version: "2.3.0",
  kind: "extended-module",
  dependsOn: ["core"],
  basePath: "src/modules/dashboard",
  routes: [
    { key: "portal.dashboard", scope: "portal", path: "dashboard", title: "Dashboard", icon: "dashboard", component: UserDashboardPage },
    { key: "provider.dashboard", scope: "provider", path: "providers/:providerId/dashboard", title: "Provider overview", icon: "dashboard", providerPermission: "view", component: ProviderDashboardPage },
    { key: "admin.dashboard", scope: "admin", path: "admin", title: "Admin Control Center", icon: "dashboard", adminPermission: "ADMIN_PORTAL", component: AdminDashboardPage },
  ],
  navigation: [
    { scope: "portal", label: "Dashboard", hrefTemplate: "/dashboard", icon: "dashboard", routeKey: "portal.dashboard", order: 20 },
    { scope: "provider", label: "Overview", hrefTemplate: "/providers/:providerId/dashboard", icon: "dashboard", routeKey: "provider.dashboard", order: 10 },
    { scope: "admin", label: "Admin overview", hrefTemplate: "/admin", icon: "dashboard", routeKey: "admin.dashboard", adminPermission: "ADMIN_PORTAL", order: 1 },
  ],
};
export default dashboardModule;
