import "server-only";

/**
 * V8's AI provider boundary. No provider is wired in -- every function
 * below returns `{ ok: false, reason: "not_configured" }` until one is.
 *
 * This is deliberate, not an oversight: classification/extraction/
 * summarization/translation all mean sending patient PHI to whatever
 * model answers these calls. Which vendor, under what data-processing/BAA
 * agreement, at what per-call cost, and whether the model may retain or
 * train on the data are product and compliance decisions -- not something
 * to default silently by picking an API and wiring in a key. Nothing in
 * this codebase calls an external AI service anywhere else either (grepped
 * for it during this feature's investigation).
 *
 * Everything downstream of this file (the extraction review queue, the
 * classification-requires-review flag, the AI summary version history, the
 * document-translation workflow) is fully built and real -- it's exactly
 * the shape spec V8 asks for. The only unfinished piece, by design, is
 * "actually call a model," and it lives entirely behind the four functions
 * below. Implementing a real provider later means filling these in; no
 * other file in this feature needs to change.
 */

export type AiProviderResult<T> = { ok: true; data: T; model: string; modelVersion: string } | { ok: false; reason: "not_configured" };

/**
 * A user-defined type-predicate guard, not a plain `!result.ok` check --
 * this codebase's tsconfig doesn't reliably narrow a discriminated union on
 * a bare boolean property access in every position (seen repeatedly across
 * this feature, e.g. share-view-actions.ts in V5), but an explicit `is`
 * predicate function is always respected by the compiler. Generic over any
 * `{ ok: boolean }`-shaped result, not just AiProviderResult, since the
 * repository functions in this file's callers (ai-repository.ts) define
 * their own similarly-shaped result types (ClassifyResult, ExtractResult,
 * SummaryResult, ...).
 */
export function isErrorResult<T extends { ok: boolean }>(result: T): result is Extract<T, { ok: false }> {
  return !result.ok;
}

export async function classifyDocument(_input: {
  mimeType: string | null;
  originalName: string | null;
  title: string;
}): Promise<AiProviderResult<{ documentType: string; confidence: number }>> {
  return { ok: false, reason: "not_configured" };
}

export async function extractCandidatesFromDocument(_input: {
  documentId: string;
  patientId: string;
}): Promise<AiProviderResult<{ candidateType: string; extractedData: Record<string, unknown>; confidence: number }[]>> {
  return { ok: false, reason: "not_configured" };
}

export async function generatePatientSummary(_input: {
  patientId: string;
}): Promise<AiProviderResult<{ summaryText: string; sourceReferences: { recordType: string; recordId: string }[] }>> {
  return { ok: false, reason: "not_configured" };
}

export async function translateDocumentText(_input: {
  text: string;
  sourceLanguage: string;
  targetLanguage: string;
}): Promise<AiProviderResult<{ translatedText: string }>> {
  return { ok: false, reason: "not_configured" };
}
