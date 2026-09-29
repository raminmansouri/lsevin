import "server-only";

import { addCaseRequirement } from "@/features/patients/server/cases-repository";
import {
  addPatientAllergy,
  addPatientCondition,
  addPatientMedication,
  addPatientProcedure,
} from "@/features/patients/server/clinical-repository";
import type { SupportMessage } from "../types";
import type { AddClinicalRecordFromConversationInput, SendRequirementRequestInput } from "../schemas";
import { insertStructuredMessage } from "./repository";

/**
 * Structured "ask for a file/info" sent from inside a conversation. Thin
 * wrapper, no new domain logic: creates a REAL patient.medical_case_
 * requirements row through the existing addCaseRequirement() -- the exact
 * same function the admin case dashboard and the provider portal's
 * createRequirementAction already call -- so this shows up in My Cases too,
 * not just as a chat bubble. The message just records that it happened.
 */
export async function requestFileInConversation(input: SendRequirementRequestInput): Promise<SupportMessage> {
  const requirement = await addCaseRequirement({
    medicalCaseId: input.medicalCaseId,
    requirementType: input.requirementType,
    title: input.title,
    description: input.description,
    isMandatory: input.isMandatory,
    maxAgeHours: input.maxAgeHours,
    createdBy: input.actorUserId ?? null,
  });

  return insertStructuredMessage({
    conversationId: input.conversationId,
    senderType: input.actorProviderId ? "provider" : "agent",
    senderUserId: input.actorUserId,
    senderProviderId: input.actorProviderId,
    messageType: "requirement_request",
    body: input.title,
    metadata: {
      requirementId: requirement.id,
      medicalCaseId: input.medicalCaseId,
      requirementType: input.requirementType,
      title: input.title,
      isMandatory: requirement.isMandatory,
    },
  });
}

function requireField(payload: Record<string, unknown>, field: string): string {
  const value = payload[field];
  if (typeof value !== "string" || !value.trim()) throw new Error(`${field} is required to add this record.`);
  return value;
}

/**
 * Structured "write to the medical record" sent from inside a conversation.
 * Dispatches to the existing clinical-repository add* functions by
 * recordType -- not a parallel structure. From the provider portal, pass
 * sourceType "doctor" / verificationStatus "verified" (matches the trust
 * tier addProcedureToCase/addMedicationToCase already use in
 * lsevin-portal's medical-cases module) -- an admin-entered record keeps
 * each function's existing default provenance instead.
 */
export async function addClinicalRecordFromConversation(input: AddClinicalRecordFromConversationInput): Promise<SupportMessage> {
  const payload = input.payload;
  const provenance = input.actorProviderId
    ? { sourceType: "doctor", verificationStatus: "verified" }
    : {};
  let summary: string;
  let recordId: string;

  switch (input.recordType) {
    case "condition": {
      const displayName = requireField(payload, "displayName");
      const row = await addPatientCondition({
        patientId: input.patientId,
        displayName,
        clinicalStatus: typeof payload.clinicalStatus === "string" ? payload.clinicalStatus : undefined,
        notes: typeof payload.notes === "string" ? payload.notes : undefined,
        createdBy: input.actorUserId ?? null,
        ...provenance,
      });
      summary = displayName;
      recordId = row.id;
      break;
    }
    case "allergy": {
      const category = requireField(payload, "category");
      const row = await addPatientAllergy({
        patientId: input.patientId,
        category,
        substance: typeof payload.substance === "string" ? payload.substance : undefined,
        reaction: typeof payload.reaction === "string" ? payload.reaction : undefined,
        notes: typeof payload.notes === "string" ? payload.notes : undefined,
        createdBy: input.actorUserId ?? null,
        ...provenance,
      });
      summary = (typeof payload.substance === "string" && payload.substance) || category;
      recordId = row.id;
      break;
    }
    case "medication": {
      const name = requireField(payload, "name");
      const row = await addPatientMedication({
        patientId: input.patientId,
        name,
        dose: typeof payload.dose === "string" ? payload.dose : undefined,
        frequency: typeof payload.frequency === "string" ? payload.frequency : undefined,
        notes: typeof payload.notes === "string" ? payload.notes : undefined,
        createdBy: input.actorUserId ?? null,
        ...provenance,
      });
      summary = name;
      recordId = row.id;
      break;
    }
    case "procedure": {
      const procedureName = requireField(payload, "procedureName");
      const performedFrom = requireField(payload, "performedFrom");
      const row = await addPatientProcedure({
        patientId: input.patientId,
        procedureName,
        performedFrom,
        notes: typeof payload.notes === "string" ? payload.notes : undefined,
        createdBy: input.actorUserId ?? null,
        ...provenance,
      });
      summary = procedureName;
      recordId = row.id;
      break;
    }
  }

  return insertStructuredMessage({
    conversationId: input.conversationId,
    senderType: input.actorProviderId ? "provider" : "agent",
    senderUserId: input.actorUserId,
    senderProviderId: input.actorProviderId,
    messageType: "clinical_record",
    body: summary,
    metadata: {
      recordType: input.recordType,
      recordId,
      medicalCaseId: input.medicalCaseId,
      patientId: input.patientId,
      summary,
    },
  });
}
