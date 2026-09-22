import { z } from "zod/v4";

export const ScanForDuplicatesSchema = z.object({
  patientId: z.uuid(),
});
export type ScanForDuplicatesInput = z.input<typeof ScanForDuplicatesSchema>;

export const ReviewMatchCandidateSchema = z.object({
  id: z.uuid(),
  decision: z.enum(["confirmed_same_person", "confirmed_different", "ignored"]),
});
export type ReviewMatchCandidateInput = z.input<typeof ReviewMatchCandidateSchema>;

export const PreviewMergeSchema = z.object({
  survivingPatientId: z.uuid(),
  mergedPatientId: z.uuid(),
});
export type PreviewMergeInput = z.input<typeof PreviewMergeSchema>;

export const MergePatientsSchema = z.object({
  survivingPatientId: z.uuid(),
  mergedPatientId: z.uuid(),
  reason: z.string().trim().min(1).max(1000),
  matchCandidateId: z.uuid().optional(),
});
export type MergePatientsInput = z.input<typeof MergePatientsSchema>;

export const UnmergePatientsSchema = z.object({
  mergeId: z.uuid(),
});
export type UnmergePatientsInput = z.input<typeof UnmergePatientsSchema>;
