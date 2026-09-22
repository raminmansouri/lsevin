import type { MedicalCaseStatus } from "./cases-types";

/**
 * V4.2 status workflow graph. Lives outside server/ (no "server-only") so it
 * can be imported from client components too (e.g. to render the set of
 * valid next-status buttons) without dragging in the DB client.
 * `cancelled` is reachable from every non-terminal status; `completed` only
 * from `follow_up` (the normal happy path) -- there's no product sign-off
 * yet on skipping straight to completed from an earlier stage, so this
 * intentionally stays strict until that's confirmed.
 */
export const CASE_TRANSITIONS: Record<MedicalCaseStatus, MedicalCaseStatus[]> = {
  draft: ["intake", "cancelled"],
  intake: ["awaiting_documents", "ready_for_review", "cancelled"],
  awaiting_documents: ["ready_for_review", "cancelled"],
  ready_for_review: ["under_medical_review", "cancelled"],
  under_medical_review: ["awaiting_provider", "treatment_proposed", "cancelled"],
  awaiting_provider: ["treatment_proposed", "cancelled"],
  treatment_proposed: ["quote_received", "cancelled"],
  quote_received: ["patient_decision", "cancelled"],
  patient_decision: ["booked", "cancelled"],
  booked: ["travel_preparation", "cancelled"],
  travel_preparation: ["in_treatment", "cancelled"],
  in_treatment: ["post_treatment", "cancelled"],
  post_treatment: ["follow_up", "cancelled"],
  follow_up: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
};

export function isValidCaseTransition(from: MedicalCaseStatus, to: MedicalCaseStatus): boolean {
  return CASE_TRANSITIONS[from]?.includes(to) ?? false;
}
