import 'server-only';

import sql from '@/config/database/db';

import type { FavoriteEntityType } from '../types';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{12}$/i;
const FAVORITE_TYPES = new Set<FavoriteEntityType>(['provider', 'service', 'specialist']);

export function isValidFavoriteEntityType(value: unknown): value is FavoriteEntityType {
  return typeof value === 'string' && FAVORITE_TYPES.has(value as FavoriteEntityType);
}

export function isValidFavoriteEntityId(value: unknown): value is string {
  return typeof value === 'string' && UUID_RE.test(value);
}

/**
 * Maps a signed-in user's IDENTITY id (identity.asp_net_users.id, what the session
 * stores) to their CUSTOMER id (customer.customers.id, the FK target of
 * customer.favorites.customer_id). These two ids differ in general, so writing the
 * raw identity id as customer_id violates the FK and the favorite never persists.
 *
 * Same resolution the profile favorites/provider pages use: try an exact id match
 * first (some flows already hold a customer id), then fall back to matching the
 * identity user to a customer by email or phone. Returns null when unresolved.
 */
export async function resolveFavoritesCustomerId(userId?: string | null): Promise<string | null> {
  const rawUserId = String(userId || '').trim();
  if (!UUID_RE.test(rawUserId)) return null;

  const exact = await sql<{ id: string }[]>`
    select id::text as id
    from customer.customers
    where id = ${rawUserId}::uuid
    limit 1
  `;
  if (exact[0]?.id) return exact[0].id;

  const matched = await sql<{ id: string }[]>`
    select c.id::text as id
    from identity.asp_net_users u
    join customer.customers c
      on (
        (nullif(c.email, '') is not null and lower(c.email) = lower(u.email))
        or (
          nullif(c.phone_number, '') is not null
          and c.phone_number = u.phone_number
          and c.phone_number_country_code = u.phone_number_country_code
        )
      )
    where u.id = ${rawUserId}::uuid
    order by case when lower(c.email) = lower(u.email) then 0 else 1 end
    limit 1
  `;

  return matched[0]?.id || null;
}

export async function getIsFavorite(input: {
  customerId?: string | null;
  favoriteType: FavoriteEntityType;
  entityId: string;
}): Promise<boolean> {
  if (!input.customerId || !isValidFavoriteEntityId(input.customerId) || !isValidFavoriteEntityId(input.entityId)) {
    return false;
  }

  const rows = await sql<{ exists: boolean }[]>`
    select exists(
      select 1
      from customer.favorites f
      where f.customer_id = ${input.customerId}::uuid
        and f.favorite_type = ${input.favoriteType}::customer.favorite_type
        and f.entity_id = ${input.entityId}::uuid
      limit 1
    ) as exists
  `;

  return Boolean(rows[0]?.exists);
}

export async function setFavoriteState(input: {
  customerId: string;
  favoriteType: FavoriteEntityType;
  entityId: string;
  isFavorite: boolean;
}): Promise<boolean> {
  if (!isValidFavoriteEntityId(input.customerId) || !isValidFavoriteEntityId(input.entityId)) {
    throw new Error('Invalid favorite identifiers.');
  }

  if (input.isFavorite) {
    await sql`
      insert into customer.favorites (customer_id, favorite_type, entity_id)
      select ${input.customerId}::uuid, ${input.favoriteType}::customer.favorite_type, ${input.entityId}::uuid
      where not exists (
        select 1
        from customer.favorites f
        where f.customer_id = ${input.customerId}::uuid
          and f.favorite_type = ${input.favoriteType}::customer.favorite_type
          and f.entity_id = ${input.entityId}::uuid
      )
    `;
    return true;
  }

  await sql`
    delete from customer.favorites
    where customer_id = ${input.customerId}::uuid
      and favorite_type = ${input.favoriteType}::customer.favorite_type
      and entity_id = ${input.entityId}::uuid
  `;

  return false;
}

export async function toggleFavoriteState(input: {
  customerId: string;
  favoriteType: FavoriteEntityType;
  entityId: string;
}): Promise<boolean> {
  if (!isValidFavoriteEntityId(input.customerId) || !isValidFavoriteEntityId(input.entityId)) {
    throw new Error('Invalid favorite identifiers.');
  }

  const removed = await sql<{ id: number }[]>`
    delete from customer.favorites
    where customer_id = ${input.customerId}::uuid
      and favorite_type = ${input.favoriteType}::customer.favorite_type
      and entity_id = ${input.entityId}::uuid
    returning id
  `;

  if (removed.length > 0) return false;

  await sql`
    insert into customer.favorites (customer_id, favorite_type, entity_id)
    select ${input.customerId}::uuid, ${input.favoriteType}::customer.favorite_type, ${input.entityId}::uuid
    where not exists (
      select 1
      from customer.favorites f
      where f.customer_id = ${input.customerId}::uuid
        and f.favorite_type = ${input.favoriteType}::customer.favorite_type
        and f.entity_id = ${input.entityId}::uuid
    )
  `;

  return true;
}
