import "server-only";

import db from "@/config/database/db";

import { fail } from "./errors";

/** The acting principal, resolved server-side from the session (see access.ts). */
export type Actor = {
  userId: string | null;
  roles: string[];
  isAdmin: boolean;
};

export const PROVIDER_ROLE_RANK = { viewer: 1, staff: 2, editor: 3, manager: 4, admin: 5, owner: 6 } as const;
export type ProviderRole = keyof typeof PROVIDER_ROLE_RANK;

/** Active membership only: a suspended or revoked member has no role, effective immediately (V-009). */
export async function providerRoleOf(userId: string, serviceProviderId: string): Promise<ProviderRole | null> {
  const rows = await db<{ role: ProviderRole }[]>`
    select m.role::text as role
      from provider_portal.provider_members m
     where m.user_id = ${userId}::uuid
       and m.service_provider_id = ${serviceProviderId}::uuid
       and m.status = 'active'
     limit 1
  `;
  return rows[0]?.role ?? null;
}

export async function requireProviderRole(actor: Actor, serviceProviderId: string, minimum: ProviderRole): Promise<ProviderRole> {
  if (!actor.userId) throw fail.auth();
  if (actor.isAdmin) return "owner";
  const role = await providerRoleOf(actor.userId, serviceProviderId);
  if (!role || PROVIDER_ROLE_RANK[role] < PROVIDER_ROLE_RANK[minimum]) throw fail.forbidden("provider_role_required");
  return role;
}

/** Translator/reviewer scope (M-030): may edit/approve text for assigned locales only. */
export async function translatorLocales(userId: string, serviceProviderId: string | null): Promise<string[]> {
  const rows = await db<{ locale: string }[]>`
    select locale from tour.translator_assignments
     where user_id = ${userId}::uuid
       and (service_provider_id is null or service_provider_id = ${serviceProviderId}::uuid)
  `;
  return rows.map((r) => r.locale);
}

/**
 * Precise live position is visible only to travelers with a live booking on
 * that departure, the provider's active members, assigned guides, and admins
 * (C-072, AT-19). No public link exists.
 */
export async function canSeeDepartureLocation(actor: Actor, departureId: string): Promise<boolean> {
  if (!actor.userId) return false;
  if (actor.isAdmin) return true;
  const rows = await db<{ ok: boolean }[]>`
    select (
      exists (select 1 from tour.bookings b
               where b.departure_id = ${departureId}::uuid and b.user_id = ${actor.userId}::uuid
                 and b.status in ('confirmed','completed'))
      or exists (select 1 from tour.departures d
                   join provider_portal.provider_members m on m.service_provider_id = d.service_provider_id
                  where d.id = ${departureId}::uuid and m.user_id = ${actor.userId}::uuid and m.status = 'active')
      or exists (select 1 from tour.departure_assignments a join tour.guides g on g.id = a.guide_id
                  where a.departure_id = ${departureId}::uuid and g.user_id = ${actor.userId}::uuid
                    and a.status in ('assigned','accepted'))
    ) as ok
  `;
  return Boolean(rows[0]?.ok);
}
