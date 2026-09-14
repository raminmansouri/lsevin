import "server-only";

import db from "@/config/database/db";

import type {
  GatheringParticipantStatus,
  TourDeparture,
  TourDepartureAdminRow,
  TourDeparturesAdminPageData,
  TourGatheringCampaign,
  TourGatheringCampaignsAdminPageData,
  TourGatheringParticipant,
  TourGatheringParticipantAdminRow,
} from "../types";

type Locale = string;

export async function tourDeparturesSchemaExists(): Promise<boolean> {
  const rows = await db<{ exists: boolean }[]>`
    select to_regclass('tour.departures') is not null as "exists"
  `;
  return Boolean(rows[0]?.exists);
}

function toDateOnly(value: unknown): string {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value ?? "").slice(0, 10);
}

function mapAdminRow(row: any): TourDepartureAdminRow {
  return {
    id: row.id,
    providerServiceId: row.provider_service_id,
    serviceProviderId: row.service_provider_id,
    providerName: row.provider_name || "",
    serviceName: row.service_name || "",
    currency: row.currency,
    price: Number(row.value ?? 0),
    startsOn: toDateOnly(row.starts_on),
    endsOn: toDateOnly(row.ends_on),
    capacity: row.capacity,
    bookedCount: row.booked_count,
    remainingCapacity: Math.max(0, row.capacity - row.booked_count),
    isActive: row.is_active,
    createdAt: row.create_date,
    updatedAt: row.last_modified_date,
  };
}

export async function listDeparturesForAdmin(locale: Locale): Promise<TourDepartureAdminRow[]> {
  const rows = await db<any[]>`
    select d.id, d.provider_service_id, d.service_provider_id, d.starts_on, d.ends_on, d.capacity, d.booked_count,
           d.is_active, d.create_date, d.last_modified_date,
           ps.currency, ps.value,
           common.get_translation_t(ps.display_name_translations, ${locale}, 'fa-IR') as service_name,
           common.get_translation_t(sp.name_translations, ${locale}, 'fa-IR') as provider_name
    from tour.departures d
    join category.provider_services ps on ps.id = d.provider_service_id
    join category.service_providers sp on sp.id = d.service_provider_id
    order by d.starts_on asc
  `;
  return rows.map(mapAdminRow);
}

export async function getTourDeparturesAdminPageData(locale: Locale): Promise<TourDeparturesAdminPageData> {
  if (!(await tourDeparturesSchemaExists())) {
    return { departures: [], schemaMissing: true };
  }
  const departures = await listDeparturesForAdmin(locale);
  return { departures, schemaMissing: false };
}

/**
 * service_provider_id is derived from the chosen provider_service (not taken from the
 * caller) -- the admin only ever picks a tour listing, never a provider directly, so
 * trusting a client-supplied provider id here would let the two silently disagree.
 */
export async function upsertTourDeparture(input: {
  id?: string;
  providerServiceId: string;
  startsOn: string;
  endsOn: string;
  capacity: number;
  isActive: boolean;
}): Promise<{ id: string }> {
  if (input.id) {
    const rows = await db<{ id: string }[]>`
      update tour.departures
      set provider_service_id = ${input.providerServiceId},
          service_provider_id = (select service_provider_id from category.provider_services where id = ${input.providerServiceId}),
          starts_on = ${input.startsOn},
          ends_on = ${input.endsOn},
          capacity = ${input.capacity},
          is_active = ${input.isActive},
          last_modified_date = now()
      where id = ${input.id} and booked_count <= ${input.capacity}
      returning id
    `;
    if (!rows[0]) throw new Error("DEPARTURE_NOT_FOUND_OR_CAPACITY_BELOW_BOOKED");
    return rows[0];
  }

  const rows = await db<{ id: string }[]>`
    insert into tour.departures (provider_service_id, service_provider_id, starts_on, ends_on, capacity, is_active)
    select ${input.providerServiceId}, ps.service_provider_id, ${input.startsOn}, ${input.endsOn}, ${input.capacity}, ${input.isActive}
    from category.provider_services ps
    where ps.id = ${input.providerServiceId}
    returning id
  `;
  if (!rows[0]) throw new Error("PROVIDER_SERVICE_NOT_FOUND");
  return rows[0];
}

export async function deleteTourDeparture(id: string): Promise<boolean> {
  const rows = await db<{ id: string }[]>`
    delete from tour.departures where id = ${id} and booked_count = 0 returning id
  `;
  return rows.length > 0;
}

/** Customer-facing: the departures a customer can actually pick for a given tour
 * listing -- active, not yet started, and (shown, not hidden) even when full so the
 * customer understands why it's disabled rather than it silently disappearing. */
export async function listOpenDeparturesForService(providerServiceId: string): Promise<TourDeparture[]> {
  try {
    const rows = await db<any[]>`
      select id, provider_service_id, starts_on, ends_on, capacity, booked_count, is_active
      from tour.departures
      where provider_service_id = ${providerServiceId} and is_active = true and starts_on >= current_date
      order by starts_on asc
    `;
    return rows.map((row) => ({
      id: row.id,
      providerServiceId: row.provider_service_id,
      startsOn: toDateOnly(row.starts_on),
      endsOn: toDateOnly(row.ends_on),
      capacity: row.capacity,
      bookedCount: row.booked_count,
      remainingCapacity: Math.max(0, row.capacity - row.booked_count),
      isActive: row.is_active,
    }));
  } catch {
    // Migration 0042 hasn't run yet -- no departures rather than a crash.
    return [];
  }
}

/** Batch version for booking-pro's listServices(): does this service have any open
 * departures at all (so the storefront can show "fixed departures" vs. treat it as
 * an ordinary service)? Mirrors listTransferRouteSummaries()'s try/catch guard. */
export async function listServicesWithOpenDepartures(providerServiceIds: string[]): Promise<Set<string>> {
  const result = new Set<string>();
  if (providerServiceIds.length === 0) return result;
  try {
    const rows = await db<{ provider_service_id: string }[]>`
      select distinct provider_service_id
      from tour.departures
      where provider_service_id = any(${providerServiceIds}) and is_active = true and starts_on >= current_date
    `;
    for (const row of rows) result.add(row.provider_service_id);
  } catch {
    // Migration 0042 hasn't run yet.
  }
  return result;
}

/** The overbooking guard, run inside the same transaction as the booking insert --
 * mirrors reserveHotelDates()'s shape, but against a numeric capacity rather than an
 * exclusive per-night reservation (a tour departure is shared by many bookings, a
 * hotel night is not). Throws DEPARTURE_FULL if the conditional UPDATE affects no
 * row, i.e. someone else filled the last spot in the same instant. */
export async function reserveTourDeparture(tx: typeof db, departureId: string): Promise<void> {
  const rows = await tx<{ id: string }[]>`
    update tour.departures
    set booked_count = booked_count + 1, last_modified_date = now()
    where id = ${departureId} and is_active = true and booked_count < capacity
    returning id
  `;
  if (!rows[0]) throw new Error("DEPARTURE_FULL");
}

export async function releaseTourDeparture(departureId: string): Promise<void> {
  await db`
    update tour.departures
    set booked_count = greatest(0, booked_count - 1), last_modified_date = now()
    where id = ${departureId}
  `;
}

// ---------------------------------------------------------------------------
// Subscription-gathering campaigns (0043) -- see that migration's own comment
// for why this is a separate, self-contained mechanism rather than another
// extension of booking-pro's checkout.
// ---------------------------------------------------------------------------

export async function tourGatheringSchemaExists(): Promise<boolean> {
  const rows = await db<{ exists: boolean }[]>`
    select to_regclass('tour.gathering_campaigns') is not null as "exists"
  `;
  return Boolean(rows[0]?.exists);
}

function mapCampaignRow(row: any): TourGatheringCampaign {
  return {
    id: row.id,
    serviceProviderId: row.service_provider_id,
    providerServiceId: row.provider_service_id,
    providerName: row.provider_name || "",
    serviceName: row.service_name || "",
    targetHeadcount: row.target_headcount,
    approvedCount: Number(row.approved_count ?? 0),
    pendingCount: Number(row.pending_count ?? 0),
    pricePerPerson: Number(row.price_per_person ?? 0),
    currency: row.currency,
    joinDeadline: row.join_deadline ? toDateOnly(row.join_deadline) : null,
    status: row.status,
    confirmedStartsOn: row.confirmed_starts_on ? toDateOnly(row.confirmed_starts_on) : null,
    confirmedEndsOn: row.confirmed_ends_on ? toDateOnly(row.confirmed_ends_on) : null,
    createdAt: row.create_date,
  };
}

export async function listGatheringCampaignsForAdmin(locale: Locale): Promise<TourGatheringCampaign[]> {
  const rows = await db<any[]>`
    select c.id, c.service_provider_id, c.provider_service_id, c.target_headcount, c.price_per_person,
           c.currency, c.join_deadline, c.status, c.confirmed_starts_on, c.confirmed_ends_on, c.create_date,
           common.get_translation_t(ps.display_name_translations, ${locale}, 'fa-IR') as service_name,
           common.get_translation_t(sp.name_translations, ${locale}, 'fa-IR') as provider_name,
           coalesce((select count(*) from tour.gathering_participants p where p.campaign_id = c.id and p.status = 'approved'), 0) as approved_count,
           coalesce((select count(*) from tour.gathering_participants p where p.campaign_id = c.id and p.status = 'pending_review'), 0) as pending_count
    from tour.gathering_campaigns c
    join category.provider_services ps on ps.id = c.provider_service_id
    join category.service_providers sp on sp.id = c.service_provider_id
    order by c.create_date desc
  `;
  return rows.map(mapCampaignRow);
}

export async function getGatheringCampaign(id: string, locale: Locale): Promise<TourGatheringCampaign | null> {
  const rows = await db<any[]>`
    select c.id, c.service_provider_id, c.provider_service_id, c.target_headcount, c.price_per_person,
           c.currency, c.join_deadline, c.status, c.confirmed_starts_on, c.confirmed_ends_on, c.create_date,
           common.get_translation_t(ps.display_name_translations, ${locale}, 'fa-IR') as service_name,
           common.get_translation_t(sp.name_translations, ${locale}, 'fa-IR') as provider_name,
           coalesce((select count(*) from tour.gathering_participants p where p.campaign_id = c.id and p.status = 'approved'), 0) as approved_count,
           coalesce((select count(*) from tour.gathering_participants p where p.campaign_id = c.id and p.status = 'pending_review'), 0) as pending_count
    from tour.gathering_campaigns c
    join category.provider_services ps on ps.id = c.provider_service_id
    join category.service_providers sp on sp.id = c.service_provider_id
    where c.id = ${id}
  `;
  return rows[0] ? mapCampaignRow(rows[0]) : null;
}

/** Public, no session required -- an open campaign a customer could join for a given
 * tour listing. Only ever one active ("gathering") campaign is expected per listing,
 * so the first is returned; try/catch-guarded like every other tours lookup here. */
export async function getOpenGatheringCampaignForService(providerServiceId: string): Promise<TourGatheringCampaign | null> {
  try {
    const rows = await db<any[]>`
      select c.id, c.service_provider_id, c.provider_service_id, c.target_headcount, c.price_per_person,
             c.currency, c.join_deadline, c.status, c.confirmed_starts_on, c.confirmed_ends_on, c.create_date,
             '' as service_name, '' as provider_name,
             coalesce((select count(*) from tour.gathering_participants p where p.campaign_id = c.id and p.status = 'approved'), 0) as approved_count,
             coalesce((select count(*) from tour.gathering_participants p where p.campaign_id = c.id and p.status = 'pending_review'), 0) as pending_count
      from tour.gathering_campaigns c
      where c.provider_service_id = ${providerServiceId} and c.status = 'gathering'
      order by c.create_date desc
      limit 1
    `;
    return rows[0] ? mapCampaignRow(rows[0]) : null;
  } catch {
    return null;
  }
}

export async function createGatheringCampaign(input: {
  providerServiceId: string;
  targetHeadcount: number;
  pricePerPerson: number;
  currency: string;
  joinDeadline?: string;
}): Promise<{ id: string }> {
  const rows = await db<{ id: string }[]>`
    insert into tour.gathering_campaigns (
      provider_service_id, service_provider_id, target_headcount, price_per_person, currency, join_deadline
    )
    select ${input.providerServiceId}, ps.service_provider_id, ${input.targetHeadcount}, ${input.pricePerPerson},
           ${input.currency}, ${input.joinDeadline ?? null}
    from category.provider_services ps
    where ps.id = ${input.providerServiceId}
    returning id
  `;
  if (!rows[0]) throw new Error("PROVIDER_SERVICE_NOT_FOUND");
  return rows[0];
}

export async function confirmGatheringCampaign(input: {
  id: string;
  confirmedStartsOn: string;
  confirmedEndsOn: string;
}): Promise<boolean> {
  const rows = await db<{ id: string }[]>`
    update tour.gathering_campaigns
    set status = 'confirmed', confirmed_starts_on = ${input.confirmedStartsOn}, confirmed_ends_on = ${input.confirmedEndsOn},
        last_modified_date = now()
    where id = ${input.id} and status = 'gathering'
    returning id
  `;
  return rows.length > 0;
}

export async function cancelGatheringCampaign(id: string): Promise<boolean> {
  const rows = await db<{ id: string }[]>`
    update tour.gathering_campaigns
    set status = 'cancelled', last_modified_date = now()
    where id = ${id} and status = 'gathering'
    returning id
  `;
  return rows.length > 0;
}

function mapParticipantRow(row: any): TourGatheringParticipant {
  return {
    id: row.id,
    campaignId: row.campaign_id,
    status: row.status,
    amount: Number(row.amount ?? 0),
    currency: row.currency,
    paymentReference: row.payment_reference,
    reviewNote: row.review_note,
    reviewedAt: row.reviewed_at,
    createdAt: row.create_date,
  };
}

/** Joining is idempotent per (campaign, user): a fresh join creates a pending row; a
 * previously-rejected join resets back to pending_review on resubmission (same
 * "second chance" logic gym-memberships' submitMembershipMonths uses), rather than
 * erroring on the unique constraint. An already pending/approved join is left alone. */
export async function joinGatheringCampaign(
  userId: string,
  campaignId: string,
  paymentReference?: string
): Promise<{ participantId: string; alreadyJoined: boolean }> {
  const [campaign] = await db<{ id: string; price_per_person: string; currency: string; status: string }[]>`
    select id, price_per_person, currency, status from tour.gathering_campaigns where id = ${campaignId}
  `;
  if (!campaign) throw new Error("CAMPAIGN_NOT_FOUND");
  if (campaign.status !== "gathering") throw new Error("CAMPAIGN_NOT_OPEN");

  const [existing] = await db<{ id: string; status: string }[]>`
    select id, status from tour.gathering_participants where campaign_id = ${campaignId} and user_id = ${userId}
  `;

  if (existing) {
    if (existing.status === "rejected") {
      await db`
        update tour.gathering_participants
        set status = 'pending_review', payment_reference = ${paymentReference ?? null}, review_note = null,
            reviewed_by = null, reviewed_at = null, last_modified_date = now()
        where id = ${existing.id}
      `;
      return { participantId: existing.id, alreadyJoined: false };
    }
    return { participantId: existing.id, alreadyJoined: true };
  }

  const rows = await db<{ id: string }[]>`
    insert into tour.gathering_participants (campaign_id, user_id, amount, currency, payment_reference)
    values (${campaignId}, ${userId}, ${campaign.price_per_person}, ${campaign.currency}, ${paymentReference ?? null})
    returning id
  `;
  return { participantId: rows[0].id, alreadyJoined: false };
}

export async function listMyGatheringParticipations(userId: string, locale: Locale): Promise<
  Array<TourGatheringParticipant & { providerName: string; serviceName: string; campaignStatus: TourGatheringCampaign["status"] }>
> {
  try {
    const rows = await db<any[]>`
      select p.id, p.campaign_id, p.status, p.amount, p.currency, p.payment_reference, p.review_note, p.reviewed_at, p.create_date,
             c.status as campaign_status,
             common.get_translation_t(ps.display_name_translations, ${locale}, 'fa-IR') as service_name,
             common.get_translation_t(sp.name_translations, ${locale}, 'fa-IR') as provider_name
      from tour.gathering_participants p
      join tour.gathering_campaigns c on c.id = p.campaign_id
      join category.provider_services ps on ps.id = c.provider_service_id
      join category.service_providers sp on sp.id = c.service_provider_id
      where p.user_id = ${userId}
      order by p.create_date desc
    `;
    return rows.map((row) => ({ ...mapParticipantRow(row), providerName: row.provider_name || "", serviceName: row.service_name || "", campaignStatus: row.campaign_status }));
  } catch {
    return [];
  }
}

export async function listParticipantsForAdmin(locale: Locale): Promise<TourGatheringParticipantAdminRow[]> {
  const rows = await db<any[]>`
    select p.id, p.campaign_id, p.status, p.amount, p.currency, p.payment_reference, p.review_note, p.reviewed_at, p.create_date,
           p.user_id, c.target_headcount,
           common.get_translation_t(ps.display_name_translations, ${locale}, 'fa-IR') as service_name,
           common.get_translation_t(sp.name_translations, ${locale}, 'fa-IR') as provider_name,
           coalesce((select count(*) from tour.gathering_participants p2 where p2.campaign_id = c.id and p2.status = 'approved'), 0) as approved_count
    from tour.gathering_participants p
    join tour.gathering_campaigns c on c.id = p.campaign_id
    join category.provider_services ps on ps.id = c.provider_service_id
    join category.service_providers sp on sp.id = c.service_provider_id
    order by (p.status = 'pending_review') desc, p.create_date desc
  `;
  return rows.map((row) => ({
    ...mapParticipantRow(row),
    userId: row.user_id,
    providerName: row.provider_name || "",
    serviceName: row.service_name || "",
    targetHeadcount: row.target_headcount,
    approvedCount: Number(row.approved_count ?? 0),
  }));
}

/** Mirrors gym-memberships' reviewMembershipMonth exactly: a mandatory note to
 * reject, an optional one to approve. */
export async function reviewGatheringParticipant(input: {
  id: string;
  decision: GatheringParticipantStatus;
  note?: string;
  actorUserId: string | null;
}): Promise<boolean> {
  if (input.decision === "rejected" && !input.note?.trim()) {
    throw new Error("A reason is required to reject a participant.");
  }

  const rows = await db<{ id: string }[]>`
    update tour.gathering_participants
    set status = ${input.decision}, review_note = ${input.note ?? null}, reviewed_by = ${input.actorUserId},
        reviewed_at = now(), last_modified_date = now()
    where id = ${input.id} and status = 'pending_review'
    returning id
  `;
  return rows.length > 0;
}

/** Public, no session required: every currently-open campaign a customer could
 * browse and join, across all tours. Try/catch-guarded like every other tours
 * lookup for an unapplied migration. */
export async function listOpenGatheringCampaigns(locale: Locale): Promise<TourGatheringCampaign[]> {
  try {
    const rows = await db<any[]>`
      select c.id, c.service_provider_id, c.provider_service_id, c.target_headcount, c.price_per_person,
             c.currency, c.join_deadline, c.status, c.confirmed_starts_on, c.confirmed_ends_on, c.create_date,
             common.get_translation_t(ps.display_name_translations, ${locale}, 'fa-IR') as service_name,
             common.get_translation_t(sp.name_translations, ${locale}, 'fa-IR') as provider_name,
             coalesce((select count(*) from tour.gathering_participants p where p.campaign_id = c.id and p.status = 'approved'), 0) as approved_count,
             coalesce((select count(*) from tour.gathering_participants p where p.campaign_id = c.id and p.status = 'pending_review'), 0) as pending_count
      from tour.gathering_campaigns c
      join category.provider_services ps on ps.id = c.provider_service_id
      join category.service_providers sp on sp.id = c.service_provider_id
      where c.status = 'gathering'
      order by c.create_date desc
    `;
    return rows.map(mapCampaignRow);
  } catch {
    return [];
  }
}

export async function getTourGatheringAdminPageData(locale: Locale): Promise<TourGatheringCampaignsAdminPageData> {
  if (!(await tourGatheringSchemaExists())) {
    return { campaigns: [], participants: [], schemaMissing: true };
  }
  const [campaigns, participants] = await Promise.all([
    listGatheringCampaignsForAdmin(locale),
    listParticipantsForAdmin(locale),
  ]);
  return { campaigns, participants, schemaMissing: false };
}
