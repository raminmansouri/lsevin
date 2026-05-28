"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod/v4";

import { createAuthenticatedSafeAction } from "@/lib/safe-action";

import {
  deleteAdminNotificationTemplate,
  saveAdminNotificationTemplate,
} from "../db/admin-notification-templates.queries";
import {
  NOTIFICATION_CHANNELS,
  NOTIFICATION_TYPES,
  type NotificationChannel,
  type NotificationType,
  type TranslationRecord,
} from "../types/notification-template-types";

const notificationTypeSchema = z.enum(NOTIFICATION_TYPES as [NotificationType, ...NotificationType[]]);
const notificationChannelSchema = z.enum(
  NOTIFICATION_CHANNELS as [NotificationChannel, ...NotificationChannel[]],
);

function problem(title: string, status = 500, detail?: string) {
  return { title, status, detail };
}

function normalizeTemplateKey(value: unknown) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ".")
    .replace(/[^a-z0-9_.-]/g, "")
    .replace(/\.{2,}/g, ".")
    .replace(/^[_.-]+|[_.-]+$/g, "");
}

function normalizeTranslationRecord(value: unknown): TranslationRecord {
  const source =
    value && typeof value === "object" && !Array.isArray(value) && "translations" in value
      ? (value as { translations?: unknown }).translations
      : value;

  if (!source || typeof source !== "object" || Array.isArray(source)) return {};

  const output: TranslationRecord = {};
  for (const [key, raw] of Object.entries(source as Record<string, unknown>)) {
    if (typeof raw !== "string") continue;
    output[key] = raw.trimEnd();
  }
  return output;
}

function normalizeVariables(value: unknown): string[] {
  const raw = Array.isArray(value)
    ? value
    : String(value || "")
        .split(",")
        .map((item) => item.trim());

  return Array.from(
    new Set(
      raw
        .map((item) => String(item || "").trim())
        .filter(Boolean)
        .map((item) => item.replace(/^{{|}}$/g, "").trim())
        .filter(Boolean),
    ),
  );
}

const translationRecordSchema = z.preprocess(
  normalizeTranslationRecord,
  z.record(z.string(), z.string()).default({}),
);

const saveNotificationTemplateSchema = z.object({
  id: z.guid().optional().nullable(),
  templateKey: z.preprocess(
    normalizeTemplateKey,
    z
      .string()
      .min(2, "Template key is required.")
      .max(160, "Template key is too long.")
      .regex(/^[a-z0-9][a-z0-9_.-]*$/, "Use lowercase letters, numbers, dots, dashes, or underscores."),
  ),
  name: z.string().trim().min(2, "Name is required.").max(180),
  description: z.string().trim().max(1000).optional().nullable(),
  notificationType: notificationTypeSchema.default("system"),
  defaultChannels: z.array(notificationChannelSchema).min(1, "Select at least one delivery channel."),
  titleTranslations: translationRecordSchema,
  bodyTranslations: translationRecordSchema,
  emailSubjectTranslations: translationRecordSchema,
  emailBodyTranslations: translationRecordSchema,
  smsBodyTranslations: translationRecordSchema,
  pushTitleTranslations: translationRecordSchema,
  pushBodyTranslations: translationRecordSchema,
  variables: z.preprocess(normalizeVariables, z.array(z.string()).default([])),
  isActive: z.boolean().default(true),
  metadata: z.record(z.string(), z.unknown()).default({}),
});

const deleteNotificationTemplateSchema = z.object({
  id: z.guid(),
});

export type SaveNotificationTemplateInput = z.input<typeof saveNotificationTemplateSchema>;

export const saveNotificationTemplateAction = createAuthenticatedSafeAction(
  saveNotificationTemplateSchema,
  async (input) => {
    try {
      const id = await saveAdminNotificationTemplate(input);
      revalidatePath("/admin/notification-templates");
      return { data: id, error: undefined };
    } catch (error: any) {
      console.error("saveNotificationTemplateAction failed", error);
      return {
        data: undefined,
        error: problem("Could not save notification template.", 500, error?.message),
        payload: input,
      };
    }
  },
  { adminRequired: true },
);

export const deleteNotificationTemplateAction = createAuthenticatedSafeAction(
  deleteNotificationTemplateSchema,
  async (input) => {
    try {
      await deleteAdminNotificationTemplate(input.id);
      revalidatePath("/admin/notification-templates");
      return { data: input.id, error: undefined };
    } catch (error: any) {
      console.error("deleteNotificationTemplateAction failed", error);
      return {
        data: undefined,
        error: problem("Could not delete notification template.", 500, error?.message),
        payload: input,
      };
    }
  },
  { adminRequired: true },
);
