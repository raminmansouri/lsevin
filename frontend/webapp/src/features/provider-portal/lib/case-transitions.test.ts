import { describe, expect, it } from "vitest";

import { canTransitionCaseStep } from "./case-transitions";

describe("case step transitions", () => {
  it("supports the normal ready → active → completed path", () => {
    expect(canTransitionCaseStep("pending", "ready")).toBe(true);
    expect(canTransitionCaseStep("ready", "in_progress")).toBe(true);
    expect(canTransitionCaseStep("in_progress", "completed")).toBe(true);
  });

  it("rejects invalid jumps and unknown states", () => {
    expect(canTransitionCaseStep("pending", "completed")).toBe(false);
    expect(canTransitionCaseStep("unknown", "completed")).toBe(false);
  });

  it("allows an accidental completion to be reopened", () => {
    expect(canTransitionCaseStep("completed", "in_progress")).toBe(true);
  });
});
