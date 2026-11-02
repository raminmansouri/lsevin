import "server-only";

import { cookies, headers } from "next/headers";
import { isSupportedCountry } from "libphonenumber-js";
import type { Country } from "react-phone-number-input";

import {
  FALLBACK_PHONE_COUNTRY,
  PHONE_COUNTRY_COOKIE,
} from "./phone-country.constants";

function toCountry(value?: string | null): Country | null {
  const code = value?.trim().toUpperCase();
  return code && isSupportedCountry(code) ? code : null;
}

/**
 * Starting country for the sign-in / sign-up / forgot-password phone inputs:
 *   1. The country the visitor picked last time (cookie).
 *   2. The country of their IP: Cloudflare's `CF-IPCountry` (lsevincare.com),
 *      else Caddy's GeoIP `X-Country` (lsevin.ir via ArvanCloud, whose visitors
 *      are in Iran; Arvan sends visitors from outside Iran to lsevincare.com).
 *      VPN users get the VPN's country, like everyone else.
 *   3. Iran.
 */
export async function getPhoneDefaultCountry(): Promise<Country> {
  const fromCookie = toCountry((await cookies()).get(PHONE_COUNTRY_COOKIE)?.value);
  if (fromCookie) return fromCookie;

  const h = await headers();
  return toCountry(h.get("cf-ipcountry")) ?? toCountry(h.get("x-country")) ?? FALLBACK_PHONE_COUNTRY;
}
