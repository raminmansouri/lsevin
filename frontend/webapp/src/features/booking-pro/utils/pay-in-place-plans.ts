/**
 * "Pay in place" plans: the customer pays part of the bill now and the rest at the
 * place, and the smaller the share paid now, the larger the addition to the bill.
 *
 *   plan '20': pay 20% now, the bill is increased by 5%
 *   plan '50': pay 50% now, the bill is increased by 2%
 *   plan '80': pay 80% now, the bill is increased by 1%
 *
 * The percentage due now is taken from the INCREASED bill. Example on a bill of 100:
 *   plan '20' -> bill 105, due now 21, due at the place 84.
 *
 * No imports on purpose: the wizard (client) and the checkout (server) must compute
 * exactly the same numbers, so both import this one file.
 */

export type PayInPlacePlanId = '20' | '50' | '80';

export const PAY_IN_PLACE_PLANS: Record<PayInPlacePlanId, { payNowPercent: number; surchargePercent: number }> = {
    '20': { payNowPercent: 20, surchargePercent: 5 },
    '50': { payNowPercent: 50, surchargePercent: 2 },
    '80': { payNowPercent: 80, surchargePercent: 1 },
};

export const PAY_IN_PLACE_PLAN_IDS = Object.keys(PAY_IN_PLACE_PLANS) as PayInPlacePlanId[];

export function isPayInPlacePlanId(value: unknown): value is PayInPlacePlanId {
    return typeof value === 'string' && Object.prototype.hasOwnProperty.call(PAY_IN_PLACE_PLANS, value);
}

// Same rule the gateway code uses: no minor unit -> whole units, everything else two decimals.
const ZERO_DECIMAL_CURRENCIES = new Set(['IRR', 'IRT', 'JPY', 'KRW', 'VND']);

function roundForCurrency(amount: number, currencyCode: string): number {
    const code = String(currencyCode || '').trim().toUpperCase();
    if (ZERO_DECIMAL_CURRENCIES.has(code)) return Math.round(amount);
    return Math.round(amount * 100) / 100;
}

export type PayInPlaceBreakdown = {
    planId: PayInPlacePlanId;
    payNowPercent: number;
    surchargePercent: number;
    /** The bill before the addition (after discounts). */
    baseTotal: number;
    /** The addition itself. */
    surchargeAmount: number;
    /** baseTotal + surchargeAmount: the new bill. */
    totalAmount: number;
    /** payNowPercent of totalAmount. */
    dueNowAmount: number;
    /** What is left to pay at the place. dueNow + dueLater === totalAmount, always. */
    dueLaterAmount: number;
};

export function applyPayInPlacePlan(baseTotal: number, currencyCode: string, planId: PayInPlacePlanId): PayInPlaceBreakdown {
    const plan = PAY_IN_PLACE_PLANS[planId];
    const base = roundForCurrency(Math.max(0, Number(baseTotal) || 0), currencyCode);

    const surchargeAmount = roundForCurrency((base * plan.surchargePercent) / 100, currencyCode);
    const totalAmount = roundForCurrency(base + surchargeAmount, currencyCode);
    const dueNowAmount = roundForCurrency((totalAmount * plan.payNowPercent) / 100, currencyCode);
    // Computed as a remainder, never as its own percentage, so the two parts can't drift apart by a rounding unit.
    const dueLaterAmount = roundForCurrency(totalAmount - dueNowAmount, currencyCode);

    return {
        planId,
        payNowPercent: plan.payNowPercent,
        surchargePercent: plan.surchargePercent,
        baseTotal: base,
        surchargeAmount,
        totalAmount,
        dueNowAmount,
        dueLaterAmount,
    };
}