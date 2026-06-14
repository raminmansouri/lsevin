import "server-only";

import sql from "@/config/database/db";

export type BookingPaymentPolicyScopeType =
  | "global"
  | "provider_type"
  | "provider"
  | "service_definition"
  | "provider_service"
  | "addon";

export type ResolveBookingPaymentPolicyInput = {
  providerTypeId?: string | null;
  providerId?: string | null;
  serviceDefinitionId?: string | null;
  providerServiceId?: string | null;
  addonId?: string | null;
};

export type BookingPaymentScheduleLine = {
  lineNo: number;
  lineType: string;
  label: string;
  amount: number;
  currencyCode: string;
  status?: string;
  metadata: Record<string, unknown>;
};

export type BookingPaymentTerms = {
  policyId: string | null;
  collectionMode: string;
  paymentCurrencyCode: string;
  totalAmount: number;
  dueNowAmount: number;
  dueLaterAmount: number;
  depositPercent: number;
  depositFixedAmount: number;
  balanceDueTrigger: string;
  depositRefundableMode: string;
  termsSnapshot: Record<string, unknown>;
  schedule: BookingPaymentScheduleLine[];

  // Backward-compatible aliases used by older UI/service code.
  paymentMode: string;
  paymentMethod: string | null;
  currencyCode: string;
  amountDueNow: number;
  amountToPayNow: number;
  payNowAmount: number;
  depositAmount: number;
  amountDueLater: number;
  remainingAmount: number;
  payNowPercent: number;
  minimumPayNowAmount: number;
  requiresPaymentNow: boolean;
  isOnlinePaymentRequired: boolean;
  allowWallet: boolean;
  allowOnlineCard: boolean;
  policy: Record<string, any> | null;
};

type CalculateInput = {
  policy?: Record<string, any> | null;
  totalAmount?: number | string | null;
  currencyCode?: string | null;
  paymentMethod?: string | null;
};

function normalizeScopeId(value?: string | null) {
  const trimmed = String(value || "").trim();
  return trimmed.length ? trimmed : null;
}

function toNumber(value: unknown, fallback = 0) {
  if (value === null || value === undefined || value === "") return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function clampMoney(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function readFirstNumber(policy: Record<string, any> | null, keys: string[], fallback = 0) {
  if (!policy) return fallback;
  for (const key of keys) {
    const value = policy[key];
    if (value !== null && value !== undefined && value !== "") return toNumber(value, fallback);
  }
  return fallback;
}

function readFirstString(policy: Record<string, any> | null, keys: string[], fallback = "") {
  if (!policy) return fallback;
  for (const key of keys) {
    const value = policy[key];
    if (typeof value === "string" && value.trim().length) return value.trim();
    if (value !== null && value !== undefined && value !== "" && typeof value !== "object") return String(value);
  }
  return fallback;
}

function readFirstBoolean(policy: Record<string, any> | null, keys: string[], fallback = false) {
  if (!policy) return fallback;
  for (const key of keys) {
    const value = policy[key];
    if (typeof value === "boolean") return value;
    if (typeof value === "number") return value !== 0;
    if (typeof value === "string") {
      const normalized = value.trim().toLowerCase();
      if (["true", "1", "yes", "on"].includes(normalized)) return true;
      if (["false", "0", "no", "off"].includes(normalized)) return false;
    }
  }
  return fallback;
}

function isPolicyLike(value: unknown): value is Record<string, any> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function isCurrencyLike(value: unknown) {
  return typeof value === "string" && /^[A-Za-z]{3,10}$/.test(value.trim());
}

function normalizeCalculateArgs(
  arg1?: Record<string, any> | CalculateInput | number | string | null,
  arg2?: number | string | Record<string, any> | null,
  arg3?: string | Record<string, any> | null,
): CalculateInput {
  // New object-style call:
  // calculateBookingPaymentTerms({ totalAmount, currencyCode, policy, paymentMethod })
  if (
    isPolicyLike(arg1) &&
    ("policy" in arg1 || "totalAmount" in arg1 || "currencyCode" in arg1 || "paymentMethod" in arg1)
  ) {
    return arg1 as CalculateInput;
  }

  // Current booking-pro repository call:
  // calculateBookingPaymentTerms(totalAmount, currencyCode, policy)
  if ((typeof arg1 === "number" || typeof arg1 === "string") && isCurrencyLike(arg2) && (arg3 === null || isPolicyLike(arg3))) {
    return {
      totalAmount: arg1,
      currencyCode: String(arg2).trim().toUpperCase(),
      policy: (arg3 as Record<string, any> | null) ?? null,
    };
  }

  // Older call style:
  // calculateBookingPaymentTerms(policy, totalAmount, currencyCode)
  return {
    policy: isPolicyLike(arg1) ? (arg1 as Record<string, any>) : null,
    totalAmount: typeof arg2 === "number" || typeof arg2 === "string" ? arg2 : undefined,
    currencyCode: typeof arg3 === "string" ? arg3 : undefined,
  };
}

export async function resolveBookingPaymentPolicy(input: ResolveBookingPaymentPolicyInput = {}) {
  const candidates: Array<[BookingPaymentPolicyScopeType, string | null]> = [
    ["addon", normalizeScopeId(input.addonId)],
    ["provider_service", normalizeScopeId(input.providerServiceId)],
    ["service_definition", normalizeScopeId(input.serviceDefinitionId)],
    ["provider", normalizeScopeId(input.providerId)],
    ["provider_type", normalizeScopeId(input.providerTypeId)],
    ["global", null],
  ];

  for (const [scopeType, rawScopeId] of candidates) {
    const scopeId = normalizeScopeId(rawScopeId);

    const [policy] = await sql<any[]>`
      select *
      from commercial.booking_payment_policies
      where is_active = true
        and scope_type = ${scopeType}::text
        and (
          (${scopeId}::text is null and (scope_id is null or scope_id::text = ''))
          or scope_id::text = ${scopeId}::text
        )
      order by priority asc, created_at desc
      limit 1
    `;

    if (policy) return policy;
  }

  return null;
}

export function calculateBookingPaymentTerms(
  arg1?: Record<string, any> | CalculateInput | number | string | null,
  arg2?: number | string | Record<string, any> | null,
  arg3?: string | Record<string, any> | null,
): BookingPaymentTerms {
  const input = normalizeCalculateArgs(arg1, arg2, arg3);
  const policy = input.policy ?? null;

  const totalAmount = roundMoney(Math.max(0, toNumber(input.totalAmount, 0)));
  const paymentCurrencyCode = String(
    input.currencyCode || readFirstString(policy, ["payment_currency_code", "currency_code", "currency"], "USD") || "USD",
  ).trim().toUpperCase();

  const rawCollectionMode = readFirstString(
    policy,
    ["collection_mode", "payment_mode", "payment_type", "mode", "booking_payment_mode"],
    "full",
  ).toLowerCase();

  const collectionModeAliases: Record<string, string> = {
    free: "free",
    no_payment: "free",
    not_required: "free",
    free_booking: "free",
    none: "free",

    full: "full",
    full_paid: "full",
    full_payment: "full",
    pay_full: "full",
    online_full: "full",

    fixed: "fixed",
    fixed_price: "fixed",
    fixed_booking: "fixed",
    fixed_booking_fee: "fixed",
    booking_fee: "fixed",

    percent: "percent",
    percentage: "percent",
    percent_booking: "percent",
    partial: "percent",
    deposit: "percent",
    split: "percent",
    advance: "percent",

    pay_later: "provider_collects",
    offline: "provider_collects",
    manual: "provider_collects",
    on_arrival: "provider_collects",
    provider_collects: "provider_collects",
  };

  const collectionMode = collectionModeAliases[rawCollectionMode] ?? rawCollectionMode;

  const paymentMethod =
    input.paymentMethod || readFirstString(policy, ["payment_method", "default_payment_method"], "gateway_card") || null;

  const depositPercent = readFirstNumber(policy, [
    "deposit_percent",
    "pay_now_percent",
    "upfront_percent",
    "advance_percent",
    "minimum_deposit_percent",
    "booking_percent",
    "required_percent",
    "percent_value",
  ], 0);

  const depositFixedAmount = readFirstNumber(policy, [
    "deposit_fixed_amount",
    "deposit_amount",
    "pay_now_amount",
    "upfront_amount",
    "advance_amount",
    "fixed_amount",
    "booking_fixed_amount",
    "required_fixed_amount",
  ], 0);

  const minimumPayNowAmount = readFirstNumber(policy, [
    "minimum_pay_now_amount",
    "minimum_deposit_amount",
    "min_pay_now_amount",
    "min_deposit_amount",
  ], 0);

  let dueNowAmount = totalAmount;
  if (["free", "provider_collects", "zero"].includes(collectionMode)) {
    dueNowAmount = 0;
  } else if (collectionMode === "percent") {
    const percentAmount = depositPercent > 0 ? (totalAmount * depositPercent) / 100 : 0;
    dueNowAmount = Math.max(percentAmount, minimumPayNowAmount);
  } else if (collectionMode === "fixed") {
    dueNowAmount = depositFixedAmount || minimumPayNowAmount;
  } else {
    dueNowAmount = totalAmount;
  }

  dueNowAmount = roundMoney(clampMoney(dueNowAmount, 0, totalAmount));
  const dueLaterAmount = roundMoney(Math.max(0, totalAmount - dueNowAmount));

  const balanceDueTrigger = readFirstString(policy, ["balance_due_trigger"], dueLaterAmount > 0 ? "before_service" : "none");
  const depositRefundableMode = readFirstString(policy, ["deposit_refundable_mode", "refund_mode"], "policy_based");

  const allowWallet = readFirstBoolean(policy, ["allow_wallet", "wallet_enabled", "supports_wallet"], true);
  const allowOnlineCard = readFirstBoolean(policy, ["allow_online_card", "online_card_enabled", "supports_online_card"], true);
  const isOnlinePaymentRequired = readFirstBoolean(
    policy,
    ["is_online_payment_required", "requires_online_payment"],
    dueNowAmount > 0,
  );

  const policyId = policy?.id ? String(policy.id) : null;
  const termsSnapshot: Record<string, unknown> = {
    policyId,
    collectionMode,
    paymentCurrencyCode,
    totalAmount,
    dueNowAmount,
    dueLaterAmount,
    depositPercent,
    depositFixedAmount,
    balanceDueTrigger,
    depositRefundableMode,
    allowWallet,
    allowOnlineCard,
    isOnlinePaymentRequired,
  };

  const schedule: BookingPaymentScheduleLine[] = [];
  if (dueNowAmount > 0) {
    schedule.push({
      lineNo: 1,
      lineType: "deposit",
      label: dueLaterAmount > 0 ? "Deposit due now" : "Payment due now",
      amount: dueNowAmount,
      currencyCode: paymentCurrencyCode,
      metadata: { due: "now" },
    });
  }
  if (dueLaterAmount > 0) {
    schedule.push({
      lineNo: schedule.length + 1,
      lineType: "balance",
      label: "Remaining balance",
      amount: dueLaterAmount,
      currencyCode: paymentCurrencyCode,
      metadata: { due: balanceDueTrigger },
    });
  }
  // Do not insert zero-amount schedule lines. Existing databases often constrain
  // line_type to the collectable line types (deposit/balance), so free bookings are
  // represented by booking_payment_terms with due_now_amount = 0 and no schedule rows.

  const payNowPercent = totalAmount > 0 ? roundMoney((dueNowAmount / totalAmount) * 100) : 0;

  return {
    policyId,
    collectionMode,
    paymentCurrencyCode,
    totalAmount,
    dueNowAmount,
    dueLaterAmount,
    depositPercent,
    depositFixedAmount,
    balanceDueTrigger,
    depositRefundableMode,
    termsSnapshot,
    schedule,

    paymentMode: collectionMode,
    paymentMethod,
    currencyCode: paymentCurrencyCode,
    amountDueNow: dueNowAmount,
    amountToPayNow: dueNowAmount,
    payNowAmount: dueNowAmount,
    depositAmount: dueNowAmount,
    amountDueLater: dueLaterAmount,
    remainingAmount: dueLaterAmount,
    payNowPercent,
    minimumPayNowAmount,
    requiresPaymentNow: dueNowAmount > 0,
    isOnlinePaymentRequired,
    allowWallet,
    allowOnlineCard,
    policy,
  };
}
