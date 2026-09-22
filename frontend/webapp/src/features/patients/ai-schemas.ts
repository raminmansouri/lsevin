import { z } from "zod/v4";

export const ClassifyDocumentSchema = z.object({
  documentId: z.uuid(),
});
export type ClassifyDocumentInput = z.input<typeof ClassifyDocumentSchema>;

export const RunExtractionSchema = z.object({
  documentId: z.uuid(),
  patientId: z.uuid(),
});
export type RunExtractionInput = z.input<typeof RunExtractionSchema>;

export const ReviewExtractionCandidateSchema = z.object({
  id: z.uuid(),
  decision: z.enum(["approved", "corrected", "rejected", "deferred"]),
  correctedData: z.record(z.string(), z.unknown()).optional(),
  note: z.string().trim().max(1000).optional(),
});
export type ReviewExtractionCandidateInput = z.input<typeof ReviewExtractionCandidateSchema>;

export const GenerateSummarySchema = z.object({
  patientId: z.uuid(),
});
export type GenerateSummaryInput = z.input<typeof GenerateSummarySchema>;

export const RequestAiTranslationSchema = z.object({
  documentId: z.uuid(),
  targetLanguage: z.string().trim().min(2).max(10),
});
export type RequestAiTranslationInput = z.input<typeof RequestAiTranslationSchema>;
