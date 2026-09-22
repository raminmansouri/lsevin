import "server-only";

import db from "@/config/database/db";

/**
 * patient.audit_log writer (V0.8). Append-only at the DB level (see
 * db/migrations/0048_patient_foundation.sql's trg_patient_audit_immutable) --
 * this helper only ever inserts.
 */
export type PatientAuditAction =
  | "patient_created"
  | "patient_updated"
  | "identifier_added"
  | "identifier_verified"
  | "account_linked"
  | "account_unlinked"
  | "contact_added"
  | "address_added"
  | "note_added"
  | "note_archived"
  | "condition_added"
  | "condition_archived"
  | "procedure_added"
  | "procedure_archived"
  | "allergy_added"
  | "allergy_archived"
  | "medication_added"
  | "medication_archived"
  | "product_usage_added"
  | "product_usage_archived"
  | "symptom_added"
  | "symptom_archived"
  | "document_added"
  | "document_replaced"
  | "document_archived"
  | "document_viewed"
  | "document_downloaded"
  | "lab_order_added"
  | "lab_order_archived"
  | "diagnostic_report_added"
  | "diagnostic_report_archived"
  | "observation_added"
  | "observation_archived"
  | "imaging_study_added"
  | "imaging_study_archived";

export async function recordPatientAuditEvent(event: {
  actorUserId?: string | null;
  actorRoles?: string[];
  action: PatientAuditAction;
  entityType: string;
  entityId?: string | null;
  beforeState?: unknown;
  afterState?: unknown;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  await db`
    insert into patient.audit_log (
      actor_user_id, actor_roles, action, entity_type, entity_id, before_state, after_state, metadata
    ) values (
      ${event.actorUserId ?? null}, ${event.actorRoles ?? []}, ${event.action}, ${event.entityType},
      ${event.entityId ?? null},
      ${event.beforeState !== undefined ? JSON.stringify(event.beforeState) : null}::jsonb,
      ${event.afterState !== undefined ? JSON.stringify(event.afterState) : null}::jsonb,
      ${JSON.stringify(event.metadata ?? {})}::jsonb
    )
  `;
}
