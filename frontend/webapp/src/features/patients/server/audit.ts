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
  | "imaging_study_archived"
  | "case_created"
  | "case_status_changed"
  | "encounter_added"
  | "case_requirement_added"
  | "case_requirement_updated"
  | "case_package_generated"
  | "case_submission_added"
  | "case_submission_updated"
  | "case_proposal_added"
  | "case_second_opinion_added"
  | "case_followup_added"
  | "case_followup_updated"
  | "consent_granted"
  | "consent_withdrawn"
  | "share_grant_created"
  | "share_grant_revoked"
  | "share_grant_viewed"
  | "share_grant_denied"
  | "duplicate_scan_run"
  | "match_candidate_reviewed"
  | "patient_merged"
  | "patient_unmerged"
  | "reconciliation_resolved"
  | "fhir_resource_exported"
  | "fhir_bundle_exported"
  | "passport_generated"
  | "document_classification_run"
  | "document_classification_reviewed"
  | "ai_extraction_run"
  | "ai_extraction_reviewed"
  | "ai_summary_generated"
  | "ai_translation_requested"
  | "followup_schedule_rule_added"
  | "followup_schedule_rule_deactivated"
  | "followup_automation_applied"
  | "followup_notification_would_send"
  | "followup_notification_skipped"
  | "followup_status_updated"
  | "case_provider_grant_created"
  | "case_provider_grant_revoked"
  | "case_provider_lab_order_fulfilled"
  | "account_link_request_submitted"
  | "account_link_request_approved"
  | "account_link_request_rejected";

/**
 * `purpose`/`result`/`ipAddress`/`userAgent` were added in V5.6
 * (0054_patient_sharing_consent_security.sql extends the V0.8 table rather
 * than replacing it). They're optional so the ~40 existing call sites from
 * V0-V4 keep compiling and behaving exactly as before; new call sites
 * (share-grant access in particular, since that's the one truly
 * unauthenticated read path in this feature) pass them explicitly.
 */
export async function recordPatientAuditEvent(event: {
  actorUserId?: string | null;
  actorRoles?: string[];
  action: PatientAuditAction;
  entityType: string;
  entityId?: string | null;
  beforeState?: unknown;
  afterState?: unknown;
  metadata?: Record<string, unknown>;
  purpose?: string;
  result?: "success" | "failure" | "denied";
  ipAddress?: string | null;
  userAgent?: string | null;
}): Promise<void> {
  await db`
    insert into patient.audit_log (
      actor_user_id, actor_roles, action, entity_type, entity_id, before_state, after_state, metadata,
      purpose, result, ip_address, user_agent
    ) values (
      ${event.actorUserId ?? null}, ${event.actorRoles ?? []}, ${event.action}, ${event.entityType},
      ${event.entityId ?? null},
      ${event.beforeState !== undefined ? JSON.stringify(event.beforeState) : null}::jsonb,
      ${event.afterState !== undefined ? JSON.stringify(event.afterState) : null}::jsonb,
      ${JSON.stringify(event.metadata ?? {})}::jsonb,
      ${event.purpose ?? null}, ${event.result ?? "success"}, ${event.ipAddress ?? null}, ${event.userAgent ?? null}
    )
  `;
}
