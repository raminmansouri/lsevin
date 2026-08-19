
import type { ExtendedModuleDefinition } from "@core/modules/types";
import type { ModuleCapabilityRequest } from "@core/modules/contracts";
import { registerModuleCapability } from "@core/modules/moduleBus";
import { ProviderPage } from "./pages/ProviderPage";
import { AdminPage } from "./pages/AdminPage";
import { StaffNotificationsPage } from "./pages/StaffNotificationsPage";
import { handleLSevinNotificationEvent } from "./api";
import { createAudienceSubscription, dispatchTemplateNotification, recordLSevinNotificationEvent } from "./repository";
import type { LSevinNotificationEventPayload, SubscribeAudiencePayload } from "./contracts/bridge";
import { createInboxNotification } from "./repository";
import type { TemplateNotificationPayload, TemplateNotificationResult } from "@core/notifications/types";

let capabilitiesRegistered = false;
function registerNotificationCapabilities() {
  if (capabilitiesRegistered) return;
  capabilitiesRegistered = true;
  registerModuleCapability<{ recipientEntityType: string; recipientEntityId: string; title: string; body: string; sourceModule?: string; sourceEntityType?: string; sourceEntityId?: string; templateKey?: string; channel?: string; metadata?: Record<string, unknown> }>("notifications.send", async (request) => {
    await createInboxNotification(request.payload);
    return { ok: true, message: "Notification created by Notifications module.", data: { delivered: true } };
  });
  registerModuleCapability<TemplateNotificationPayload, TemplateNotificationResult>("notifications.send_template", async (request) => {
    const result = await dispatchTemplateNotification(request.payload);
    return { ok: true, message: result.skipped ? "Template notification was skipped." : "Template notification accepted.", data: result };
  });
}
registerNotificationCapabilities();


let notificationBridgeCapabilitiesRegistered = false;
function registerNotificationBridgeCapabilities() {
  if (notificationBridgeCapabilitiesRegistered) return;
  notificationBridgeCapabilitiesRegistered = true;
  registerModuleCapability<LSevinNotificationEventPayload>("notifications.emit_from_lsevin", async (request: ModuleCapabilityRequest<LSevinNotificationEventPayload>) => {
    const event = await recordLSevinNotificationEvent(request.payload);
    return { ok: true, message: "LSevin platform event was recorded and delivered to the portal inbox.", data: event };
  });
  registerModuleCapability<SubscribeAudiencePayload>("notifications.subscribe_audience", async (request: ModuleCapabilityRequest<SubscribeAudiencePayload>) => {
    const subscription = await createAudienceSubscription(request.payload);
    return { ok: true, message: "Audience subscription connected to the portal notification platform.", data: subscription };
  });
}
registerNotificationBridgeCapabilities();

const moduleDefinition: ExtendedModuleDefinition = {
  id: "notifications-module",
  name: "Notifications",
  version: "1.2.0",
  kind: "extended-module",
  dependsOn: ["core"],
  basePath: "src/modules/notifications-module",
  databaseSchema: "notifications_ext",
  installMode: "optional",
  capabilities: ["notifications.send", "notifications.send_template", "notifications.template.manage", "notifications.subscribe_provider", "notifications.read_inbox", "notifications.emit_from_lsevin", "notifications.subscribe_audience"],
  migrations: ["migrations/001_notifications_module.sql", "migrations/002_notifications_bridge.sql", "migrations/031_reviews_workflow_templates.sql", "migrations/032_booking_lifecycle_templates.sql"],
  routes: [
    { key: "notifications-module.provider", scope: "provider", path: "providers/:providerId/notifications", title: "Provider Notifications", icon: "bell", providerPermission: "view", component: ProviderPage },
    { key: "notifications-module.staff", scope: "portal", path: "staff/:staffId/notifications", title: "My notifications", icon: "bell", component: StaffNotificationsPage },
    { key: "notifications-module.admin", scope: "admin", path: "admin/notifications", title: "Notification Templates", icon: "bell", adminPermission: "PROVIDER_ADMIN", component: AdminPage },
  ],
  apiRoutes: [
    { key: "notifications-module.lsevin.bridge", public: true, method: "POST", path: "public/lsevin/notifications/events", handler: handleLSevinNotificationEvent },
  ],
  navigation: [
    { scope: "provider", label: "Notifications", hrefTemplate: "/providers/:providerId/notifications", icon: "bell", routeKey: "notifications-module.provider", providerPermission: "view", order: 165 },
    { scope: "admin", label: "Notifications", hrefTemplate: "/admin/notifications", icon: "bell", routeKey: "notifications-module.admin", adminPermission: "PROVIDER_ADMIN", order: 165 },
  ],
};

export default moduleDefinition;
