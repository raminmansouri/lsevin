import type { MembershipMonthStatus } from "../types";

/**
 * Item 4.3 ("due months"): a month is due once its period has started and it still
 * isn't approved -- deliberately not a stored status (no scheduled job needed to flip
 * it), just a query-time/render-time derivation from `period_month` and `status`.
 *
 * `periodMonth` may be a "YYYY-MM-DD" string (always the first of the month, per
 * db/migrations/0039's own check constraint) or a Date; `now` defaults to the real
 * clock and exists so this stays a pure, testable function.
 */
export function isMonthDue(periodMonth: string | Date, status: MembershipMonthStatus, now: Date = new Date()): boolean {
  if (status === "approved") return false;
  const period = periodMonth instanceof Date ? periodMonth : new Date(periodMonth);
  const currentMonthStart = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1);
  const periodMonthStart = Date.UTC(period.getUTCFullYear(), period.getUTCMonth(), 1);
  return periodMonthStart <= currentMonthStart;
}

/**
 * Item 4.1/4.2 ("selecting a month" / "pay 12 months"): the list of the next `count`
 * calendar months from `from` (inclusive), as "YYYY-MM" strings -- what a subscribe
 * form offers the customer to check off, so a customer never has to type a month by
 * hand and can never select an already-past one.
 */
export function nextMonths(count: number, from: Date = new Date()): string[] {
  const out: string[] = [];
  for (let i = 0; i < count; i++) {
    const d = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth() + i, 1));
    out.push(`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`);
  }
  return out;
}
