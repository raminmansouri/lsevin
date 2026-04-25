"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import sql from "@/config/database/db";

import { requireAuthenticatedUserId } from "./auth";
import {
  deleteMedicalProfileAllergy,
  deleteMedicalProfileCondition,
  deleteMedicalProfileMedication,
  insertMedicalProfileAllergy,
  insertMedicalProfileCondition,
  insertMedicalProfileDocument,
  insertMedicalProfileMedication,
  resolveCustomerFromIdentityUser,
  upsertMedicalProfileEmergencyContact,
} from "./queries";
import { storeMedicalProfileFile } from "./storage";

const allergySchema = z.object({
  name: z.string().trim().min(1).max(200),
  severity: z.enum(["mild", "moderate", "severe"]),
  notes: z.string().trim().max(2000).optional().nullable(),
});

const medicationSchema = z.object({
  name: z.string().trim().min(1).max(200),
  dosage: z.string().trim().min(1).max(100),
  frequency: z.string().trim().min(1).max(100),
  notes: z.string().trim().max(2000).optional().nullable(),
});

const conditionSchema = z.object({
  name: z.string().trim().min(1).max(200),
  diagnosedDate: z.string().trim().optional().nullable(),
  notes: z.string().trim().max(2000).optional().nullable(),
});

const emergencyContactSchema = z.object({
  name: z.string().trim().min(1).max(200),
  phone: z.string().trim().min(1).max(40),
  relationship: z.string().trim().min(1).max(100),
});

const idSchema = z.string().uuid();

function revalidateMedicalProfilePaths(): void {
  revalidatePath("/medical-profile");
  revalidatePath("/app/medical-profile");
}

export async function addAllergyAction(input: unknown) {
  const identityUserId = await requireAuthenticatedUserId();
  const { customerId } = await resolveCustomerFromIdentityUser(sql, identityUserId);
  const parsed = allergySchema.parse(input);

  const created = await insertMedicalProfileAllergy(sql, customerId, parsed);
  revalidateMedicalProfilePaths();
  return created;
}

export async function removeAllergyAction(allergyId: string) {
  const identityUserId = await requireAuthenticatedUserId();
  const { customerId } = await resolveCustomerFromIdentityUser(sql, identityUserId);
  const parsedId = idSchema.parse(allergyId);

  await deleteMedicalProfileAllergy(sql, customerId, parsedId);
  revalidateMedicalProfilePaths();
  return { ok: true };
}

export async function addMedicationAction(input: unknown) {
  const identityUserId = await requireAuthenticatedUserId();
  const { customerId } = await resolveCustomerFromIdentityUser(sql, identityUserId);
  const parsed = medicationSchema.parse(input);

  const created = await insertMedicalProfileMedication(sql, customerId, parsed);
  revalidateMedicalProfilePaths();
  return created;
}

export async function removeMedicationAction(medicationId: string) {
  const identityUserId = await requireAuthenticatedUserId();
  const { customerId } = await resolveCustomerFromIdentityUser(sql, identityUserId);
  const parsedId = idSchema.parse(medicationId);

  await deleteMedicalProfileMedication(sql, customerId, parsedId);
  revalidateMedicalProfilePaths();
  return { ok: true };
}

export async function addConditionAction(input: unknown) {
  const identityUserId = await requireAuthenticatedUserId();
  const { customerId } = await resolveCustomerFromIdentityUser(sql, identityUserId);
  const parsed = conditionSchema.parse(input);

  const created = await insertMedicalProfileCondition(sql, customerId, parsed);
  revalidateMedicalProfilePaths();
  return created;
}

export async function removeConditionAction(conditionId: string) {
  const identityUserId = await requireAuthenticatedUserId();
  const { customerId } = await resolveCustomerFromIdentityUser(sql, identityUserId);
  const parsedId = idSchema.parse(conditionId);

  await deleteMedicalProfileCondition(sql, customerId, parsedId);
  revalidateMedicalProfilePaths();
  return { ok: true };
}

export async function saveEmergencyContactAction(input: unknown) {
  const identityUserId = await requireAuthenticatedUserId();
  const { customerId } = await resolveCustomerFromIdentityUser(sql, identityUserId);
  const parsed = emergencyContactSchema.parse(input);

  const saved = await upsertMedicalProfileEmergencyContact(sql, customerId, parsed);
  revalidateMedicalProfilePaths();
  return saved;
}

export async function uploadMedicalDocumentAction(formData: FormData) {
  const identityUserId = await requireAuthenticatedUserId();
  const { customerId } = await resolveCustomerFromIdentityUser(sql, identityUserId);

  const file = formData.get("file");
  const title = String(formData.get("title") ?? "").trim();

  if (!(file instanceof File)) {
    throw new Error("A file is required.");
  }

  const stored = await storeMedicalProfileFile(file, customerId);
  const created = await insertMedicalProfileDocument(sql, customerId, {
    title: title || file.name.replace(/\.[^/.]+$/, ""),
    fileName: stored.fileName,
    fileUrl: stored.fileUrl,
    mimeType: stored.mimeType,
    sizeBytes: stored.sizeBytes,
    createdBy: identityUserId,
    documentTypeId: 1001,
  });

  revalidateMedicalProfilePaths();
  return created;
}
