import { invokeModuleCapability } from "@core/modules/moduleBus";
import type { TemplateNotificationPayload, TemplateNotificationResult } from "./types";

export async function sendTemplateNotification(payload: TemplateNotificationPayload): Promise<TemplateNotificationResult> {
  try {
    const result = await invokeModuleCapability<TemplateNotificationPayload, TemplateNotificationResult>({
      capability: "notifications.send_template",
      requestedByUserId: payload.recipientEntityType === "user" ? payload.recipientEntityId : undefined,
      source: {
        moduleCode: payload.sourceModule || "core",
        entityType: payload.sourceEntityType || "notification",
        entityId: payload.sourceEntityId || payload.templateKey,
      },
      payload,
    });
    if (!result.ok || !result.data) {
      return { delivered: false, skipped: true, reason: "capability_unavailable", templateKey: payload.templateKey, channels: [] };
    }
    return result.data;
  } catch (error) {
    console.error("[notifications] template dispatch failed", { templateKey: payload.templateKey, error });
    return { delivered: false, skipped: true, reason: "dispatch_failed", templateKey: payload.templateKey, channels: [] };
  }
}
