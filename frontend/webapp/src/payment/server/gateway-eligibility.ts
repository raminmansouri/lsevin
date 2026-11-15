import "server-only";

import { parsePhoneNumberWithError } from "libphonenumber-js";

import sql from "@/config/database/db";

import { isIranianCardGateway, isPaymentGatewayCode } from "../gateways";

import type { PaymentGatewayCode } from "../types";

/**
 * Which payment rails a customer may use, decided by the country of the phone
 * number they registered with.
 *
 * The region is the preferred rail. An administrator can intentionally disable
 * one rail, however; when only one gateway is enabled, it must remain usable
 * instead of routing customers into a disabled/unconfigured provider.
 *
 * Phone country is used rather than GeoIP on purpose. VPN use is close to
 * universal in Iran, so the Caddy `X-Country` header routinely reports a
 * European country for a Tehran customer — keying payment off it would hide
 * Zarinpal from most of the primary market.
 */
export type PaymentRegion = "iran" | "international";

const IRAN_ISO = "IR";
// Accepted spellings of Iran's dialling code. The column is ISO alpha-2 for
// customers registered through sign-up (parsePhone stores `parsed.country`),
// but provider/admin forms write "+98" into the same column, so both appear.
const IRAN_DIAL_CODES = new Set(["98", "+98", "0098"]);

type IdentityPhoneRow = {
  phoneNumberCountryCode: string | null;
  phoneNumber: string | null;
};

function normalizeCountryToken(value: string | null | undefined): string {
  return String(value ?? "").trim().toUpperCase();
}

/**
 * Read a region out of the stored country-code column, which holds either an
 * ISO alpha-2 code ("IR") or a dialling code ("+98") depending on which form
 * created the row. Returns null when the column is empty or unrecognisable.
 */
function regionFromCountryCode(value: string | null | undefined): PaymentRegion | null {
  const token = normalizeCountryToken(value);
  if (!token) return null;

  if (token === IRAN_ISO) return "iran";
  if (IRAN_DIAL_CODES.has(token)) return "iran";

  // A well-formed ISO code or dialling code that is not Iran's.
  if (/^[A-Z]{2}$/.test(token) || /^\+?\d{1,4}$/.test(token)) return "international";

  return null;
}

/**
 * Last resort when the country column is empty: parse the number itself.
 * Only E.164 input resolves here — a legacy national-format Iranian number
 * ("09121234567") has no country to find, which is exactly why the caller
 * treats an unresolved region as Iran.
 */
function regionFromPhoneNumber(value: string | null | undefined): PaymentRegion | null {
  const phone = String(value ?? "").trim();
  if (!phone) return null;

  try {
    const parsed = parsePhoneNumberWithError(phone.startsWith("+") ? phone : `+${phone}`);
    if (!parsed?.country) return null;
    return parsed.country === IRAN_ISO ? "iran" : "international";
  } catch {
    return null;
  }
}

/**
 * Resolve the paying customer's region from their identity record.
 *
 * Falls back to "iran" when nothing resolves. That default is deliberate: rows
 * with no usable country are overwhelmingly legacy Iranian registrations stored
 * in national format, and the safe failure for the launch market is to offer
 * Zarinpal — a customer who genuinely is abroad sees a gateway they cannot use
 * and can contact support, whereas defaulting the other way would hide Zarinpal
 * from Iranian customers who have no alternative.
 */
export async function resolveUserPaymentRegion(userId: string): Promise<PaymentRegion> {
  const rows = await sql<IdentityPhoneRow[]>`
    select
      u.phone_number_country_code as "phoneNumberCountryCode",
      u.phone_number as "phoneNumber"
    from identity.asp_net_users u
    where u.id = ${userId}
    limit 1
  `;

  const row = rows[0];
  if (!row) return "iran";

  const fromCode = regionFromCountryCode(row.phoneNumberCountryCode);
  if (fromCode) return fromCode;

  const fromNumber = regionFromPhoneNumber(row.phoneNumber);
  if (fromNumber) return fromNumber;

  console.warn("[payment:eligibility] no country on identity record; defaulting to Iran", { userId });
  return "iran";
}

/**
 * The rail a region pays on. Iran: an Iranian card gateway (Zibal or Zarinpal, whichever the
 * admin ranks first among those enabled and usable on this domain). Everyone else: BTCPay.
 */
export function isGatewayAllowedForRegion(gateway: PaymentGatewayCode | string, region: PaymentRegion): boolean {
  const code = String(gateway).trim().toLowerCase();
  return region === "iran" ? isIranianCardGateway(code) : code === "btcpay";
}

/**
 * Drop every gateway the region may not use. Applied to the admin-enabled list
 * before it reaches the customer, so a gateway that is enabled globally still
 * never appears to the wrong audience.
 */
export function filterGatewaysForRegion<T extends { code: PaymentGatewayCode | string }>(
  gateways: T[],
  region: PaymentRegion
): T[] {
  // One gateway per region: the first allowed one in the list's order (sort_order), so an
  // Iranian customer is offered exactly one card gateway even when Zibal and Zarinpal are both on.
  const regional = gateways.find((gateway) => isGatewayAllowedForRegion(gateway.code, region));
  if (regional) return [regional];
  return gateways.length === 1 ? gateways : [];
}

export function selectEnabledGatewayForRegion(
  enabledGateways: Array<{ code: PaymentGatewayCode | string }>,
  region: PaymentRegion
): PaymentGatewayCode {
  const eligible = filterGatewaysForRegion(enabledGateways, region);
  const selected = String(eligible[0]?.code ?? "").trim().toLowerCase();
  if (!isPaymentGatewayCode(selected)) {
    throw new Error("No enabled payment gateway is available for this account.");
  }
  return selected as PaymentGatewayCode;
}
