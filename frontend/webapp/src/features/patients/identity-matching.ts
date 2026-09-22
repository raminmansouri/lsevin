/**
 * Pure V6.1 weak-attribute scoring, split out of server/identity-repository.ts
 * so it's testable without a database. Never merges anything by itself --
 * spec V6.1: "never automatically merge using only weak attributes." This
 * only turns three boolean signals into a score + explainable reasons for a
 * reviewable candidate.
 */
export function scoreWeakMatch(signals: { nameMatch: boolean; dobMatch: boolean; contactMatch: boolean }): {
  score: number;
  reasons: string[];
} {
  const reasons: string[] = [];
  let score = 0;
  if (signals.nameMatch) {
    reasons.push("name_match");
    score += 40;
  }
  if (signals.dobMatch) {
    reasons.push("dob_match");
    score += 30;
  }
  if (signals.contactMatch) {
    reasons.push("contact_match");
    score += 30;
  }
  return { score, reasons };
}
