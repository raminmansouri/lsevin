import type { PaymentGatewayCode } from "./types";

/**
 * Every gateway code the platform knows. Client-safe (no server imports): admin forms and
 * request schemas use it as well.
 */
export const PAYMENT_GATEWAY_CODES = ["zarinpal", "zibal", "btcpay"] as const satisfies readonly PaymentGatewayCode[];

/**
 * Iranian card (Shaparak) gateways. They are interchangeable for a customer: whichever the
 * admin enabled and ranked first (sort order) and that is usable on the current domain is
 * the one offered. Amounts are Rial/Toman and the per-charge cap is the same.
 */
export const IRANIAN_CARD_GATEWAYS = ["zibal", "zarinpal"] as const satisfies readonly PaymentGatewayCode[];

export function isPaymentGatewayCode(value: unknown): value is PaymentGatewayCode {
  return (PAYMENT_GATEWAY_CODES as readonly string[]).includes(String(value ?? "").trim().toLowerCase());
}

export function isIranianCardGateway(value: unknown): boolean {
  return (IRANIAN_CARD_GATEWAYS as readonly string[]).includes(String(value ?? "").trim().toLowerCase());
}

/**
 * Zibal's sandbox (its public test merchant) completes payments without moving money, so a
 * sandbox switch left on in production would credit wallets for free. It only works outside
 * production, or where ZIBAL_SANDBOX_ALLOWED=true is set on purpose (a staging server).
 */
export function zibalSandboxAllowed(): boolean {
  return process.env.NODE_ENV !== "production" || process.env.ZIBAL_SANDBOX_ALLOWED === "true";
}

/** Largest single charge on an Iranian card gateway (100,000,000 Toman); bigger amounts go in installments. */
export const IRANIAN_GATEWAY_MAX_AMOUNT = { IRR: 1_000_000_000, IRT: 100_000_000 } as const;

/**
 * What the gateway sent the customer back with, in the platform's terms. Zarinpal uses
 * `?Authority=..&Status=OK|NOK`; Zibal uses `?trackId=..&success=1|0&status=..`.
 */
export function readGatewayReturn(
  gateway: string,
  params: URLSearchParams
): { authority: string; status: string } {
  if (String(gateway).trim().toLowerCase() === "zibal") {
    const authority = params.get("trackId") ?? params.get("trackid") ?? "";
    return { authority: authority.trim(), status: params.get("success") === "1" ? "OK" : "NOK" };
  }
  const authority = params.get("Authority") ?? params.get("authority") ?? "";
  const status = params.get("Status") ?? params.get("status") ?? "";
  return { authority: authority.trim(), status };
}
