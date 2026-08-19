
import type { ExtendedModuleDefinition } from "@core/modules/types";
import { ProviderPage } from "./pages/ProviderPage";
import { AdminPage } from "./pages/AdminPage";

const moduleDefinition: ExtendedModuleDefinition = {
  id: "media-library",
  name: "Media Library",
  version: "1.1.0",
  kind: "extended-module",
  dependsOn: ["core"],
  basePath: "src/modules/media-library",
  databaseSchema: "media_library",
  installMode: "optional",
  capabilities: ["media.upload", "media.attach_to_entity", "media.detach_from_entity", "media.reorder", "media.localize_alt_text", "media.moderate"],
  migrations: ["migrations/001_media_library.sql"],
  routes: [
    { key: "media-library.provider", scope: "provider", path: "providers/:providerId/media-library", title: "Provider Media Library", icon: "images", providerPermission: "manageMedia", component: ProviderPage },
    { key: "media-library.admin", scope: "admin", path: "admin/media-library", title: "Global Media Library", icon: "images", adminPermission: "PROVIDER_ADMIN", component: AdminPage },
  ],
  navigation: [
    { scope: "provider", label: "Media Library", hrefTemplate: "/providers/:providerId/media-library", icon: "images", routeKey: "media-library.provider", providerPermission: "manageMedia", order: 150 },
    { scope: "admin", label: "Media Library", hrefTemplate: "/admin/media-library", icon: "images", routeKey: "media-library.admin", adminPermission: "PROVIDER_ADMIN", order: 150 },
  ],
};

export default moduleDefinition;
