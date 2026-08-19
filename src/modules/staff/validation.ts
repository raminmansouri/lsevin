import { z } from "zod";
import { PORTAL_LOCALES } from "@core/i18n/config";
import type { StaffCopy } from "./i18n/copy";

const uuid = z.string().uuid();
const mediaReference = z.string().trim().max(2000);
const shortText = z.string().trim().max(250);
const longText = z.string().trim().max(20000);

function sanitizeTranslations(value: Record<string, string>, schema: z.ZodString) {
  const result: Record<string, string> = {};
  for (const locale of PORTAL_LOCALES) {
    const raw = String(value[locale.header] ?? value[locale.locale] ?? "").trim();
    if (raw) result[locale.header] = schema.parse(raw);
  }
  return result;
}

export function validateStaffIdentifiers(copy: StaffCopy, input: { providerId?: string; providerStaffId?: string; staffId?: string }) {
  try {
    return {
      providerId: input.providerId ? uuid.parse(input.providerId) : "",
      providerStaffId: input.providerStaffId ? uuid.parse(input.providerStaffId) : "",
      staffId: input.staffId ? uuid.parse(input.staffId) : "",
    };
  } catch {
    throw new Error(copy.invalidIdentifier);
  }
}

export function validateStaffProfileInput(copy: StaffCopy, input: {
  nameTranslations: Record<string, string>;
  titleTranslations: Record<string, string>;
  specialtyTranslations: Record<string, string>;
  biographyTranslations: Record<string, string>;
  profileImageUrl?: string;
}) {
  try {
    const nameTranslations = sanitizeTranslations(input.nameTranslations, shortText);
    if (!Object.values(nameTranslations).some(Boolean)) throw new Error(copy.nameRequired);
    return {
      nameTranslations,
      titleTranslations: sanitizeTranslations(input.titleTranslations, shortText),
      specialtyTranslations: sanitizeTranslations(input.specialtyTranslations, shortText),
      biographyTranslations: sanitizeTranslations(input.biographyTranslations, longText),
      profileImageUrl: mediaReference.parse(String(input.profileImageUrl || "")),
    };
  } catch (error) {
    if (error instanceof Error && error.message === copy.nameRequired) throw error;
    throw new Error(copy.invalidProfileData);
  }
}

export function validateAdminReason(copy: StaffCopy, reason: string, requiredMessage?: string) {
  const clean = String(reason || "").trim();
  if (requiredMessage && !clean) throw new Error(requiredMessage);
  try {
    return z.string().max(1000).parse(clean);
  } catch {
    throw new Error(copy.invalidProfileData);
  }
}
