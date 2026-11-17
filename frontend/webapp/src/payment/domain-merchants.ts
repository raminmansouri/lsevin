import { normalizeHost as normalizeMerchantHost } from "@/lib/http/host";

import type { DomainMerchant } from "./types";

/**
 * Per-domain merchant tokens (Zibal). Pure functions, no server imports, so they are unit
 * tested and shared by the repository, the provider and the admin form.
 */

export { normalizeMerchantHost };

/** Cleans what is stored or submitted: valid hosts only, one entry per host (last wins). */
export function normalizeDomainMerchants(value: unknown): DomainMerchant[] {
  if (!Array.isArray(value)) return [];
  const byHost = new Map<string, string>();
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const host = normalizeMerchantHost((item as { host?: unknown }).host);
    const merchant = String((item as { merchant?: unknown }).merchant ?? "").trim();
    if (!host) continue;
    byHost.set(host, merchant);
  }
  return [...byHost.entries()].map(([host, merchant]) => ({ host, merchant })).sort((a, b) => a.host.localeCompare(b.host));
}

/** The token for a request's host, or null when that domain has none. */
export function findDomainMerchant(merchants: DomainMerchant[] | null | undefined, host: string | null | undefined): string | null {
  const key = normalizeMerchantHost(host);
  if (!key) return null;
  const merchant = (merchants ?? []).find((item) => item.host === key)?.merchant?.trim();
  return merchant || null;
}

/**
 * Applies an admin save. Tokens reach the form masked, so a blank token means "keep the one
 * stored for this host"; a host missing from the submission is removed; a host with a blank
 * token and nothing stored is dropped (a domain without a token is the same as no row).
 */
export function mergeDomainMerchants(existing: DomainMerchant[] | null | undefined, incoming: unknown): DomainMerchant[] {
  const stored = new Map(normalizeDomainMerchants(existing).map((item) => [item.host, item.merchant]));
  return normalizeDomainMerchants(incoming)
    .map(({ host, merchant }) => ({ host, merchant: merchant || stored.get(host) || "" }))
    .filter((item) => item.merchant);
}

/** Hosts in a submission that have neither a new token nor a stored one. */
export function domainsMissingToken(existing: DomainMerchant[] | null | undefined, incoming: unknown): string[] {
  const stored = new Set(normalizeDomainMerchants(existing).filter((item) => item.merchant).map((item) => item.host));
  return normalizeDomainMerchants(incoming)
    .filter((item) => !item.merchant && !stored.has(item.host))
    .map((item) => item.host);
}

function maskToken(value: string): string {
  const raw = value.trim();
  if (!raw) return "";
  if (raw.length <= 8) return "••••";
  return `${raw.slice(0, 4)}••••${raw.slice(-4)}`;
}

export function maskDomainMerchants(merchants: DomainMerchant[] | null | undefined): DomainMerchant[] {
  return normalizeDomainMerchants(merchants).map((item) => ({ host: item.host, merchant: maskToken(item.merchant) }));
}
