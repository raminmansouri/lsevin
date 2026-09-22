import { describe, expect, it } from "vitest";

import { classifyDocument, extractCandidatesFromDocument, generatePatientSummary, isErrorResult, translateDocumentText } from "./ai-provider";

describe("AI provider boundary (V8)", () => {
  it("every function reports not_configured -- no provider is wired in", async () => {
    expect(await classifyDocument({ mimeType: null, originalName: null, title: "x" })).toEqual({ ok: false, reason: "not_configured" });
    expect(await extractCandidatesFromDocument({ documentId: "d", patientId: "p" })).toEqual({ ok: false, reason: "not_configured" });
    expect(await generatePatientSummary({ patientId: "p" })).toEqual({ ok: false, reason: "not_configured" });
    expect(await translateDocumentText({ text: "x", sourceLanguage: "en", targetLanguage: "fa" })).toEqual({ ok: false, reason: "not_configured" });
  });

  it("isErrorResult narrows a { ok: false } result and exposes its reason", () => {
    const result: { ok: true; value: number } | { ok: false; reason: "not_configured" } = { ok: false, reason: "not_configured" };
    if (isErrorResult(result)) {
      expect(result.reason).toBe("not_configured");
    } else {
      throw new Error("expected isErrorResult to identify this as an error result");
    }
  });

  it("isErrorResult returns false for a successful result", () => {
    const result: { ok: true; value: number } | { ok: false; reason: "not_configured" } = { ok: true, value: 42 };
    expect(isErrorResult(result)).toBe(false);
  });
});
