import { describe, expect, it } from "vitest";

import { scoreWeakMatch } from "./identity-matching";

describe("weak-attribute duplicate scoring (V6.1)", () => {
  it("scores zero and gives no reasons when nothing matches", () => {
    const result = scoreWeakMatch({ nameMatch: false, dobMatch: false, contactMatch: false });
    expect(result.score).toBe(0);
    expect(result.reasons).toEqual([]);
  });

  it("never reaches a mergeable-looking score from a single weak signal", () => {
    // Spec V6.1: "never automatically merge using only weak attributes" --
    // this doesn't enforce that by itself (nothing here merges), but a
    // single signal should never look as confident as multiple signals
    // agreeing, which is what makes a human reviewer's job meaningful.
    const singleSignalScores = [
      scoreWeakMatch({ nameMatch: true, dobMatch: false, contactMatch: false }).score,
      scoreWeakMatch({ nameMatch: false, dobMatch: true, contactMatch: false }).score,
      scoreWeakMatch({ nameMatch: false, dobMatch: false, contactMatch: true }).score,
    ];
    const allSignalsScore = scoreWeakMatch({ nameMatch: true, dobMatch: true, contactMatch: true }).score;
    for (const score of singleSignalScores) {
      expect(score).toBeLessThan(allSignalsScore);
    }
  });

  it("accumulates score and reasons additively across independent signals", () => {
    const result = scoreWeakMatch({ nameMatch: true, dobMatch: true, contactMatch: false });
    expect(result.score).toBe(70);
    expect(result.reasons).toEqual(["name_match", "dob_match"]);
  });

  it("caps at 100 when every signal agrees", () => {
    const result = scoreWeakMatch({ nameMatch: true, dobMatch: true, contactMatch: true });
    expect(result.score).toBe(100);
    expect(result.reasons).toEqual(["name_match", "dob_match", "contact_match"]);
  });
});
