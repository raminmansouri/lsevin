/**
 * A public domain as a lookup key for per-domain settings (Enamad seal, Zibal token):
 * "https://WWW.LsevinCare.com:443/fa" -> "lsevincare.com". Returns null for anything that is
 * not a dotted domain name (localhost, IP addresses, garbage). Pure: safe on client and server.
 */
const HOST_PATTERN = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/;

export function normalizeHost(value: unknown): string | null {
  let raw = String(value ?? "").trim().toLowerCase();
  if (!raw) return null;
  raw = raw.split(",")[0]!.trim();
  raw = raw.replace(/^[a-z][a-z0-9+.-]*:\/\//, "");
  raw = raw.split(/[/?#]/)[0]!;
  raw = raw.replace(/:\d+$/, "").replace(/\.$/, "").replace(/^www\./, "");
  if (!raw || raw.length > 253 || !HOST_PATTERN.test(raw)) return null;
  if (/^\d+(\.\d+){3}$/.test(raw)) return null;
  return raw;
}
