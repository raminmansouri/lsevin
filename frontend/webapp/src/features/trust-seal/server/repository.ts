import "server-only";

import { unstable_cache } from "next/cache";

import sql from "@/config/database/db";

import type { DomainTrustSeal } from "../enamad";

/** Public reads are cached under this tag; admin saves revalidate it. */
export const TRUST_SEALS_TAG = "global:trust-seals";

export type DomainTrustSealAdminRow = DomainTrustSeal & { updatedAt: string };

async function readActiveSeals(): Promise<DomainTrustSeal[]> {
  return sql<DomainTrustSeal[]>`
    select host, enamad_id as "enamadId", enamad_code as "enamadCode"
    from content.domain_trust_seals
    where is_active
    order by host
  `;
}

const cachedSeals = unstable_cache(readActiveSeals, ["domain-trust-seals"], { tags: [TRUST_SEALS_TAG], revalidate: 300 });

/**
 * Every active seal. The page picks the one for its own domain in the browser, because
 * lsevincare.com and appmain.lsevin.com share the same cached pages.
 *
 * Never throws: a footer must render without a database (next build) or before migration
 * 0107 has run. A failure is not cached (unstable_cache only stores a returned value).
 */
export async function listDomainTrustSeals(): Promise<DomainTrustSeal[]> {
  try {
    return await cachedSeals();
  } catch (error) {
    if (process.env.NEXT_PHASE !== "phase-production-build") {
      console.error("[trust-seal] could not read domain seals", error instanceof Error ? error.message : error);
    }
    return [];
  }
}

export async function listDomainTrustSealsForAdmin(): Promise<DomainTrustSealAdminRow[]> {
  return sql<DomainTrustSealAdminRow[]>`
    select host, enamad_id as "enamadId", enamad_code as "enamadCode", updated_at::text as "updatedAt"
    from content.domain_trust_seals
    where is_active
    order by host
  `;
}

export async function upsertDomainTrustSeal(input: DomainTrustSeal & { updatedBy: string | null }): Promise<void> {
  await sql`
    insert into content.domain_trust_seals (host, enamad_id, enamad_code, is_active, updated_at, updated_by)
    values (${input.host}, ${input.enamadId}, ${input.enamadCode}, true, now(), ${input.updatedBy}::uuid)
    on conflict (host) do update set
      enamad_id = excluded.enamad_id,
      enamad_code = excluded.enamad_code,
      is_active = true,
      updated_at = now(),
      updated_by = excluded.updated_by
  `;
}

/**
 * Removes a domain's seal. Soft (is_active = false) rather than a delete, so the change
 * replicates between the sites as an update of the same row.
 */
export async function removeDomainTrustSeal(host: string, updatedBy: string | null): Promise<boolean> {
  const rows = await sql`
    update content.domain_trust_seals
       set is_active = false, updated_at = now(), updated_by = ${updatedBy}::uuid
     where host = ${host} and is_active
    returning host
  `;
  return rows.length > 0;
}
