import { describe, expect, it } from "vitest";

import {
  normalizeDiagnosticEntries,
  redactDiagnosticText,
} from "../bug-reports/admin-diagnostics";

describe("admin bug report diagnostics", () => {
  it("redacts common secret fields", () => {
    expect(
      redactDiagnosticText(
        "authorization: Bearer-123 token=abc password=hunter2"
      )
    ).toBe("authorization=[redacted] token=[redacted] password=[redacted]");
  });

  it("bounds log count and message length", () => {
    const entries = Array.from({ length: 35 }, (_, index) => ({
      level: "error" as const,
      message: index === 34 ? "x".repeat(2000) : `error ${index}`,
      timestamp: "2026-10-05T00:00:00.000Z",
    }));
    const normalized = normalizeDiagnosticEntries(entries);
    expect(normalized).toHaveLength(30);
    expect(normalized[0].message).toBe("error 5");
    expect(normalized[normalized.length - 1]?.message).toHaveLength(1000);
  });
});
