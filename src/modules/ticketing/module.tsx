
import type { ExtendedModuleDefinition } from "@core/modules/types";
import { ProviderPage } from "./pages/ProviderPage";
import { AdminPage } from "./pages/AdminPage";

const moduleDefinition: ExtendedModuleDefinition = {
  id: "ticketing",
  name: "Ticketing",
  version: "1.1.0",
  kind: "extended-module",
  dependsOn: ["core"],
  basePath: "src/modules/ticketing",
  databaseSchema: "ticketing",
  installMode: "optional",
  capabilities: ["ticketing.create_ticket", "ticketing.reply", "ticketing.assign", "ticketing.close", "ticketing.add_internal_note"],
  migrations: ["migrations/001_ticketing.sql"],
  routes: [
    { key: "ticketing.provider", scope: "provider", path: "providers/:providerId/tickets", title: "Provider Tickets", icon: "support", providerPermission: "view", component: ProviderPage },
    { key: "ticketing.admin", scope: "admin", path: "admin/tickets", title: "Ticketing Inbox", icon: "support", adminPermission: "PROVIDER_ADMIN", component: AdminPage },
  ],
  navigation: [
    { scope: "provider", label: "Tickets", hrefTemplate: "/providers/:providerId/tickets", icon: "support", routeKey: "ticketing.provider", providerPermission: "view", order: 140 },
    { scope: "admin", label: "Tickets", hrefTemplate: "/admin/tickets", icon: "support", routeKey: "ticketing.admin", adminPermission: "PROVIDER_ADMIN", order: 140 },
  ],
};

export default moduleDefinition;
