import 'server-only';

import { cache } from 'react';

import sql from '@/config/database/db';

export type PublicEntityKind = 'provider' | 'specialty' | 'service' | 'specialist' | 'package' | 'category';
export type PublicEntityRef = { id: string; slug: string | null };

// PostgreSQL accepts historical UUID values whose version/variant bits are not RFC 4122.
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function isPublicUuid(value: string): boolean {
  return UUID.test(value);
}

export function isPublicSlug(value: string): boolean {
  return SLUG.test(value) && value.length <= 200;
}

const SLUG_TABLES = {
  provider: 'category.service_providers',
  specialty: 'category.provider_types',
  service: 'category.provider_services',
  specialist: 'category.staff',
  package: 'marketing.special_packages',
  category: 'category.categories',
} as const satisfies Record<PublicEntityKind, string>;

/** The public URL segment for each id, in the same order: its slug, or the id while it has none. */
export async function publicSegmentsForIds(kind: PublicEntityKind, ids: string[]): Promise<string[]> {
  if (ids.length === 0) return [];
  const rows = await sql<PublicEntityRef[]>`
    select id::text as id, slug from ${sql(SLUG_TABLES[kind])} where id = any(${ids}::uuid[])
  `;
  const slugs = new Map(rows.map((row) => [row.id, row.slug]));
  return ids.map((id) => slugs.get(id) ?? id);
}

/**
 * Resolve only public catalog identifiers; SQL table names are fixed, never user-provided.
 * A slug the record used to have (category.public_slug_history, migration 0094)
 * resolves to the record too; its page then redirects to the current slug.
 */
export const resolvePublicEntity = cache(async (kind: PublicEntityKind, value: string): Promise<PublicEntityRef | null> => {
  const byId = isPublicUuid(value);
  if (!byId && !isPublicSlug(value)) return null;
  let rows: PublicEntityRef[];
  switch (kind) {
    case 'provider':
      rows = byId
        ? await sql<PublicEntityRef[]>`select id::text as id, slug from category.service_providers where id = ${value}::uuid and is_active = true limit 1`
        : await sql<PublicEntityRef[]>`select id::text as id, slug from category.service_providers where slug = ${value} and is_active = true limit 1`;
      break;
    case 'specialty':
      rows = byId
        ? await sql<PublicEntityRef[]>`select id::text as id, slug from category.provider_types where id = ${value}::uuid and is_active = true limit 1`
        : await sql<PublicEntityRef[]>`select id::text as id, slug from category.provider_types where slug = ${value} and is_active = true limit 1`;
      break;
    case 'service':
      rows = byId
        ? await sql<PublicEntityRef[]>`select id::text as id, slug from category.provider_services where id = ${value}::uuid and is_active = true limit 1`
        : await sql<PublicEntityRef[]>`select id::text as id, slug from category.provider_services where slug = ${value} and is_active = true limit 1`;
      break;
    case 'specialist':
      rows = byId
        ? await sql<PublicEntityRef[]>`select id::text as id, slug from category.staff where id = ${value}::uuid and is_active = true limit 1`
        : await sql<PublicEntityRef[]>`select id::text as id, slug from category.staff where slug = ${value} and is_active = true limit 1`;
      break;
    case 'package':
      rows = byId
        ? await sql<PublicEntityRef[]>`select id::text as id, slug from marketing.special_packages where id = ${value}::uuid and is_active = true limit 1`
        : await sql<PublicEntityRef[]>`select id::text as id, slug from marketing.special_packages where slug = ${value} and is_active = true limit 1`;
      break;
    case 'category':
      rows = byId
        ? await sql<PublicEntityRef[]>`select id::text as id, slug from category.categories where id = ${value}::uuid and is_active = true limit 1`
        : await sql<PublicEntityRef[]>`select id::text as id, slug from category.categories where slug = ${value} and is_active = true limit 1`;
      break;
  }
  if (rows[0] || byId) return rows[0] ?? null;
  const previous = await sql<PublicEntityRef[]>`
    select t.id::text as id, t.slug
      from category.public_slug_history h
      join ${sql(SLUG_TABLES[kind])} t on t.id = h.entity_id
     where h.kind = ${kind} and h.slug = ${value} and t.is_active = true
     limit 1
  `;
  return previous[0] ?? null;
});
