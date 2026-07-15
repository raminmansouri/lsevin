import { NextResponse, type NextRequest } from "next/server";

// App Router route handler for client IP geolocation. (Previously this lived as
// a Pages-style `client-ip-geo.ts` which the App Router never registered, so the
// `[...nextauth]` catch-all swallowed it -> "UnknownAction". This is the fix.)
export const dynamic = "force-dynamic";

type ClientIpGeoResponse = {
  countryCode: string | null;
  country: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
};

function trimOrNull(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function stringOrNull(value: unknown) {
  if (typeof value !== "string") return null;
  return trimOrNull(value);
}

function numberOrNull(value: unknown): number | null {
  if (value == null || value === "") return null;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeClientIp(value?: string | null) {
  const first = trimOrNull(value)?.split(",")[0]?.trim();
  if (!first || first.toLowerCase() === "unknown") return null;
  return first.replace(/^::ffff:/i, "").replace(/^\[|\]$/g, "").replace(/:\d+$/, "");
}

function isPublicIpAddress(ip: string) {
  const value = ip.toLowerCase();
  if (value === "::1" || value === "localhost") return false;
  if (value.startsWith("fc") || value.startsWith("fd") || value.startsWith("fe80:")) return false;

  const parts = value.split(".").map((part) => Number(part));
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) {
    return value.includes(":"); // treat (non-link-local) IPv6 as public
  }
  const [a, b] = parts;
  if (a === 10 || a === 127 || a === 0 || a === 169) return false;
  if (a === 172 && b >= 16 && b <= 31) return false;
  if (a === 192 && b === 168) return false;
  return true;
}

function getClientIp(req: NextRequest) {
  const h = req.headers;
  const candidates = [
    h.get("x-forwarded-for"),
    h.get("x-real-ip"),
    h.get("true-client-ip"),
    h.get("x-client-ip"),
  ];
  for (const candidate of candidates) {
    const ip = normalizeClientIp(candidate);
    if (ip && isPublicIpAddress(ip)) return ip;
  }
  return null;
}

function buildIpGeoLookupUrl(ip: string) {
  if (process.env.DISABLE_PUBLIC_IP_GEOLOOKUP === "true") return null;
  const template = trimOrNull(process.env.IP_GEOLOCATION_ENDPOINT) || "https://ipapi.co/{ip}/json/";
  return template.includes("{ip}") ? template.replace("{ip}", encodeURIComponent(ip)) : template;
}

function mapGeoPayload(payload: Record<string, unknown> | null): ClientIpGeoResponse | null {
  if (!payload || typeof payload !== "object") return null;
  if (payload.error === true || payload.success === false || payload.status === "fail") return null;

  const countryCode =
    stringOrNull(
      payload.countryCode ??
        payload.country_code ??
        payload.country_code2 ??
        payload.countryCodeIso2 ??
        payload.country,
    )?.toUpperCase() ?? null;
  const country = stringOrNull(payload.countryName ?? payload.country_name ?? payload.country_name_en ?? payload.country);
  const city = stringOrNull(payload.city ?? payload.cityName ?? payload.regionName);
  const latitude = numberOrNull(payload.latitude ?? payload.lat);
  const longitude = numberOrNull(payload.longitude ?? payload.lon ?? payload.lng);

  if (!countryCode && !country && !city && (latitude == null || longitude == null)) return null;
  return { countryCode, country, city, latitude, longitude };
}

async function fetchGeoPayload(url: string) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 2500);
  try {
    const response = await fetch(url, { cache: "no-store", signal: controller.signal });
    if (!response.ok) return null;
    return (await response.json()) as Record<string, unknown>;
  } catch {
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function GET(req: NextRequest) {
  const ip = getClientIp(req);
  if (!ip) return new NextResponse(null, { status: 204 });

  const url = buildIpGeoLookupUrl(ip);
  if (!url) return new NextResponse(null, { status: 204 });

  const location = mapGeoPayload(await fetchGeoPayload(url));
  if (!location) return new NextResponse(null, { status: 204 });

  return NextResponse.json(location, { headers: { "Cache-Control": "no-store, max-age=0" } });
}
