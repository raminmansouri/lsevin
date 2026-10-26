/**
 * Refund quote from the policy version the customer accepted (C-040, C-090, AT-12, AT-13).
 * Rules are evaluated against the absolute departure instant, never a display date.
 */
export type CancellationRule = { hoursBefore: number; refundPercent: number };

export type RefundQuote = {
  refundPercent: number;
  refundAmount: number;
  feeAmount: number;
  hoursBeforeDeparture: number;
  rule: CancellationRule | null;
  reason: "policy" | "operator_cancelled" | "after_departure";
};

export function normalizeRules(input: unknown): CancellationRule[] {
  if (!Array.isArray(input)) return [];
  return input
    .map((r) => ({ hoursBefore: Number((r as CancellationRule)?.hoursBefore), refundPercent: Number((r as CancellationRule)?.refundPercent) }))
    .filter((r) => Number.isFinite(r.hoursBefore) && r.hoursBefore >= 0 && Number.isFinite(r.refundPercent) && r.refundPercent >= 0 && r.refundPercent <= 100)
    .sort((a, b) => b.hoursBefore - a.hoursBefore);
}

export function refundQuote(opts: {
  rules: unknown;
  departureAt: Date;
  now: Date;
  paidAmount: number;
  currencyDecimals: number;
  operatorCancelled?: boolean;
}): RefundQuote {
  const scale = 10 ** opts.currencyDecimals;
  const paidMinor = Math.round(opts.paidAmount * scale);
  const hours = (opts.departureAt.getTime() - opts.now.getTime()) / 3_600_000;
  const done = (percent: number, rule: CancellationRule | null, reason: RefundQuote["reason"]): RefundQuote => {
    const refundMinor = Math.round((paidMinor * percent) / 100);
    return {
      refundPercent: percent,
      refundAmount: refundMinor / scale,
      feeAmount: (paidMinor - refundMinor) / scale,
      hoursBeforeDeparture: Math.floor(hours * 10) / 10,
      rule,
      reason,
    };
  };
  if (opts.operatorCancelled) return done(100, null, "operator_cancelled");
  if (hours <= 0) return done(0, null, "after_departure");
  // Rules sorted by hoursBefore desc: the first rule whose threshold we meet applies.
  const rule = normalizeRules(opts.rules).find((r) => hours >= r.hoursBefore) ?? null;
  return done(rule ? rule.refundPercent : 0, rule, "policy");
}
