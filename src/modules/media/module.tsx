import type { ExtendedModuleDefinition } from "@core/modules/types";
import { MediaPage } from "./pages/MediaPage";
import { StaffMediaPage } from "./pages/StaffMediaPage";

const mediaModule: ExtendedModuleDefinition = {
  id: "provider-media",
  name: "Provider Media",
  version: "2.1.0",
  kind: "extended-module",
  dependsOn: ["core"],
  basePath: "src/modules/media",
  routes: [
    { key: "provider.media", scope: "provider", path: "providers/:providerId/media", title: "Media", icon: "images", providerPermission: "manageMedia", component: MediaPage },
    { key: "staff.media", scope: "portal", path: "staff/:staffId/media", title: "My media", icon: "images", component: StaffMediaPage },
  ],
  navigation: [{ scope: "provider", label: "Media", hrefTemplate: "/providers/:providerId/media", icon: "images", routeKey: "provider.media", providerPermission: "manageMedia", order: 60 }],
};
export default mediaModule;
