import { normalizeHost } from "@/lib/http/host";

/**
 * Enamad (Iran's e-commerce trust seal). Each domain has its own seal (id + code), issued by
 * enamad.ir for that domain only: the seal image checks the page's Referer, so showing one
 * domain's seal on another domain displays as invalid.
 *
 * Pure helpers, safe on client and server.
 */

export type DomainTrustSeal = {
  /** Normalized host: lowercase, no scheme/port/path, no leading "www.". */
  host: string;
  enamadId: string;
  enamadCode: string;
};

const ID_PATTERN = /^[0-9]{1,20}$/;
const CODE_PATTERN = /^[A-Za-z0-9]{8,64}$/;

/**
 * Reads the seal from whatever the admin pastes: the HTML snippet from the Enamad panel
 * (`<a href="https://trustseal.enamad.ir/?id=…&Code=…"><img src="…logo.aspx?id=…&Code=…" code="…"></a>`),
 * one of its URLs, or "id code" / "id,code". Returns null when no valid id and code are found.
 */
export function parseEnamadInput(value: string): { enamadId: string; enamadCode: string } | null {
  const text = String(value ?? "").trim();
  if (!text) return null;

  // A value ends at the next separator; "id=12a" is not id 12.
  const end = `(?=$|[&#'"\\s;<>])`;
  const id = new RegExp(`[?&;]id=([0-9]{1,20})${end}`, "i").exec(text)?.[1];
  const code =
    new RegExp(`[?&;]code=([A-Za-z0-9]{8,64})${end}`, "i").exec(text)?.[1] ??
    /\bcode\s*=\s*['"]([A-Za-z0-9]{8,64})['"]/i.exec(text)?.[1];
  if (id && code) return { enamadId: id, enamadCode: code };

  const parts = text.split(/[\s,;|]+/).filter(Boolean);
  if (parts.length === 2 && ID_PATTERN.test(parts[0]!) && CODE_PATTERN.test(parts[1]!)) {
    return { enamadId: parts[0]!, enamadCode: parts[1]! };
  }
  return null;
}

export function isValidEnamadSeal(seal: { enamadId: string; enamadCode: string }): boolean {
  return ID_PATTERN.test(seal.enamadId) && CODE_PATTERN.test(seal.enamadCode);
}

export function enamadUrls(seal: { enamadId: string; enamadCode: string }): { href: string; img: string } {
  const query = `id=${encodeURIComponent(seal.enamadId)}&Code=${encodeURIComponent(seal.enamadCode)}`;
  return {
    href: `https://trustseal.enamad.ir/?${query}`,
    img: `https://trustseal.enamad.ir/logo.aspx?${query}`,
  };
}

/** The seal for the domain the page is shown on ("www." ignored), or null when it has none. */
export function sealForHost(seals: readonly DomainTrustSeal[], hostname: string | null | undefined): DomainTrustSeal | null {
  const host = normalizeHost(hostname);
  if (!host) return null;
  return seals.find((seal) => seal.host === host) ?? null;
}
