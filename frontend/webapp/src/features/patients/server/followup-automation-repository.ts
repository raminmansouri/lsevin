import "server-only";

import db from "@/config/database/db";

import type { FollowupScheduleRuleRow } from "../analytics-types";
import { addFollowUp } from "./cases-repository";
import { listContactsForPatient } from "./repository";
import { listConsentsForPatient } from "./sharing-repository";
import { recordPatientAuditEvent } from "./audit";

function mapRule(row: any): FollowupScheduleRuleRow {
  return {
    id: row.id,
    caseType: row.case_type,
    daysAfterCompletion: row.days_after_completion,
    title: row.title,
    requiredItems: row.required_items,
    isActive: row.is_active,
    createdAt: row.create_date,
  };
}

export async function addFollowupScheduleRule(input: {
  caseType: string;
  daysAfterCompletion: number;
  title: string;
  requiredItems?: string;
  createdBy?: string | null;
}): Promise<FollowupScheduleRuleRow> {
  const rows = await db<any[]>`
    insert into patient.followup_schedule_rules (case_type, days_after_completion, title, required_items, created_by)
    values (${input.caseType}, ${input.daysAfterCompletion}, ${input.title}, ${input.requiredItems ?? null}, ${input.createdBy ?? null})
    returning *
  `;
  return mapRule(rows[0]);
}

export async function listFollowupScheduleRules(): Promise<FollowupScheduleRuleRow[]> {
  const rows = await db<any[]>`select * from patient.followup_schedule_rules order by create_date desc`;
  return rows.map(mapRule);
}

export async function deactivateFollowupScheduleRule(id: string): Promise<FollowupScheduleRuleRow | null> {
  const rows = await db<any[]>`
    update patient.followup_schedule_rules set is_active = false where id = ${id} returning *
  `;
  return rows[0] ? mapRule(rows[0]) : null;
}

/**
 * V9.2: called from cases-repository.transitionCaseStatus whenever a case
 * reaches 'completed'. For every active rule matching the case's case_type,
 * creates the follow-up (spec: "generate coordinator tasks" -- this app has
 * no separate task system, so the follow-up row itself, already visible and
 * actionable on the case's Follow-ups tab, IS the task).
 *
 * "Notify patient according to consent and communication preferences" is
 * decided here but never actually sent: this deployment has no email/SMS
 * provider wired into the patient feature (same honest-stub reasoning as
 * V8's AI provider -- sending a message is an external integration, not
 * something to fake). What IS real is the consent/contact check and its
 * audit trail: a notification is only ever recorded as "would send" when an
 * active contact AND an active family_access/data_sharing-scoped consent
 * covering the patient both exist; otherwise it's recorded as skipped, and
 * either way nothing is sent.
 */
export async function applyFollowupAutomation(medicalCaseId: string, caseType: string, patientId: string, actorId?: string | null): Promise<number> {
  const rules = await db<any[]>`
    select * from patient.followup_schedule_rules where case_type = ${caseType} and is_active = true
  `;
  if (rules.length === 0) return 0;

  const [contacts, consents] = await Promise.all([listContactsForPatient(patientId), listConsentsForPatient(patientId)]);
  const hasActiveContact = contacts.length > 0;
  const hasNotificationConsent = consents.some((c) => c.consentStatus === "active" && (c.consentType === "family_access" || c.consentType === "data_sharing"));

  for (const rule of rules) {
    const scheduledDate = new Date();
    scheduledDate.setDate(scheduledDate.getDate() + rule.days_after_completion);
    const followUp = await addFollowUp({
      medicalCaseId,
      scheduledDate: scheduledDate.toISOString().slice(0, 10),
      requiredItems: rule.required_items ?? undefined,
      createdBy: actorId ?? null,
    });

    await recordPatientAuditEvent({
      actorUserId: actorId,
      action: hasActiveContact && hasNotificationConsent ? "followup_notification_would_send" : "followup_notification_skipped",
      entityType: "medical_case_follow_up",
      entityId: followUp.id,
      metadata: { patientId, medicalCaseId, ruleId: rule.id, hasActiveContact, hasNotificationConsent },
    });
  }

  return rules.length;
}
