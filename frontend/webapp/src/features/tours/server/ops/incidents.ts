import "server-only";

import db from "@/config/database/db";

import { fail, mapDbError } from "../platform/errors";
import { requireProviderRole, type Actor } from "../platform/roles";

import { auditOps, authorizeDeparture, iso, notifyUser, platformAdminIds, requireUuid, scopeFor, type Tx } from "./common";

/** Operational incidents (M-015..M-017, V-046). Critical ones page platform admins. */

export type IncidentInput = { departureId: string; severity: "low" | "medium" | "high" | "critical"; kind: string; description: string };

async function pageAdmins(incidentId: string, title: string, severity: string, kind: string) {
  const admins = await platformAdminIds().catch(() => []);
  for (const id of admins) {
    await notifyUser({ userId: id, type: "system", title, body: `${severity.toUpperCase()} tour incident: ${kind}`, entityType: "tour_incident", entityId: incidentId, data: { kind: "tour_incident", severity, href: `/admin/tours-platform/incidents/${incidentId}` } });
  }
  return admins.length;
}

export async function reportIncident(actor: Actor, input: IncidentInput): Promise<{ id: string }> {
  const access = await authorizeDeparture(actor, input.departureId, { minimum: "staff", allowGuide: true });
  if (!["low", "medium", "high", "critical"].includes(input.severity)) throw fail.validation("invalid_severity");
  if (!/^[a-z][a-z0-9_]{1,59}$/.test(String(input.kind ?? ""))) throw fail.validation("invalid_kind");
  const description = String(input.description ?? "").trim();
  if (description.length < 1 || description.length > 4000) throw fail.validation("invalid_description");
  let id: string;
  try {
    id = await db.begin(async (tx) => {
      const [r] = await tx<any[]>`
        insert into tour.incidents (departure_id, service_provider_id, severity, kind, description, reported_by)
        values (${input.departureId}::uuid, ${access.dep.serviceProviderId}::uuid, ${input.severity}, ${input.kind}, ${description}, ${actor.userId}::uuid)
        returning id::text`;
      await auditOps(tx as unknown as Tx, actor, access.scope, access.dep.serviceProviderId, "incident", r.id, "incident_reported", { severity: input.severity, kind: input.kind });
      return r.id as string;
    });
  } catch (e) {
    throw mapDbError(e, "reportIncident");
  }
  if (input.severity === "critical") await pageAdmins(id, "Critical tour incident", input.severity, input.kind);
  return { id };
}

async function incidentOwner(incidentId: string) {
  requireUuid(incidentId, "incident_not_found");
  const [r] = await db<any[]>`select status, severity, kind, service_provider_id::text from tour.incidents where id = ${incidentId}::uuid`;
  if (!r) throw fail.notFound("incident_not_found");
  return r as { status: string; severity: string; kind: string; service_provider_id: string | null };
}

export async function escalateIncident(actor: Actor, incidentId: string): Promise<void> {
  const inc = await incidentOwner(incidentId);
  if (!actor.isAdmin) {
    if (!inc.service_provider_id) throw fail.forbidden();
    await requireProviderRole(actor, inc.service_provider_id, "staff");
  }
  if (inc.status !== "open") throw fail.conflict("incident_not_open");
  await db.begin(async (tx) => {
    const r = await tx`update tour.incidents set status = 'escalated', escalated_at = now() where id = ${incidentId}::uuid and status = 'open' returning id`;
    if (r.length === 0) throw fail.conflict("incident_not_open");
    await auditOps(tx as unknown as Tx, actor, scopeFor(actor, inc.service_provider_id), inc.service_provider_id, "incident", incidentId, "incident_escalated", {});
  });
  await pageAdmins(incidentId, "Tour incident escalated", inc.severity, inc.kind);
}

export async function resolveIncident(actor: Actor, incidentId: string, resolution: string): Promise<void> {
  const inc = await incidentOwner(incidentId);
  if (!actor.isAdmin) {
    if (!inc.service_provider_id) throw fail.forbidden();
    await requireProviderRole(actor, inc.service_provider_id, "manager");
  }
  const text = String(resolution ?? "").trim();
  if (text.length < 1 || text.length > 4000) throw fail.validation("resolution_required");
  await db.begin(async (tx) => {
    const r = await tx`update tour.incidents set status = 'resolved', resolved_at = now(), resolution = ${text} where id = ${incidentId}::uuid and status <> 'resolved' returning id`;
    if (r.length === 0) throw fail.conflict("incident_already_resolved");
    await auditOps(tx as unknown as Tx, actor, scopeFor(actor, inc.service_provider_id), inc.service_provider_id, "incident", incidentId, "incident_resolved", {});
  });
}

export async function listIncidents(actor: Actor, filters: { serviceProviderId?: string | null; status?: string | null; departureId?: string | null } = {}) {
  if (!actor.userId) throw fail.auth();
  if (filters.serviceProviderId) requireUuid(filters.serviceProviderId, "provider_not_found");
  if (filters.departureId) requireUuid(filters.departureId, "departure_not_found");
  if (filters.status && !["open", "escalated", "resolved"].includes(filters.status)) throw fail.validation("invalid_status");
  if (!actor.isAdmin) {
    if (!filters.serviceProviderId) throw fail.validation("service_provider_required");
    await requireProviderRole(actor, filters.serviceProviderId, "staff");
  }
  const rows = await db<any[]>`
    select i.id::text, i.departure_id::text, i.service_provider_id::text, i.severity, i.kind, i.description, i.status,
           i.reported_by::text, i.escalated_at, i.resolved_at, i.resolution, i.created_at, d.starts_at
      from tour.incidents i left join tour.departures d on d.id = i.departure_id
     where (${filters.serviceProviderId ?? null}::uuid is null or i.service_provider_id = ${filters.serviceProviderId ?? null}::uuid)
       and (${filters.status ?? null}::text is null or i.status = ${filters.status ?? null})
       and (${filters.departureId ?? null}::uuid is null or i.departure_id = ${filters.departureId ?? null}::uuid)
     order by case i.severity when 'critical' then 0 when 'high' then 1 when 'medium' then 2 else 3 end, i.created_at desc
     limit 300`;
  return rows.map((r) => ({
    id: r.id, departureId: r.departure_id, serviceProviderId: r.service_provider_id, severity: r.severity, kind: r.kind,
    description: r.description, status: r.status, reportedBy: r.reported_by, escalatedAt: iso(r.escalated_at), resolvedAt: iso(r.resolved_at),
    resolution: r.resolution, createdAt: iso(r.created_at)!, departureStartsAt: iso(r.starts_at),
  }));
}
