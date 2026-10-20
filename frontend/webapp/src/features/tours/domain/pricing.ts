/**
 * Server-side tour quote (C-086, C-038, S-032, AT-11, AT-32, AT-35).
 *
 * Inputs are canonical (ISO date, ids, integer counts); nothing here depends on
 * the display calendar, UI language or display currency. Amounts are computed
 * in minor units of the tour's currency so rounding is deterministic.
 */
import { compareIso } from "./calendar";

export const TRAVELER_CLASSES = ["adult", "child", "infant", "student", "senior"] as const;
export type TravelerClass = (typeof TRAVELER_CLASSES)[number];
export type TravelerCounts = Partial<Record<TravelerClass, number>>;

export type PriceTier = { travelerClass: TravelerClass; amount: number; minAge?: number | null; maxAge?: number | null };
export type PricedOption = {
  id: string;
  kind: "public" | "private";
  minGroup: number;
  maxGroup: number | null;
  privateGroupPrice: number | null;
  tiers: PriceTier[];
};
export type PricedAddon = { id: string; code: string; pricing: "per_person" | "per_booking"; amount: number; maxQty: number };
export type PriceRule = { optionId: string | null; dateFrom: string; dateTo: string; kind: "percent" | "amount_delta"; value: number };

export type QuoteInput = {
  currency: string;
  currencyDecimals: number;
  option: PricedOption;
  departureDate: string; // ISO, tour-local date
  travelers: TravelerCounts;
  addons?: { id: string; quantity: number }[];
  availableAddons?: PricedAddon[];
  priceRules?: PriceRule[];
  serviceFeePercent?: number;
  discount?: { kind: "percent" | "amount"; value: number; code?: string } | null;
};

export type QuoteLine = {
  kind: "traveler" | "private_group" | "addon" | "adjustment" | "fee" | "discount";
  code: string;
  quantity: number;
  unitAmount: number;
  amount: number;
};

export type Quote = {
  currency: string;
  seats: number;
  lines: QuoteLine[];
  subtotal: number;
  fees: number;
  discount: number;
  total: number;
  appliedRuleIds: number[];
};

export class QuoteError extends Error {
  constructor(public readonly code: "no_travelers" | "unpriced_traveler_class" | "group_size" | "invalid_addon" | "invalid_count") {
    super(code);
  }
}

const toMinor = (amount: number, decimals: number) => Math.round(amount * 10 ** decimals);
const fromMinor = (minor: number, decimals: number) => minor / 10 ** decimals;

export function seatCount(travelers: TravelerCounts): number {
  let n = 0;
  for (const cls of TRAVELER_CLASSES) {
    const v = travelers[cls] ?? 0;
    if (!Number.isInteger(v) || v < 0) throw new QuoteError("invalid_count");
    n += v;
  }
  return n;
}

export function quote(input: QuoteInput): Quote {
  const dec = input.currencyDecimals;
  const seats = seatCount(input.travelers);
  if (seats < 1) throw new QuoteError("no_travelers");
  const { option } = input;
  if (seats < option.minGroup || (option.maxGroup != null && seats > option.maxGroup)) throw new QuoteError("group_size");

  const lines: QuoteLine[] = [];
  let baseMinor = 0;

  if (option.kind === "private") {
    const unit = toMinor(option.privateGroupPrice ?? 0, dec);
    lines.push({ kind: "private_group", code: option.id, quantity: 1, unitAmount: fromMinor(unit, dec), amount: fromMinor(unit, dec) });
    baseMinor += unit;
  } else {
    for (const cls of TRAVELER_CLASSES) {
      const count = input.travelers[cls] ?? 0;
      if (count === 0) continue;
      const tier = option.tiers.find((t) => t.travelerClass === cls);
      if (!tier) throw new QuoteError("unpriced_traveler_class");
      const unit = toMinor(tier.amount, dec);
      lines.push({ kind: "traveler", code: cls, quantity: count, unitAmount: fromMinor(unit, dec), amount: fromMinor(unit * count, dec) });
      baseMinor += unit * count;
    }
  }

  // Date rules: an option-specific rule beats a tour-wide one; within the same
  // specificity the most recently listed rule wins. Exactly one rule applies.
  const applicable = (input.priceRules ?? [])
    .map((r, i) => ({ r, i }))
    .filter(({ r }) => (r.optionId == null || r.optionId === option.id)
      && compareIso(input.departureDate, r.dateFrom) >= 0 && compareIso(input.departureDate, r.dateTo) <= 0)
    .sort((a, b) => Number(b.r.optionId != null) - Number(a.r.optionId != null) || b.i - a.i);
  const appliedRuleIds: number[] = [];
  if (applicable.length > 0) {
    const { r, i } = applicable[0];
    appliedRuleIds.push(i);
    const delta = r.kind === "percent" ? Math.round((baseMinor * r.value) / 100) : toMinor(r.value, dec) * (option.kind === "private" ? 1 : seats);
    const bounded = Math.max(delta, -baseMinor);
    lines.push({ kind: "adjustment", code: r.kind, quantity: 1, unitAmount: fromMinor(bounded, dec), amount: fromMinor(bounded, dec) });
    baseMinor += bounded;
  }

  let addonMinor = 0;
  for (const req of input.addons ?? []) {
    if (!req.quantity) continue;
    const addon = (input.availableAddons ?? []).find((a) => a.id === req.id);
    if (!addon || !Number.isInteger(req.quantity) || req.quantity < 0 || req.quantity > addon.maxQty) throw new QuoteError("invalid_addon");
    const unit = toMinor(addon.amount, dec);
    const qty = addon.pricing === "per_person" ? req.quantity * seats : req.quantity;
    lines.push({ kind: "addon", code: addon.code, quantity: qty, unitAmount: fromMinor(unit, dec), amount: fromMinor(unit * qty, dec) });
    addonMinor += unit * qty;
  }

  const subtotalMinor = baseMinor + addonMinor;
  let discountMinor = 0;
  if (input.discount && input.discount.value > 0) {
    discountMinor = input.discount.kind === "percent"
      ? Math.round((subtotalMinor * Math.min(input.discount.value, 100)) / 100)
      : Math.min(toMinor(input.discount.value, dec), subtotalMinor);
    lines.push({ kind: "discount", code: input.discount.code ?? input.discount.kind, quantity: 1, unitAmount: -fromMinor(discountMinor, dec), amount: -fromMinor(discountMinor, dec) });
  }
  const feeMinor = Math.round(((subtotalMinor - discountMinor) * (input.serviceFeePercent ?? 0)) / 100);
  if (feeMinor > 0) lines.push({ kind: "fee", code: "service_fee", quantity: 1, unitAmount: fromMinor(feeMinor, dec), amount: fromMinor(feeMinor, dec) });

  return {
    currency: input.currency,
    seats,
    lines,
    subtotal: fromMinor(subtotalMinor, dec),
    fees: fromMinor(feeMinor, dec),
    discount: fromMinor(discountMinor, dec),
    total: fromMinor(subtotalMinor - discountMinor + feeMinor, dec),
    appliedRuleIds,
  };
}

/** The "from … per person" card price (C-019): cheapest adult tier, or private price per group. */
export function fromPrice(options: PricedOption[]): { amount: number; basis: "per_person" | "per_group" } | null {
  let best: { amount: number; basis: "per_person" | "per_group" } | null = null;
  for (const o of options) {
    const candidate = o.kind === "private"
      ? (o.privateGroupPrice != null ? { amount: o.privateGroupPrice, basis: "per_group" as const } : null)
      : (() => { const a = o.tiers.find((t) => t.travelerClass === "adult"); return a ? { amount: a.amount, basis: "per_person" as const } : null; })();
    if (candidate && (!best || (candidate.basis === "per_person" && best.basis === "per_group") || (candidate.basis === best.basis && candidate.amount < best.amount))) best = candidate;
  }
  return best;
}
