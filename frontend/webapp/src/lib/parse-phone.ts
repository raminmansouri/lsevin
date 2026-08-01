import { CountryCode, parsePhoneNumberWithError } from "libphonenumber-js";

import { ParsedPhone } from "@/features/shared/types/common";

/**
 * Split a phone number into its national part and country.
 *
 * This lives apart from `@/lib/formatters` on purpose. `libphonenumber-js` ships
 * a ~120 KB metadata table (30 KB gzipped), and formatters.ts also exports
 * `formatPrice`, `formatDate` and `toPersianDigits`, which nearly every screen
 * imports — so one function put that table into the client bundle of pages that
 * never touch a phone number. Every caller of `parsePhone` is a server action
 * (sign-up, create/update service provider), so nothing is lost by making the
 * dependency explicit here.
 *
 * Keep it that way: import this from server code, not from components.
 */
export function parsePhone(phoneNumber: string): ParsedPhone | null {
  try {
    const parsed = parsePhoneNumberWithError(phoneNumber);

    return {
      value: parsed.nationalNumber,
      country: parsed.country as CountryCode,
    };
  } catch {
    return null;
  }
}
