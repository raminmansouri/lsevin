import "server-only";

import db from "@/config/database/db";

import { fail, logUnexpected } from "../platform/errors";
import { PROVIDER_ROLE_RANK, providerRoleOf, type Actor, type ProviderRole } from "../platform/roles";

/**
 * Shared helpers of the operations layer. Every ops function resolves the
 * object it touches from the database (departure → owning provider, guide
 * assignment) and authorizes the actor against THAT, never against ids or
 * roles the caller asserts (S-027, AT-14).
 */

export type Tx = typeof db;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_RE.test(value);
}
export function requireUuid(value: unknown, code = "not_found"): string {
  if (!isUuid(value)) throw fail.notFound(code);
  return value;
}

export function iso(value: unknown): string | null {
  if (value == null) return null;
  const d = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export function isoDateOf(value: unknown): string {
  return value instanceof Date ? value.toISOString().slice(0, 10) : String(value).slice(0, 10);
}

export type DepartureCtx = {
  id: string;
  tourId: string;
  serviceProviderId: string;
  startsAt: Date;
  endsAt: Date | null;
  status: string;
  timezone: string;
  capacity: number;
  bookedCount: number;
  heldCount: number;
  delayMinutes: number;
  sourceLocale: string;
};

export async function loadDeparture(departureId: string, q: Tx = db): Promise<DepartureCtx> {
  requireUuid(departureId, "departure_not_found");
  const [d] = await q<any[]>`
    select d.id::text, d.tour_id::text, d.service_provider_id::text, d.starts_at, d.ends_at, d.status, d.timezone,
           d.capacity, d.booked_count, d.held_count, d.delay_minutes, t.source_locale
      from tour.departures d join tour.tours t on t.id = d.tour_id
     where d.id = ${departureId}::uuid`;
  if (!d) throw fail.notFound("departure_not_found");
  return {
    id: d.id, tourId: d.tour_id, serviceProviderId: d.service_provider_id, startsAt: new Date(d.starts_at),
    endsAt: d.ends_at ? new Date(d.ends_at) : null, status: d.status, timezone: d.timezone,
    capacity: d.capacity, bookedCount: d.booked_count, heldCount: d.held_count, delayMinutes: d.delay_minutes,
    sourceLocale: d.source_locale,
  };
}

/** Live (assigned/accepted) guide assignment of this user on this departure. */
export async function guideAssignmentOf(userId: string, departureId: string, q: Tx = db): Promise<{ guideId: string; role: string } | null> {
  const [a] = await q<any[]>`
    select g.id::text as guide_id, a.role
      from tour.departure_assignments a join tour.guides g on g.id = a.guide_id
     where a.departure_id = ${departureId}::uuid and g.user_id = ${userId}::uuid
       and a.status in ('assigned','accepted') and g.status <> 'suspended'
     order by case a.role when 'lead_guide' then 0 else 1 end
     limit 1`;
  return a ? { guideId: a.guide_id, role: a.role } : null;
}

export type DepartureAccess = { dep: DepartureCtx; as: "admin" | "guide" | ProviderRole; scope: string };

/**
 * Departure-level operations: a provider member with at least `minimum`, or —
 * when `allowGuide` — a guide assigned to THIS departure, or a platform admin.
 */
export async function authorizeDeparture(actor: Actor, departureId: string, opts: { minimum: ProviderRole; allowGuide?: boolean }): Promise<DepartureAccess> {
  if (!actor.userId) throw fail.auth();
  const dep = await loadDeparture(departureId);
  if (actor.isAdmin) return { dep, as: "admin", scope: "admin" };
  const role = await providerRoleOf(actor.userId, dep.serviceProviderId);
  if (role && PROVIDER_ROLE_RANK[role] >= PROVIDER_ROLE_RANK[opts.minimum]) {
    return { dep, as: role, scope: `provider:${dep.serviceProviderId}` };
  }
  if (opts.allowGuide && (await guideAssignmentOf(actor.userId, departureId))) {
    return { dep, as: "guide", scope: "guide" };
  }
  throw fail.forbidden(opts.allowGuide ? "departure_access_required" : "provider_role_required");
}

export function isStaffAccess(a: DepartureAccess): boolean {
  return a.as !== "guide";
}

/** Writes tour.audit_log with an explicit scope (guide actions are not provider-scoped). */
export async function auditOps(
  q: Tx, actor: { userId: string | null; isAdmin?: boolean }, scope: string, serviceProviderId: string | null,
  entityType: string, entityId: string | null, action: string, detail: Record<string, unknown> = {},
) {
  await q`
    insert into tour.audit_log (actor_user_id, actor_scope, service_provider_id, entity_type, entity_id, action, detail)
    values (${actor.userId}::uuid, ${scope}, ${serviceProviderId}::uuid, ${entityType}, ${entityId}::uuid, ${action}, ${db.json(detail as never)})`;
}

export function scopeFor(actor: Actor, serviceProviderId: string | null): string {
  if (actor.isAdmin) return "admin";
  if (serviceProviderId) return `provider:${serviceProviderId}`;
  return actor.userId ? "customer" : "system";
}

/**
 * In-app notification; failure is logged and reported to the caller but never
 * undoes the operation that triggered it.
 */
export async function notifyUser(input: {
  userId: string; type: "booking" | "system"; title: string; body: string; entityType: string; entityId: string | null; data?: Record<string, unknown>;
}): Promise<string | null> {
  try {
    const { createNotification } = await import("@/app/[locale]/n/app/mobile/notifications/notification-service");
    const id = await createNotification({
      recipientUserId: input.userId, notificationType: input.type, title: input.title, body: input.body,
      entityType: input.entityType, entityId: input.entityId ?? undefined, channels: ["in_app"], data: input.data ?? {},
    } as never);
    return typeof id === "string" ? id : ((id as { id?: string } | null)?.id ?? null);
  } catch (e) {
    logUnexpected("tours.notifyUser", e);
    return null;
  }
}

/** Platform admins (identity roles admin / superadmin). */
export async function platformAdminIds(): Promise<string[]> {
  const rows = await db<{ id: string }[]>`
    select distinct u.id::text as id
      from identity.asp_net_users u
      join identity.asp_net_user_roles ur on ur.user_id = u.id
      join identity.asp_net_roles r on r.id = ur.role_id
     where upper(coalesce(r.normalized_name, r.name, '')) in ('ADMIN','SUPERADMIN')
     order by 1 limit 200`;
  return rows.map((r) => r.id);
}

export function clampText(value: unknown, max: number): string {
  return String(value ?? "").trim().slice(0, max);
}
