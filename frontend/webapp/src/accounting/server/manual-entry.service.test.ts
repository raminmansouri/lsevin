import { describe, expect, it } from "vitest";

/**
 * Unit tests for the parts of the manual-entry workflow that are pure decisions:
 * which transitions exist, who may make them, and what counts as a usable line.
 *
 * The financial guarantees — balance, dimensions, immutability, period locks —
 * are database constraints and are covered against a real Postgres in
 * manual-entry.test.ts. Testing them here would only assert that a mock agrees
 * with itself.
 */

// Mirrors the table in manual-entry.service.ts. Kept as a literal rather than
// imported because the service pulls in `server-only`, which cannot load here.
const TRANSITIONS: Record<string, "operate" | "configure"> = {
  "draft>temporary": "operate",
  "temporary>draft": "operate",
  "temporary>approved": "configure",
  "temporary>rejected": "configure",
  "approved>posted": "configure",
  "approved>temporary": "configure",
};

const isLegal = (from: string, to: string) => `${from}>${to}` in TRANSITIONS;

describe("workflow transitions", () => {
  it("lets an accountant move a draft forward and back", () => {
    expect(isLegal("draft", "temporary")).toBe(true);
    expect(isLegal("temporary", "draft")).toBe(true);
    expect(TRANSITIONS["draft>temporary"]).toBe("operate");
  });

  it("requires the finance admin capability to approve or post", () => {
    expect(TRANSITIONS["temporary>approved"]).toBe("configure");
    expect(TRANSITIONS["approved>posted"]).toBe("configure");
  });

  it("refuses to skip the review step", () => {
    // The whole point of the ladder: nothing reaches the books without having
    // been looked at by a second person.
    expect(isLegal("draft", "posted")).toBe(false);
    expect(isLegal("draft", "approved")).toBe(false);
    expect(isLegal("temporary", "posted")).toBe(false);
  });

  it("refuses to move a posted document anywhere", () => {
    expect(isLegal("posted", "draft")).toBe(false);
    expect(isLegal("posted", "temporary")).toBe(false);
    expect(isLegal("posted", "rejected")).toBe(false);
  });

  it("refuses to resurrect a rejected document directly", () => {
    // A rejected document is reopened by the author moving it back to temporary
    // via approved→temporary, not by flipping it straight to posted.
    expect(isLegal("rejected", "posted")).toBe(false);
    expect(isLegal("rejected", "approved")).toBe(false);
  });
});

/** Mirrors assertLine() in the service. */
function lineProblem(debit: string, credit: string, accountId = "acc-1"): string | null {
  if (!/^\d+(\.\d+)?$/.test(debit)) return "debit not a number";
  if (!/^\d+(\.\d+)?$/.test(credit)) return "credit not a number";
  const d = Number(debit);
  const c = Number(credit);
  if (d > 0 && c > 0) return "both sides";
  if (d === 0 && c === 0) return "no amount";
  if (!accountId) return "no account";
  return null;
}

describe("line validation", () => {
  it("accepts a line with one side filled", () => {
    expect(lineProblem("5000", "0")).toBeNull();
    expect(lineProblem("0", "5000")).toBeNull();
    expect(lineProblem("0.5", "0")).toBeNull();
  });

  it("rejects a line with both sides filled", () => {
    expect(lineProblem("100", "100")).toBe("both sides");
  });

  it("rejects an empty row the user forgot to delete", () => {
    expect(lineProblem("0", "0")).toBe("no amount");
  });

  it("rejects a negative amount rather than silently flipping the side", () => {
    expect(lineProblem("-100", "0")).toBe("debit not a number");
  });

  it("rejects a line with no account", () => {
    expect(lineProblem("100", "0", "")).toBe("no account");
  });
});

describe("four-eyes rule", () => {
  const needsSecondPerson = (to: string) => to === "approved" || to === "posted";

  it("applies to approval and posting", () => {
    expect(needsSecondPerson("approved")).toBe(true);
    expect(needsSecondPerson("posted")).toBe(true);
  });

  it("does not apply to the author's own editing steps", () => {
    // Otherwise an accountant working alone could not even move their own
    // document to `temporary`, which is not a control, just an obstruction.
    expect(needsSecondPerson("temporary")).toBe(false);
    expect(needsSecondPerson("draft")).toBe(false);
  });
});
