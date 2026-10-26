/**
 * Editorial experiments (M-012, P2) — storage + deterministic assignment only.
 *
 * Guardrails (documented here because they are policy, not code paths):
 *   * Only presentation of editorial modules (hero/collection copy, order) may
 *     vary. Prices, availability, fees, policies and safety text never do.
 *   * Assignment is deterministic per (experiment key, subject) — a visitor
 *     sees the same variant on every visit and no randomness is stored.
 *   * The subject is an opaque id (user id or guest cookie). It is hashed and
 *     never sent to analytics in clear.
 *   * Sponsored modules stay labelled in every variant (M-009).
 *   * Reading results requires the analytics pipeline; until it exists the
 *     panel only stores the variants (no auto-winner, no auto-rollout).
 */
import { createHash } from "node:crypto";

export function assignVariant(experimentKey: string, variants: readonly string[], subjectKey: string): string | null {
  if (!experimentKey || variants.length === 0 || !subjectKey) return null;
  const digest = createHash("sha256").update(`${experimentKey}\u0000${subjectKey}`).digest();
  const bucket = digest.readUInt32BE(0) % variants.length;
  return variants[bucket];
}
