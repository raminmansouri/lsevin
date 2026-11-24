import { z } from "zod/v4";

/**
 * The customer health questionnaire (my-health-record/questionnaire).
 * Eight steps; the list-shaped ones (surgeries, medicines, allergies,
 * documents) write into the existing clinical tables through their own
 * actions, so their step payloads here only carry the yes/no extras.
 */
export const INTAKE_STEPS = [
  "about",
  "concern",
  "conditions",
  "surgeries",
  "medicines",
  "lifestyle",
  "documents",
  "review",
] as const;
export type IntakeStep = (typeof INTAKE_STEPS)[number];

/** The screening checklist on the "conditions" step, in display order. */
export const INTAKE_CONDITION_KEYS = [
  "diabetes",
  "high_blood_pressure",
  "heart_disease",
  "asthma_lung",
  "thyroid",
  "kidney",
  "liver",
  "epilepsy",
  "cancer",
  "bleeding_clotting",
  "infectious",
  "mental_health",
] as const;
export type IntakeConditionKey = (typeof INTAKE_CONDITION_KEYS)[number];

export const YES_NO_UNSURE = ["yes", "no", "unsure"] as const;
export const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "unknown"] as const;
export const SEX_AT_BIRTH = ["male", "female", "other"] as const;
export const CONCERN_DURATIONS = ["days", "weeks", "months", "years"] as const;
export const PREGNANCY_STATUSES = ["pregnant", "breastfeeding", "trying", "none", "unsure"] as const;
export const SMOKING_STATUSES = ["never", "former", "current"] as const;
export const ALCOHOL_STATUSES = ["never", "occasional", "regular"] as const;
export const ACTIVITY_LEVELS = ["low", "moderate", "high"] as const;

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: "invalid" });
const optionalText = (max: number) => z.string().trim().max(max).optional();

export const StartMyHealthRecordSchema = z.object({
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().min(1).max(100),
  birthDate: isoDate.optional(),
  sexAtBirth: z.enum(SEX_AT_BIRTH).optional(),
});
export type StartMyHealthRecordInput = z.input<typeof StartMyHealthRecordSchema>;

const ConditionAnswerSchema = z.object({
  answer: z.enum(YES_NO_UNSURE),
  details: optionalText(500),
});

export const SaveIntakeStepSchema = z.discriminatedUnion("step", [
  z.object({
    step: z.literal("about"),
    patientId: z.uuid(),
    // Every field is optional and an invalid value is dropped rather than
    // failing the step: whatever the patient did fill in is saved, and they
    // move on. An empty name keeps the name already on the record.
    firstName: z.string().trim().min(1).max(100).optional().catch(undefined),
    lastName: z.string().trim().min(1).max(100).optional().catch(undefined),
    birthDate: isoDate.optional().catch(undefined),
    sexAtBirth: z.enum(SEX_AT_BIRTH).optional().catch(undefined),
    heightCm: z.number().min(30).max(260).optional().catch(undefined),
    weightKg: z.number().min(1).max(400).optional().catch(undefined),
    bloodType: z.enum(BLOOD_TYPES).optional().catch(undefined),
  }),
  z.object({
    step: z.literal("concern"),
    patientId: z.uuid(),
    mainConcern: optionalText(2000),
    concernBodyArea: optionalText(200),
    concernDuration: z.enum(CONCERN_DURATIONS).optional(),
    concernSeverity: z.number().int().min(0).max(10).optional(),
    desiredTreatment: optionalText(500),
  }),
  z.object({
    step: z.literal("conditions"),
    patientId: z.uuid(),
    answers: z.partialRecord(z.enum(INTAKE_CONDITION_KEYS), ConditionAnswerSchema),
    pregnancyStatus: z.enum(PREGNANCY_STATUSES).optional(),
  }),
  z.object({
    step: z.literal("surgeries"),
    patientId: z.uuid(),
    anesthesiaProblems: z.enum(YES_NO_UNSURE).optional(),
    anesthesiaDetails: optionalText(1000),
  }),
  z.object({
    step: z.literal("medicines"),
    patientId: z.uuid(),
    takesBloodThinners: z.enum(YES_NO_UNSURE).optional(),
  }),
  z.object({
    step: z.literal("lifestyle"),
    patientId: z.uuid(),
    smoking: z.enum(SMOKING_STATUSES).optional(),
    alcohol: z.enum(ALCOHOL_STATUSES).optional(),
    activityLevel: z.enum(ACTIVITY_LEVELS).optional(),
  }),
  z.object({ step: z.literal("documents"), patientId: z.uuid() }),
  z.object({ step: z.literal("review"), patientId: z.uuid() }),
]);
export type SaveIntakeStepInput = z.input<typeof SaveIntakeStepSchema>;

export const REMOVABLE_SELF_RECORD_KINDS = ["condition", "allergy", "medication", "procedure"] as const;
export const RemoveMyRecordSchema = z.object({
  patientId: z.uuid(),
  kind: z.enum(REMOVABLE_SELF_RECORD_KINDS),
  id: z.uuid(),
});
export type RemoveMyRecordInput = z.input<typeof RemoveMyRecordSchema>;

export type IntakeConditionAnswer = {
  answer: (typeof YES_NO_UNSURE)[number];
  details?: string;
  conditionId?: string;
};

export type HealthIntakeRow = {
  id: string;
  patientId: string;
  heightCm: number | null;
  weightKg: number | null;
  bloodType: string | null;
  mainConcern: string | null;
  concernBodyArea: string | null;
  concernDuration: string | null;
  concernSeverity: number | null;
  desiredTreatment: string | null;
  conditionAnswers: Partial<Record<IntakeConditionKey, IntakeConditionAnswer>>;
  pregnancyStatus: string | null;
  anesthesiaProblems: string | null;
  anesthesiaDetails: string | null;
  takesBloodThinners: string | null;
  smoking: string | null;
  alcohol: string | null;
  activityLevel: string | null;
  completedSteps: IntakeStep[];
  completedAt: string | null;
  lastModifiedDate: string;
};

/** Steps that count towards "how complete is my record" (review is not a content step). */
export const INTAKE_CONTENT_STEPS = INTAKE_STEPS.filter((step) => step !== "review");

export function intakeCompletionPercent(intake: Pick<HealthIntakeRow, "completedSteps"> | null): number {
  if (!intake) return 0;
  const done = INTAKE_CONTENT_STEPS.filter((step) => intake.completedSteps.includes(step)).length;
  return Math.round((done * 100) / INTAKE_CONTENT_STEPS.length);
}
