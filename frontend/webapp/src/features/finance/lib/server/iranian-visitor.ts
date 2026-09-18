import "server-only";

import { headers } from "next/headers";
import {
  unstable_cacheLife as cacheLife,
  unstable_cacheTag as cacheTag,
} from "next/cache";
import { getLocale } from "next-intl/server";

import { getSession } from "@/lib/auth/session";

/**
 * Is this visitor Iranian? Priority order (agreed with the business):
 *   1. Logged-in customer's phone number country code (+98) -- authoritative
 *      when available, since phone/OTP auth is already Iran-first here.
 *   2. IP geolocation -- for guests, or a logged-in customer without a phone
 *      country code on the session. Cached per IP for a day via the data
 *      cache (`lookupIpCountryCodeCached` below), so repeat visits from the
 *      same address don't re-pay the ipapi.co round trip.
 *   3. Locale (fa-*) -- last resort, when neither of the above resolved.
 *   4. Otherwise: not Iranian.
 *
 * Only call this from an already-dynamic render path (a page/layout using
 * force-dynamic, or a route handler / server action). `headers()` opts the
 * caller out of static rendering, so calling this from a force-static page
 * (e.g. the mobile home rails) would undo that page's ISR.
 */
export async function resolveIsIranianVisitor(): Promise<boolean> {
  const fromPhone = await isIranianFromSessionPhone();
  if (fromPhone !== null) return fromPhone;

  const fromIp = await isIranianFromClientIp();
  if (fromIp !== null) return fromIp;

  return isIranianFromLocale();
}

async function isIranianFromSessionPhone(): Promise<boolean | null> {
  try {
    const session = await getSession();
    const dialCode = session?.user?.phoneNumberCountryCode?.replace(/\D/g, "");
    if (!dialCode) return null;
    return dialCode === "98";
  } catch {
    return null;
  }
}

async function isIranianFromClientIp(): Promise<boolean | null> {
  try {
    const headerList = await headers();
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
    const locale = await getLocale();
    return locale.toLowerCase().startsWith("fa");
  } catch {
    return false;
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
