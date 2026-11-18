import "server-only";

import { cookies, headers } from "next/headers";
import {
  unstable_cacheLife as cacheLife,
  unstable_cacheTag as cacheTag,
} from "next/cache";
import { getLocale } from "next-intl/server";
import { resolveCurrentUserId } from "@/features/booking-pro/utils/auth";
import { getUserPhoneCountryCode } from "./currency-queries";
import { getSession } from "@/lib/auth/session";
import { routing } from "@/i18n/routing";
import { countryFromHeaders } from "@/lib/market/server";

/**
 * Is this visitor Iranian? Decides the pricing currency (Rial, no multiplier)
 * versus the foreign currency with the provider's international multiplier.
 *
 * Logged-in customer (unchanged):
 *   1. Phone number country code (+98) -- authoritative when available, since
 *      phone/OTP auth is already Iran-first here.
 *   2. IP geolocation, when the account has no phone country. Cached per IP
 *      for a day via the data cache (`lookupIpCountryCodeCached` below).
 *   3. Locale (fa-*), when neither of the above resolved.
 *
 * Guest (not logged in): the site language alone. "fa" means Iranian pricing;
 * every other language gets the foreign currency with the multiplier, exactly
 * like a logged-in non-Iranian customer.
 *
 * Only call this from an already-dynamic render path (a page/layout using
 * force-dynamic, or a route handler / server action). `headers()` opts the
 * caller out of static rendering, so calling this from a force-static page
 * (e.g. the mobile home rails) would undo that page's ISR.
 */
export async function resolveIsIranianVisitor(): Promise<boolean> {
    const userId = await resolveCurrentUserId().catch(() => null);
    if (!userId) {
        const fromLocale = await isIranianFromLocale();
        console.log('[iranian-visitor] guest, decided by LOCALE:', fromLocale);
        return fromLocale;
    }

    const fromPhone = await isIranianFromSessionPhone();
    if (fromPhone !== null) {
        console.log('[iranian-visitor] decided by PHONE:', fromPhone);
        return fromPhone;
    }

    const fromIp = await isIranianFromClientIp();
    if (fromIp !== null) {
        console.log('[iranian-visitor] decided by IP:', fromIp);
        return fromIp;
    }

    const fromLocale = await isIranianFromLocale();
    console.log('[iranian-visitor] decided by LOCALE fallback:', fromLocale);
    return fromLocale;
}

async function isIranianFromSessionPhone(): Promise<boolean | null> {
  try {
    const session = await getSession();
      const raw = session?.user?.phoneNumberCountryCode?.trim();
      if (!raw) {
          // The session doesn't carry the country: read it from the account itself.
          const userId = await resolveCurrentUserId().catch(() => null);
          const country = await getUserPhoneCountryCode(userId).catch(() => null);
          return country ? country === "IR" : null;
      }
      // Sign-up stores an ISO country ("IR", "DE"); older rows may hold a dial code ("98").
      if (/^[A-Za-z]{2}$/.test(raw)) return raw.toUpperCase() === "IR";
      const dialCode = raw.replace(/\D/g, "");
      if (!dialCode) return null;
      return dialCode === "98";
  } catch {
    return null;
  }
}

async function isIranianFromClientIp(): Promise<boolean | null> {
  try {
    const headerList = await headers();
    // The edge's own country first (Cloudflare CF-IPCountry on lsevincare.com,
    // Caddy GeoIP X-Country on lsevin.ir). Behind Cloudflare the forwarded IP is
    // a Cloudflare server, so the third-party lookup below only helps locally.
    const edgeCountry = countryFromHeaders(headerList);
    if (edgeCountry) return edgeCountry === "IR";
    const ip = getClientIpFromHeaders(headerList);
    if (!ip) return null;

    const countryCode = await lookupIpCountryCodeCached(ip);
    if (!countryCode) return null;

    return countryCode === "IR";
  } catch {
    return null;
  }
}

async function isIranianFromLocale(): Promise<boolean> {
  try {
    const locale = await resolveRequestLocale();
    return locale.toLowerCase().startsWith("fa");
  } catch {
    return false;
  }
}

/**
 * The site language this request was made in.
 *
 * Pages and server actions run behind the i18n middleware, which sets
 * next-intl's locale header from the /[locale] segment. The price API routes
 * (/api/finance/price, /api/booking-pro/meal-plans, ...) are excluded from the
 * middleware, so there `getLocale()` would always answer the default ("fa") and
 * an English-page guest would be priced as Iranian. For those, the language of
 * the page that made the fetch (its Referer) decides, then the visitor's saved
 * NEXT_LOCALE choice, then the default.
 */
async function resolveRequestLocale(): Promise<string> {
  const headerList = await headers();

  const fromMiddleware = headerList.get(NEXT_INTL_LOCALE_HEADER);
  if (isSupportedLocale(fromMiddleware)) return fromMiddleware;

  const fromReferer = localeFromPath(headerList.get("referer"));
  if (fromReferer) return fromReferer;

  const cookieStore = await cookies();
  const fromCookie = cookieStore.get("NEXT_LOCALE")?.value;
  if (isSupportedLocale(fromCookie)) return fromCookie;

  return getLocale();
}

const NEXT_INTL_LOCALE_HEADER = "x-next-intl-locale";

function isSupportedLocale(value: string | null | undefined): value is string {
  return Boolean(value) && (routing.locales as readonly string[]).includes(value as string);
}

function localeFromPath(url: string | null): string | null {
  if (!url) return null;
  try {
    const segment = new URL(url, "http://local").pathname.split("/")[1]?.toLowerCase();
    return isSupportedLocale(segment) ? segment : null;
  } catch {
    return null;
  }
}

function normalizeClientIp(value?: string | null) {
  const first = value?.trim().split(",")[0]?.trim();
  if (!first || first.toLowerCase() === "unknown") return null;
  return first.replace(/^::ffff:/i, "").replace(/^\[|\]$/g, "").replace(/:\d+$/, "");
}

function isPublicIpAddress(ip: string) {
  const value = ip.toLowerCase();
  if (value === "::1" || value === "localhost") return false;
  if (value.startsWith("fc") || value.startsWith("fd") || value.startsWith("fe80:")) return false;

  const parts = value.split(".").map((part) => Number(part));
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) {
    return value.includes(":");
  }
  const [a, b] = parts;
  if (a === 10 || a === 127 || a === 0 || a === 169) return false;
  if (a === 172 && b >= 16 && b <= 31) return false;
  if (a === 192 && b === 168) return false;
  return true;
}

function getClientIpFromHeaders(headerList: Headers) {
  const candidates = [
    headerList.get("x-forwarded-for"),
    headerList.get("x-real-ip"),
    headerList.get("true-client-ip"),
    headerList.get("x-client-ip"),
  ];
  for (const candidate of candidates) {
    const ip = normalizeClientIp(candidate);
    if (ip && isPublicIpAddress(ip)) return ip;
  }
  return null;
}

async function lookupIpCountryCodeCached(ip: string): Promise<string | null> {
  "use cache";
  cacheTag("ip-geo");
  cacheLife({ revalidate: 60 * 60 * 24, expire: 60 * 60 * 24 * 7 });

  if (process.env.DISABLE_PUBLIC_IP_GEOLOOKUP === "true") return null;

  const template = process.env.IP_GEOLOCATION_ENDPOINT?.trim() || "https://ipapi.co/{ip}/json/";
  const url = template.includes("{ip}") ? template.replace("{ip}", encodeURIComponent(ip)) : template;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 2500);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) return null;

    const payload = (await response.json()) as Record<string, unknown>;
    if (payload.error === true || payload.success === false || payload.status === "fail") return null;

    const raw =
      payload.countryCode ?? payload.country_code ?? payload.country_code2 ?? payload.countryCodeIso2 ?? payload.country;
    const code = typeof raw === "string" ? raw.trim().toUpperCase() : "";
    return code || null;
  } catch {
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}
