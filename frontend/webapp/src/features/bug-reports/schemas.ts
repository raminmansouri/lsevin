import { z } from "zod/v4";

import {
  BUG_REPORT_AREAS,
  BUG_REPORT_PRIORITIES,
  BUG_REPORT_SEVERITIES,
  BUG_REPORT_STATUSES,
} from "./types";

const optionalUuid = z.preprocess((value) => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed || null;
}, z.guid().nullable());

const optionalText = (max = 4000) =>
  z.preprocess((value) => {
    if (typeof value !== "string") return null;
    const trimmed = value.trim();
    return trimmed || null;
  }, z.string().max(max).nullable());

export const createBugReportSchema = z.object({
  title: z.string().trim().min(4).max(180),
  description: z.string().trim().min(10).max(6000),
  expectedBehavior: optionalText(3000),
  actualBehavior: optionalText(3000),
  reproductionSteps: z.array(z.string().trim().min(1).max(1000)).max(20).default([]),
  sourceArea: z.enum(BUG_REPORT_AREAS).default("booking"),
  sourceUrl: optionalText(1000),
  severity: z.enum(BUG_REPORT_SEVERITIES).default("medium"),
  priority: z.enum(BUG_REPORT_PRIORITIES).default("normal"),
  bookingId: optionalUuid,
  providerId: optionalUuid,
  serviceId: optionalUuid,
  specialistId: optionalUuid,
  guestName: optionalText(160),
  guestEmail: optionalText(250),
  guestPhoneCountryCode: optionalText(5),
  guestPhone: optionalText(30),
  browserName: optionalText(120),
  operatingSystem: optionalText(120),
  deviceType: optionalText(80),
  appVersion: optionalText(80),
  environment: z.record(z.string(), z.unknown()).default({}),
});

export const adminBugReportFiltersSchema = z.object({
  q: z.string().trim().default(""),
  status: z.enum(["all", ...BUG_REPORT_STATUSES]).default("all"),
  severity: z.enum(["all", ...BUG_REPORT_SEVERITIES]).default("all"),
  priority: z.enum(["all", ...BUG_REPORT_PRIORITIES]).default("all"),
  area: z.enum(["all", ...BUG_REPORT_AREAS]).default("all"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(10).max(100).default(40),
  view: z.enum(["board", "list"]).default("board"),
  ownership: z.enum(["all", "assigned_to_me", "unassigned"]).default("all"),
});

export const updateBugReportStatusSchema = z.object({
  bugReportId: z.guid(),
  status: z.enum(BUG_REPORT_STATUSES),
  resolutionNote: optionalText(3000),
  path: z.string().trim().optional(),
});

export const updateBugReportPrioritySchema = z.object({
  bugReportId: z.guid(),
  priority: z.enum(BUG_REPORT_PRIORITIES),
  path: z.string().trim().optional(),
});

export const adminBugReportMessageSchema = z.object({
  bugReportId: z.guid(),
  body: z.string().trim().min(1).max(5000),
  isInternalNote: z.boolean().default(false),
  nextStatus: z.enum(BUG_REPORT_STATUSES).optional(),
  path: z.string().trim().optional(),
});

export const customerBugReportReplySchema = z.object({
  bugReportId: z.guid(),
  body: z.string().trim().min(1).max(5000),
  path: z.string().trim().optional(),
});


export const updateBugReportBoardColumnsSchema = z.object({
  locale: z.string().trim().min(2).max(12).default("en"),
  path: z.string().trim().optional(),
  labels: z.record(z.string(), z.string().trim().min(1).max(80)).default({}),
});

export const assignBugReportSchema = z.object({
  bugReportId: z.guid(),
  assignedToUserId: z.preprocess((value) => {
    if (typeof value !== "string") return null;
    const trimmed = value.trim();
    return trimmed || null;
  }, z.guid().nullable()),
  path: z.string().trim().optional(),
});

export function formDataString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export function formDataJson<T>(formData: FormData, key: string, fallback: T): T {
  const raw = formDataString(formData, key).trim();
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function formDataBoolean(formData: FormData, key: string): boolean {
  return ["1", "true", "yes", "on"].includes(formDataString(formData, key).toLowerCase());
}
