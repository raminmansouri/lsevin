import { describe, expect, it } from "vitest";

import { CASE_TRANSITIONS, isValidCaseTransition } from "./cases-transitions";
import { MEDICAL_CASE_STATUSES } from "./cases-schemas";

describe("medical case status transitions (V4.2)", () => {
  it("allows the normal happy-path progression from draft to completed", () => {
    const happyPath = [
      "draft",
      "intake",
      "ready_for_review",
      "under_medical_review",
      "treatment_proposed",
      "quote_received",
      "patient_decision",
      "booked",
      "travel_preparation",
      "in_treatment",
      "post_treatment",
      "follow_up",
      "completed",
    ] as const;
    for (let i = 0; i < happyPath.length - 1; i++) {
      expect(isValidCaseTransition(happyPath[i], happyPath[i + 1]), `${happyPath[i]} -> ${happyPath[i + 1]}`).toBe(true);
    }
  });

  it("allows cancelling from every non-terminal status", () => {
    for (const status of MEDICAL_CASE_STATUSES) {
      if (status === "completed" || status === "cancelled") continue;
      expect(isValidCaseTransition(status, "cancelled"), status).toBe(true);
    }
  });

  it("rejects skipping stages (draft straight to booked)", () => {
    expect(isValidCaseTransition("draft", "booked")).toBe(false);
  });

  it("rejects any transition out of a terminal status", () => {
    expect(isValidCaseTransition("completed", "in_treatment")).toBe(false);
    expect(isValidCaseTransition("cancelled", "draft")).toBe(false);
  });

  it("every status listed in the transition graph is a real case status", () => {
    for (const status of Object.keys(CASE_TRANSITIONS)) {
      expect(MEDICAL_CASE_STATUSES).toContain(status);
    }
  });
});
