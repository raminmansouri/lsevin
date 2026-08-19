
import type { ExtendedModuleDefinition } from "@core/modules/types";
import { ProviderPage } from "./pages/ProviderPage";
import { AdminPage } from "./pages/AdminPage";

const moduleDefinition: ExtendedModuleDefinition = {
  id: "reviews-standalone",
  name: "Reviews",
  version: "1.1.0",
  kind: "extended-module",
  dependsOn: ["core"],
  basePath: "src/modules/reviews-standalone",
  databaseSchema: "reviews",
  installMode: "optional",
  capabilities: ["reviews.read", "reviews.reply", "reviews.moderate", "reviews.vote", "reviews.attach_image"],
  migrations: ["migrations/001_reviews_standalone.sql"],
  routes: [
    { key: "reviews-standalone.provider", scope: "provider", path: "providers/:providerId/reputation", title: "Reviews & Replies", icon: "reviews", providerPermission: "view", component: ProviderPage },
    { key: "reviews-standalone.admin", scope: "admin", path: "admin/reviews", title: "Reviews Moderation", icon: "reviews", adminPermission: "PROVIDER_ADMIN", component: AdminPage },
  ],
  navigation: [
    { scope: "provider", label: "Reputation", hrefTemplate: "/providers/:providerId/reputation", icon: "reviews", routeKey: "reviews-standalone.provider", providerPermission: "view", order: 145 },
    { scope: "admin", label: "Reputation", hrefTemplate: "/admin/reviews", icon: "reviews", routeKey: "reviews-standalone.admin", adminPermission: "PROVIDER_ADMIN", order: 145 },
  ],
};

export default moduleDefinition;
