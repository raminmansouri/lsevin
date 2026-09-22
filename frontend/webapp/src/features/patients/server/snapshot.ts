import "server-only";

import { getPatientById } from "./repository";
import { listAllergiesForPatient, listConditionsForPatient, listMedicationsForPatient, listProceduresForPatient } from "./clinical-repository";
import { listDocumentsForPatient } from "./documents-repository";

/**
 * Builds the same point-in-time, scope-limited record snapshot for two
 * different consumers: a provider medical package (V4.5) and a temporary
 * share link (V5.3). Both need "exactly which records were shown, captured
 * at generation time" rather than a live query, and both are scoped by the
 * same data-scope vocabulary (spec V5.2 / V4.5's included_scopes).
 */
export async function buildPatientRecordSnapshot(
  patientId: string,
  scopes: string[]
): Promise<Record<string, unknown>> {
  const patient = await getPatientById(patientId);
  const snapshot: Record<string, unknown> = { generatedAt: new Date().toISOString() };

  if (scopes.includes("demographics")) snapshot.patient = patient;
  if (scopes.includes("conditions")) snapshot.conditions = await listConditionsForPatient(patientId);
  if (scopes.includes("allergies")) snapshot.allergies = await listAllergiesForPatient(patientId);
  if (scopes.includes("medications")) snapshot.medications = await listMedicationsForPatient(patientId);
  if (scopes.includes("procedures")) snapshot.procedures = await listProceduresForPatient(patientId);
  if (scopes.includes("clinical_documents") || scopes.includes("documents")) {
    // Metadata only -- a snapshot must never inline file bytes or leak a
    // bare downloadable URL into a JSON blob handed to a provider or an
    // external share-link recipient.
    snapshot.documents = (await listDocumentsForPatient(patientId)).map((d) => ({
      id: d.id,
      title: d.title,
      documentType: d.documentType,
      documentDate: d.documentDate,
      version: d.version,
    }));
  }

  return snapshot;
}
