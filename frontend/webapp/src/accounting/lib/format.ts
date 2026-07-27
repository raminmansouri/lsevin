import { toPersianDigits } from "@/lib/formatters";

/**
 * Money formatting for the accounting screens.
 *
 * Amounts arrive as strings from numeric(38,18) and stay strings: the ledger's precision
 * is the point, and Number() would round it away before it reached the page. Only the
 * integer part is grouped, so nothing is ever silently truncated on screen.
 */

const ZERO_DECIMAL = new Set(["IRR", "IRT", "IQD"]);
const THREE_DECIMAL = new Set(["KWD", "OMR"]);
const CRYPTO_DECIMALS: Record<string, number> = { BTC: 8, USDT: 6 };

export function currencyDecimals(currencyCode: string): number {
  const code = currencyCode.toUpperCase();
  if (CRYPTO_DECIMALS[code] !== undefined) return CRYPTO_DECIMALS[code];
  if (ZERO_DECIMAL.has(code)) return 0;
  if (THREE_DECIMAL.has(code)) return 3;
  return 2;
}

function groupDigits(intPart: string): string {
  return intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/** `"1234567.500000000000000000"` + `IRR` → `"1,234,568"` */
export function formatAmount(amount: string, currencyCode: string): string {
  const decimals = currencyDecimals(currencyCode);
  const negative = amount.trim().startsWith("-");
  const [rawInt = "0", rawFrac = ""] = amount.replace("-", "").split(".");

  let intPart = rawInt;
  let fracPart = rawFrac.slice(0, decimals);

  // Round the last kept digit rather than truncating, so a displayed total still adds up.
  if (decimals < rawFrac.length && Number(rawFrac[decimals]) >= 5) {
    const bumped = (BigInt(intPart + (fracPart || "").padEnd(decimals, "0")) + 1n).toString();
    const padded = bumped.padStart(decimals + 1, "0");
    intPart = decimals ? padded.slice(0, -decimals) : padded;
    fracPart = decimals ? padded.slice(-decimals) : "";
  }

  const body = decimals ? `${groupDigits(intPart)}.${fracPart.padEnd(decimals, "0")}` : groupDigits(intPart);
  return negative && Number(amount) !== 0 ? `-${body}` : body;
}

/**
 * Iranians price in Toman, but the ledger stores Rial (1 Toman = 10 Rial). Showing an
 * IRR figure to an Iranian admin without converting is how a number gets misread by a
 * factor of ten — so IRR is always rendered in Toman with the unit named.
 */
export function formatForDisplay(
  amount: string,
  currencyCode: string,
  locale: string
): { value: string; unit: string } {
  const code = currencyCode.toUpperCase();
  const isPersian = locale.startsWith("fa");

  if (code === "IRR" && isPersian) {
    const negative = amount.trim().startsWith("-");
    const [intPart = "0"] = amount.replace("-", "").split(".");
    const toman = intPart.length > 1 ? intPart.slice(0, -1) : "0";
    return {
      value: toPersianDigits(`${negative && toman !== "0" ? "-" : ""}${groupDigits(toman)}`),
      unit: "تومان",
    };
  }

  const formatted = formatAmount(amount, code);
  return { value: isPersian ? toPersianDigits(formatted) : formatted, unit: code };
}

export function formatDateTime(value: string, locale: string): string {
  try {
    const formatted = new Intl.DateTimeFormat(locale.startsWith("fa") ? "fa-IR" : locale, {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(value));
    return formatted;
  } catch {
    return value;
  }
}
