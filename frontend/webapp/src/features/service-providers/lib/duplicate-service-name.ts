import "server-only";

import sql from "@/config/database/db";
import type { IProblem } from "@/types/error";

export function normalizeServiceName(value: string): string {
  return value.normalize("NFKC").replace(/\s+/g, " ").trim().toLowerCase();
}

/** True when two translation maps share a locale whose names are the same after normalising. */
export function sameServiceName(
  a: Record<string, string>,
  b: Record<string, string>
): boolean {
  return Object.entries(a).some(([locale, name]) => {
    const left = normalizeServiceName(name ?? "");
    const other = b[locale];
    return left !== "" && other != null && left === normalizeServiceName(other);
  });
}

/**
 * Two active services of one provider with the same name get "-2", "-3" URL
 * slugs and become near-identical duplicate pages. Returns the existing service
 * that already uses this name, or null when the name is free.
 */
export async function findDuplicateServiceName(input: {
  serviceProviderId: string;
  name: { translations: Record<string, string> };
  excludeServiceId?: string;
}): Promise<{ id: string; slug: string | null } | null> {
  const rows = await sql<
    { id: string; slug: string | null; names: Record<string, string> | null }[]
  >`
    select id::text as id, slug, display_name_translations as names
      from category.provider_services
     where service_provider_id = ${input.serviceProviderId}::uuid
       and is_active = true
       and (${input.excludeServiceId ?? null}::uuid is null or id <> ${input.excludeServiceId ?? null}::uuid)
  `;
  const hit = rows.find((row) =>
    sameServiceName(input.name.translations, row.names ?? {})
  );
  return hit ? { id: hit.id, slug: hit.slug } : null;
}

export function duplicateServiceNameProblem(existingId: string): IProblem {
  return {
    title: "Conflict",
    status: 409,
    detail:
      "This provider already has an active service with the same name. Give the service a distinguishing name, or edit the existing one.",
    errors: { name: ["duplicate_service_name"] },
    err: { existingServiceId: existingId },
  };
}
