import type { Country } from "react-phone-number-input";

/** Country the phone inputs start on when nothing better is known. */
export const FALLBACK_PHONE_COUNTRY: Country = "IR";

/** Remembers the country the visitor last picked in an auth phone input. */
export const PHONE_COUNTRY_COOKIE = "phone_country";
export const PHONE_COUNTRY_TTL_SECONDS = 60 * 60 * 24 * 365;

/** Client-side: store the visitor's pick so the next auth page starts on it. */
export function rememberPhoneCountry(country?: Country) {
  if (!country) return;
  document.cookie = `${PHONE_COUNTRY_COOKIE}=${country};path=/;max-age=${PHONE_COUNTRY_TTL_SECONDS};samesite=lax`;
}
