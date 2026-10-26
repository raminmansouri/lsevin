import "server-only";

import db from "@/config/database/db";

import { isIsoDate } from "../../domain/calendar";
import { fail, mapDbError } from "../platform/errors";
import { PROVIDER_ROLE_RANK, providerRoleOf, requireProviderRole, type Actor } from "../platform/roles";

import { auditOps, authorizeDeparture, iso, notifyUser, requireUuid, scopeFor, type Tx } from "./common";
import { deliverNotice, insertNotice, SYSTEM_NOTICE_TEXTS } from "./notices";

/**
 * Guides (V-030, V-048..V-055, V-069, AT-17).
 *
 *   * A guide owns their profile; the public bio is per locale in tour.content
 *     (entity_type 'guide', tour_id null). A changed bio is 'submitted' and goes
 *     live only after a manager of a provider the guide works for, or an admin,
 *     approves it (V-069). Until then the previous published bio stays live.
 *   * Assignments cover the departure's time window; the exclusion constraint
 *     refuses overlaps (conflict/overlapping_assignment). Only platform admins
 *     may override, with a reason.
 */

const LOCALE_RE = /^[a-z]{2,3}(-[A-Za-z]{4})?(-([A-Z]{2}|[0-9]{3}))?$/;
const PHONE_RE = /^\+?\d{7,15}$/;

export type GuideProfile = {
  id: string; userId: string; displayName: string; photoUrl: string | null;
  languages: { code: string; level: string }[]; destinations: string[]; specialties: string[];
  status: string; contactPolicy: "via_platform" | "phone_during_tour"; publicPhone: string | null; emergencyTrained: boolean;
  bios: { locale: string; draft: string | null; published: string | null; status: string }[];
  providers: { serviceProviderId: string; status: string }[];
};

async function guideByUser(userId: string, q: Tx = db) {
  const [g] = await q<any[]>`select * , id::text as id, user_id::text as user_id from tour.guides where user_id = ${userId}::uuid`;
  return g ?? null;
}

async function profileOf(g: any): Promise<GuideProfile> {
  const bios = await db<any[]>`
    select locale, draft_value, published_value, status from tour.content
     where entity_type = 'guide' and entity_id = ${g.id}::uuid and field_key = 'bio' order by locale`;
  const providers = await db<any[]>`select service_provider_id::text, status from tour.provider_guides where guide_id = ${g.id}::uuid order by created_at`;
  return {
    id: g.id, userId: g.user_id, displayName: g.display_name, photoUrl: g.photo_url, languages: g.languages ?? [],
    destinations: g.destinations ?? [], specialties: g.specialties ?? [], status: g.status, contactPolicy: g.contact_policy,
    publicPhone: g.public_phone, emergencyTrained: g.emergency_trained,
    bios: bios.map((b) => ({ locale: b.locale, draft: b.draft_value, published: b.published_value, status: b.status })),
    providers: providers.map((p) => ({ serviceProviderId: p.service_provider_id, status: p.status })),
  };
}

export async function getGuideProfile(actor: Actor): Promise<GuideProfile | null> {
  if (!actor.userId) throw fail.auth();
  const g = await guideByUser(actor.userId);
  return g ? profileOf(g) : null;
}

export type GuideProfileInput = {
  displayName?: string; photoUrl?: string | null; languages?: { code: string; level: string }[];
  destinations?: string[]; specialties?: string[]; contactPolicy?: "via_platform" | "phone_during_tour";
  publicPhone?: string | null; bios?: Record<string, string | null>;
};

export async function saveGuideProfile(actor: Actor, input: GuideProfileInput): Promise<GuideProfile> {
  if (!actor.userId) throw fail.auth();
  const values: Record<string, unknown> = {};
  if (input.displayName !== undefined) {
    const n = String(input.displayName).trim();
    if (n.length < 2 || n.length > 80) throw fail.validation("invalid_display_name");
    values.display_name = n;
  }
  if (input.photoUrl !== undefined) {
    if (input.photoUrl !== null && !/^(https:\/\/|\/)[^\s<>"']{1,1000}$/.test(input.photoUrl)) throw fail.validation("invalid_photo_url");
    values.photo_url = input.photoUrl;
  }
  if (input.languages !== undefined) {
    if (!Array.isArray(input.languages) || input.languages.length > 20) throw fail.validation("invalid_languages");
    for (const l of input.languages) {
      if (!/^[a-z]{2,3}$/.test(String(l?.code)) || !["basic", "conversational", "fluent", "native"].includes(String(l?.level))) throw fail.validation("invalid_languages");
    }
    values.languages = db.json(input.languages.map((l) => ({ code: l.code, level: l.level })) as never);
  }
  for (const key of ["destinations", "specialties"] as const) {
    const v = input[key];
    if (v === undefined) continue;
    if (!Array.isArray(v) || v.length > 30 || v.some((x) => typeof x !== "string" || x.length > 60)) throw fail.validation(`invalid_${key}`);
    values[key] = v.map((x) => x.trim()).filter(Boolean);
  }
  if (input.contactPolicy !== undefined) {
    if (!["via_platform", "phone_during_tour"].includes(input.contactPolicy)) throw fail.validation("invalid_contact_policy");
    values.contact_policy = input.contactPolicy;
  }
  if (input.publicPhone !== undefined) {
    const p = input.publicPhone == null ? null : String(input.publicPhone).replace(/[\s-]/g, "");
    if (p !== null && !PHONE_RE.test(p)) throw fail.validation("invalid_phone");
    values.public_phone = p;
  }
  const bios = Object.entries(input.bios ?? {});
  for (const [loc, text] of bios) {
    if (!LOCALE_RE.test(loc)) throw fail.validation("invalid_locale", { locale: loc });
    if (text != null && String(text).length > 4000) throw fail.validation("bio_too_long");
  }
  try {
    await db.begin(async (tx) => {
      const q = tx as unknown as Tx;
      let g = await guideByUser(actor.userId!, q);
      if (!g) {
        const [u] = await q<any[]>`select first_name, last_name from identity.asp_net_users where id = ${actor.userId}::uuid`;
        const name = (values.display_name as string) ?? (`${u?.first_name ?? ""} ${u?.last_name ?? ""}`.trim() || "Guide");
        [g] = await q<any[]>`insert into tour.guides (user_id, display_name) values (${actor.userId}::uuid, ${name}) returning *, id::text as id, user_id::text as user_id`;
      }
      if (Object.keys(values).length > 0) {
        await q`update tour.guides set ${tx(values as never)}, updated_at = now() where id = ${g.id}::uuid`;
      }
      for (const [loc, text] of bios) {
        const value = text == null || !String(text).trim() ? null : String(text).trim();
        await q`
          insert into tour.content (tour_id, entity_type, entity_id, field_key, locale, draft_value, status, is_source, updated_by)
          values (null, 'guide', ${g.id}::uuid, 'bio', ${loc}, ${value}, ${value ? "submitted" : "missing"}, false, ${actor.userId}::uuid)
          on conflict (entity_type, entity_id, field_key, locale) do update
            set draft_value = excluded.draft_value, status = excluded.status, updated_by = excluded.updated_by, updated_at = now()`;
      }
      await auditOps(q, actor, "guide", null, "guide", g.id, "guide_profile_saved", { fields: Object.keys(values), bioLocales: bios.map(([l]) => l) });
    });
  } catch (e) {
    throw mapDbError(e, "saveGuideProfile");
  }
  return (await getGuideProfile(actor))!;
}

/** Manager of a provider this guide works for, or an admin, approves (or rejects) submitted bio text. */
export async function reviewGuideBio(actor: Actor, guideId: string, decision: "approve" | "reject", locales?: string[]): Promise<{ updated: number }> {
  if (!actor.userId) throw fail.auth();
  requireUuid(guideId, "guide_not_found");
  let scope = "admin";
  let providerId: string | null = null;
  if (!actor.isAdmin) {
    const links = await db<any[]>`select service_provider_id::text from tour.provider_guides where guide_id = ${guideId}::uuid and status in ('invited','active')`;
    for (const l of links) {
      const role = await providerRoleOf(actor.userId, l.service_provider_id);
      if (role && PROVIDER_ROLE_RANK[role] >= PROVIDER_ROLE_RANK.manager) { providerId = l.service_provider_id; break; }
    }
    if (!providerId) throw fail.forbidden("provider_role_required");
    scope = `provider:${providerId}`;
  }
  const filter = locales && locales.length ? locales : null;
  return db.begin(async (tx) => {
    const rows = decision === "approve"
      ? await tx`update tour.content set published_value = draft_value, status = 'published', published_at = now(), approved_by = ${actor.userId}::uuid, approved_at = now()
                  where entity_type = 'guide' and entity_id = ${guideId}::uuid and field_key = 'bio' and status = 'submitted'
                    and (${filter}::text[] is null or locale = any(${filter}::text[])) returning id`
      : await tx`update tour.content set status = 'draft', updated_at = now()
                  where entity_type = 'guide' and entity_id = ${guideId}::uuid and field_key = 'bio' and status = 'submitted'
                    and (${filter}::text[] is null or locale = any(${filter}::text[])) returning id`;
    await auditOps(tx as unknown as Tx, actor, scope, providerId, "guide", guideId, `guide_bio_${decision}d`, { locales: filter ?? "all", count: rows.length });
    return { updated: rows.length };
  });
}

export async function inviteGuide(actor: Actor, serviceProviderId: string, target: { guideUserId?: string | null; phone?: string | null }): Promise<{ guideId: string; status: string }> {
  requireUuid(serviceProviderId, "provider_not_found");
  await requireProviderRole(actor, serviceProviderId, "manager");
  let userId: string | null = null;
  if (target.guideUserId) {
    requireUuid(target.guideUserId, "user_not_found");
    const [u] = await db<any[]>`select id::text from identity.asp_net_users where id = ${target.guideUserId}::uuid`;
    userId = u?.id ?? null;
  } else if (target.phone) {
    const digits = String(target.phone).replace(/\D/g, "").replace(/^0+/, "");
    if (digits.length < 7 || digits.length > 15) throw fail.validation("invalid_phone");
    const rows = await db<any[]>`
      select id::text from identity.asp_net_users
       where regexp_replace(coalesce(phone_number_country_code, '') || coalesce(phone_number, ''), '\\D', '', 'g') = ${digits}
          or regexp_replace(coalesce(phone_number, ''), '\\D', '', 'g') = ${digits}
       limit 2`;
    if (rows.length > 1) throw fail.conflict("ambiguous_phone");
    userId = rows[0]?.id ?? null;
  } else {
    throw fail.validation("guide_user_or_phone_required");
  }
  if (!userId) throw fail.notFound("user_not_found");
  try {
    const out = await db.begin(async (tx) => {
      const q = tx as unknown as Tx;
      let g = await guideByUser(userId!, q);
      if (!g) {
        const [u] = await q<any[]>`select first_name, last_name from identity.asp_net_users where id = ${userId}::uuid`;
        [g] = await q<any[]>`insert into tour.guides (user_id, display_name) values (${userId}::uuid, ${`${u?.first_name ?? ""} ${u?.last_name ?? ""}`.trim() || "Guide"})
                             returning *, id::text as id, user_id::text as user_id`;
      }
      if (g.status === "suspended") throw fail.conflict("guide_suspended");
      const [link] = await q<any[]>`
        insert into tour.provider_guides (service_provider_id, guide_id, status, invited_by)
        values (${serviceProviderId}::uuid, ${g.id}::uuid, 'invited', ${actor.userId}::uuid)
        on conflict (service_provider_id, guide_id) do update
          set status = case when tour.provider_guides.status = 'revoked' then 'invited' else tour.provider_guides.status end,
              invited_by = excluded.invited_by, updated_at = now()
        returning status`;
      await auditOps(q, actor, scopeFor(actor, serviceProviderId), serviceProviderId, "guide", g.id, "guide_invited", {});
      return { guideId: g.id as string, status: link.status as string };
    });
    if (out.status === "invited") {
      await notifyUser({ userId, type: "system", title: "Guide invitation", body: "A tour operator invited you to guide their tours.", entityType: "tour_guide", entityId: out.guideId, data: { kind: "guide_invitation", serviceProviderId } });
    }
    return out;
  } catch (e) {
    throw mapDbError(e, "inviteGuide");
  }
}

/** The invited guide accepts (or declines) working for a provider. */
export async function respondToGuideInvitation(actor: Actor, serviceProviderId: string, accept: boolean): Promise<{ status: string }> {
  if (!actor.userId) throw fail.auth();
  requireUuid(serviceProviderId, "provider_not_found");
  const g = await guideByUser(actor.userId);
  if (!g) throw fail.notFound("invitation_not_found");
  return db.begin(async (tx) => {
    const r = await tx<any[]>`update tour.provider_guides set status = ${accept ? "active" : "revoked"}, updated_at = now()
                               where service_provider_id = ${serviceProviderId}::uuid and guide_id = ${g.id}::uuid and status = 'invited' returning status`;
    if (r.length === 0) throw fail.notFound("invitation_not_found");
    await auditOps(tx as unknown as Tx, actor, "guide", serviceProviderId, "guide", g.id, accept ? "guide_invitation_accepted" : "guide_invitation_declined", {});
    return { status: r[0].status as string };
  });
}

export async function revokeGuide(actor: Actor, serviceProviderId: string, guideId: string): Promise<{ revokedAssignments: number }> {
  requireUuid(serviceProviderId, "provider_not_found");
  requireUuid(guideId, "guide_not_found");
  await requireProviderRole(actor, serviceProviderId, "manager");
  return db.begin(async (tx) => {
    const r = await tx`update tour.provider_guides set status = 'revoked', updated_at = now()
                        where service_provider_id = ${serviceProviderId}::uuid and guide_id = ${guideId}::uuid and status <> 'revoked' returning guide_id`;
    if (r.length === 0) throw fail.notFound("guide_not_found");
    // Future assignments with this provider end with the relationship.
    const a = await tx`
      update tour.departure_assignments a set status = 'revoked'
        from tour.departures d
       where a.departure_id = d.id and d.service_provider_id = ${serviceProviderId}::uuid and a.guide_id = ${guideId}::uuid
         and a.status in ('assigned','accepted') and d.starts_at > now()
      returning a.id`;
    await auditOps(tx as unknown as Tx, actor, scopeFor(actor, serviceProviderId), serviceProviderId, "guide", guideId, "guide_revoked", { assignments: a.length });
    return { revokedAssignments: a.length };
  });
}

export async function listProviderGuides(actor: Actor, serviceProviderId: string) {
  requireUuid(serviceProviderId, "provider_not_found");
  await requireProviderRole(actor, serviceProviderId, "staff");
  const rows = await db<any[]>`
    select g.id::text, g.display_name, g.photo_url, g.languages, g.status as guide_status, g.contact_policy, pg.status, pg.publish_bio, pg.created_at,
           (select count(*)::int from tour.departure_assignments a join tour.departures d on d.id = a.departure_id
             where a.guide_id = g.id and d.service_provider_id = pg.service_provider_id and a.status in ('assigned','accepted') and d.starts_at > now()) as upcoming,
           (select count(*)::int from tour.content c where c.entity_type = 'guide' and c.entity_id = g.id and c.status = 'submitted') as bios_pending
      from tour.provider_guides pg join tour.guides g on g.id = pg.guide_id
     where pg.service_provider_id = ${serviceProviderId}::uuid
     order by pg.status, g.display_name`;
  return rows.map((r) => ({
    guideId: r.id, displayName: r.display_name, photoUrl: r.photo_url, languages: r.languages ?? [], guideStatus: r.guide_status,
    contactPolicy: r.contact_policy, status: r.status, publishBio: r.publish_bio, since: iso(r.created_at), upcomingAssignments: r.upcoming,
    biosPendingReview: r.bios_pending,
  }));
}

export type AssignmentInput = { departureId: string; guideId?: string | null; resourceId?: string | null; role: "lead_guide" | "guide" | "driver" | "vehicle" | "equipment"; overrideReason?: string | null };

export async function assignToDeparture(actor: Actor, input: AssignmentInput): Promise<{ id: string }> {
  const access = await authorizeDeparture(actor, input.departureId, { minimum: "manager" });
  const { dep } = access;
  if (!["lead_guide", "guide", "driver", "vehicle", "equipment"].includes(input.role)) throw fail.validation("invalid_role");
  if (Boolean(input.guideId) === Boolean(input.resourceId)) throw fail.validation("guide_or_resource_required");
  if (input.guideId) requireUuid(input.guideId, "guide_not_found");
  if (input.resourceId) requireUuid(input.resourceId, "resource_not_found");
  if (input.guideId && !["lead_guide", "guide", "driver"].includes(input.role)) throw fail.validation("invalid_role");
  if (input.resourceId && !["vehicle", "equipment", "driver"].includes(input.role)) throw fail.validation("invalid_role");
  const override = input.overrideReason == null ? null : String(input.overrideReason).trim().slice(0, 500) || null;
  if (override && !actor.isAdmin) throw fail.forbidden("override_requires_admin");
  if (["cancelled", "completed"].includes(dep.status)) throw fail.conflict("departure_not_operating");

  let previousLead: string | null = null;
  let id: string;
  try {
    id = await db.begin(async (tx) => {
      const q = tx as unknown as Tx;
      if (input.guideId) {
        const [ok] = await q<any[]>`
          select g.status from tour.provider_guides pg join tour.guides g on g.id = pg.guide_id
           where pg.service_provider_id = ${dep.serviceProviderId}::uuid and pg.guide_id = ${input.guideId}::uuid and pg.status = 'active'`;
        if (!ok) throw fail.validation("guide_not_with_provider");
        if (ok.status === "suspended") throw fail.conflict("guide_suspended");
      } else {
        const [ok] = await q`select 1 from tour.resources where id = ${input.resourceId!}::uuid and service_provider_id = ${dep.serviceProviderId}::uuid and is_active`;
        if (!ok) throw fail.validation("resource_not_with_provider");
      }
      await q`select 1 from tour.departures where id = ${dep.id}::uuid for update`;
      if (input.role === "lead_guide") {
        const prev = await q<any[]>`
          update tour.departure_assignments set status = 'revoked'
           where departure_id = ${dep.id}::uuid and role = 'lead_guide' and status in ('assigned','accepted')
             and guide_id is distinct from ${input.guideId ?? null}::uuid
          returning guide_id::text`;
        previousLead = prev[0]?.guide_id ?? null;
      }
      const [a] = await q<any[]>`
        insert into tour.departure_assignments (departure_id, guide_id, resource_id, role, during, override_reason, assigned_by)
        select d.id, ${input.guideId ?? null}::uuid, ${input.resourceId ?? null}::uuid, ${input.role},
               tstzrange(d.starts_at, coalesce(d.ends_at, d.starts_at + interval '4 hours') + make_interval(mins => d.delay_minutes), '[)'),
               ${override}, ${actor.userId}::uuid
          from tour.departures d where d.id = ${dep.id}::uuid
        returning id::text`;
      await auditOps(q, actor, access.scope, dep.serviceProviderId, "assignment", a.id, "assignment_created",
        { departureId: dep.id, guideId: input.guideId ?? null, resourceId: input.resourceId ?? null, role: input.role, overrideReason: override, replacedLead: previousLead });
      return a.id as string;
    });
  } catch (e) {
    throw mapDbError(e, "assignToDeparture");
  }

  if (input.guideId) {
    const [gu] = await db<any[]>`select user_id::text from tour.guides where id = ${input.guideId}::uuid`;
    if (gu) await notifyUser({ userId: gu.user_id, type: "system", title: "New tour assignment", body: "You were assigned to a tour departure.", entityType: "tour_departure", entityId: dep.id, data: { kind: "guide_assignment", assignmentId: id } });
  }
  // V-053: travelers are told when the lead guide changes on a departure they booked.
  if (input.role === "lead_guide" && previousLead) {
    const [hasBookings] = await db`select 1 from tour.bookings where departure_id = ${dep.id}::uuid and status in ('confirmed','pending_payment','requested') limit 1`;
    if (hasBookings) {
      const nid = await db.begin(async (tx) => {
        const n = await insertNotice(tx as unknown as Tx, actor.userId!, {
          departureId: dep.id, kind: "guide_change", effectiveAt: new Date().toISOString(), sourceLocale: "en-US",
          texts: SYSTEM_NOTICE_TEXTS.guide_change, payload: { assignmentId: id },
        });
        await auditOps(tx as unknown as Tx, actor, access.scope, dep.serviceProviderId, "notice", n, "guide_change_notice", { departureId: dep.id });
        return n;
      });
      await deliverNotice(nid);
    }
  }
  return { id };
}

export async function revokeAssignment(actor: Actor, assignmentId: string): Promise<void> {
  requireUuid(assignmentId, "assignment_not_found");
  const [a] = await db<any[]>`select departure_id::text from tour.departure_assignments where id = ${assignmentId}::uuid`;
  if (!a) throw fail.notFound("assignment_not_found");
  const access = await authorizeDeparture(actor, a.departure_id, { minimum: "manager" });
  await db.begin(async (tx) => {
    const r = await tx`update tour.departure_assignments set status = 'revoked' where id = ${assignmentId}::uuid and status in ('assigned','accepted') returning id`;
    if (r.length === 0) throw fail.conflict("assignment_not_active");
    await auditOps(tx as unknown as Tx, actor, access.scope, access.dep.serviceProviderId, "assignment", assignmentId, "assignment_revoked", {});
  });
}

/** The assigned guide accepts or declines an assignment (V-051). */
export async function respondToAssignment(actor: Actor, assignmentId: string, decision: "accepted" | "declined"): Promise<void> {
  if (!actor.userId) throw fail.auth();
  requireUuid(assignmentId, "assignment_not_found");
  if (!["accepted", "declined"].includes(decision)) throw fail.validation("invalid_decision");
  await db.begin(async (tx) => {
    const r = await tx<any[]>`
      update tour.departure_assignments a set status = ${decision}
        from tour.guides g
       where a.id = ${assignmentId}::uuid and g.id = a.guide_id and g.user_id = ${actor.userId}::uuid and a.status in ('assigned','accepted')
      returning a.departure_id::text`;
    if (r.length === 0) throw fail.notFound("assignment_not_found");
    await auditOps(tx as unknown as Tx, actor, "guide", null, "assignment", assignmentId, `assignment_${decision}`, { departureId: r[0].departure_id });
  });
}

export async function guideSchedule(actor: Actor, range: { from?: string | null; to?: string | null } = {}) {
  if (!actor.userId) throw fail.auth();
  if (range.from && !isIsoDate(range.from)) throw fail.validation("invalid_date");
  if (range.to && !isIsoDate(range.to)) throw fail.validation("invalid_date");
  const g = await guideByUser(actor.userId);
  if (!g) return [];
  const rows = await db<any[]>`
    select a.id::text as assignment_id, a.role, a.status as assignment_status, d.id::text as departure_id, d.tour_id::text, d.starts_at, d.ends_at,
           d.timezone, d.status, d.delay_minutes, d.booked_count, d.capacity, d.service_provider_id::text, sp.name_translations,
           (select coalesce(c.published_value, c.draft_value) from tour.content c join tour.tours t on t.id = d.tour_id
             where c.entity_type = 'tour' and c.entity_id = t.id and c.field_key = 'title' and c.locale = t.source_locale) as title
      from tour.departure_assignments a
      join tour.departures d on d.id = a.departure_id
      join category.service_providers sp on sp.id = d.service_provider_id
     where a.guide_id = ${g.id}::uuid and a.status in ('assigned','accepted')
       and (${range.from ?? null}::date is null or d.starts_on >= ${range.from ?? null}::date)
       and (${range.to ?? null}::date is null or d.starts_on <= ${range.to ?? null}::date)
       and (${range.from ?? null}::date is not null or d.starts_at > now() - interval '1 day')
     order by d.starts_at limit 300`;
  return rows.map((r) => ({
    assignmentId: r.assignment_id, role: r.role, assignmentStatus: r.assignment_status, departureId: r.departure_id, tourId: r.tour_id,
    tourTitle: r.title ?? null, startsAt: iso(r.starts_at)!, endsAt: iso(r.ends_at), timezone: r.timezone, status: r.status,
    delayMinutes: r.delay_minutes, booked: r.booked_count, capacity: r.capacity, serviceProviderId: r.service_provider_id,
    providerName: r.name_translations ?? {},
  }));
}
