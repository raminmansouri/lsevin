
import type { ExtendedModuleDefinition } from "@core/modules/types";
import { ProviderPage } from "./pages/ProviderPage";
import { AdminPage } from "./pages/AdminPage";

const moduleDefinition: ExtendedModuleDefinition = {
  id: "reporting-analytics",
  name: "Reporting & Analytics",
  version: "1.1.0",
  kind: "extended-module",
  dependsOn: ["core"],
  basePath: "src/modules/reporting-analytics",
  databaseSchema: "reporting_analytics",
  installMode: "optional",
  capabilities: ["reports.view_provider_dashboard", "reports.create_snapshot", "reports.export", "reports.view_admin_analytics"],
  migrations: ["migrations/001_reporting_analytics.sql"],
  routes: [
    { key: "reporting-analytics.provider", scope: "provider", path: "providers/:providerId/analytics", title: "Provider Analytics", icon: "bar-chart-3", providerPermission: "viewAnalytics", component: ProviderPage },
    { key: "reporting-analytics.admin", scope: "admin", path: "admin/analytics", title: "Analytics & Reports", icon: "bar-chart-3", adminPermission: "FINANCE_ADMIN", component: AdminPage },
  ],
  navigation: [
    { scope: "provider", label: "Analytics", hrefTemplate: "/providers/:providerId/analytics", icon: "bar-chart-3", routeKey: "reporting-analytics.provider", providerPermission: "viewAnalytics", order: 160 },
    { scope: "admin", label: "Analytics", hrefTemplate: "/admin/analytics", icon: "bar-chart-3", routeKey: "reporting-analytics.admin", adminPermission: "FINANCE_ADMIN", order: 160 },
  ],
};

export default moduleDefinition;
