/**
 * Patient 360 V9 (Advanced Analytics & Automation). See
 * docs/LSevin_Patient_360_Spiral_Requirements.md and
 * db/migrations/0058_patient_analytics_automation.sql.
 */

export type CaseFunnelStage = { caseStatus: string; count: number };

export type CaseTimingMetrics = {
  avgIntakeToReadyDays: number | null;
  medianIntakeToReadyDays: number | null;
  avgProviderResponseDays: number | null;
  casesMeasured: number;
};

export type FollowUpCompletionMetrics = {
  total: number;
  completed: number;
  missed: number;
  completionRate: number;
};

export type OverdueFollowUp = {
  id: string;
  medicalCaseId: string;
  patientId: string;
  patientName: string;
  scheduledDate: string;
  daysOverdue: number;
};

export type SegmentedCount = { segment: string; count: number };

export type CaseSegmentation = { byOriginCountry: SegmentedCount[]; byCaseType: SegmentedCount[] };

export type DataQualityMetrics = {
  totalPatients: number;
  pendingDuplicateCandidates: number;
  duplicateRate: number;
  unverifiedClinicalRecordRate: number;
  recordsMissingCodeRate: number;
  staleContactCount: number;
};

/** V9.1: per-patient, source-linked. Every entry keeps the id of the
 * record it summarizes so the UI can link back to it -- spec: "keep source
 * links available." */
export type HealthTimelineEntry = {
  kind: "medication_start" | "medication_stop" | "procedure" | "case_status" | "lab_trend_point";
  date: string;
  label: string;
  recordId: string;
};

export type FollowupScheduleRuleRow = {
  id: string;
  caseType: string;
  daysAfterCompletion: number;
  title: string;
  requiredItems: string | null;
  isActive: boolean;
  createdAt: string;
};
