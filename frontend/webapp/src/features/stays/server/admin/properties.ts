import "server-only";

import db from "@/config/database/db";
import type { Actor } from "@/features/tours/server/platform/access";

import { normalizeRules } from "../../domain/cancellation";
import type { PropertyKind } from "../../domain/search";
import { audit } from "../booking";
import { pickStr } from "../catalog";
import { fail } from "../errors";

/**
 * Admin catalog management (A02, A03, A05, A06). Every write is audited with
 * the acting admin. Rows that bookings reference are never hard-deleted:
 * properties are archived, room types and rate plans are deactivated.
 */

type Tx = typeof db;
export type Translations = Record<string, string>;

export type PropertyInput = {
  serviceProviderId: string;
  cityId: string;
  slug: string;
  kind: PropertyKind;
  inventoryModel: "rooms" | "entire_place";
  starRating: number | null;
  name: Translations;
  summary: Translations;
  description: Translations;
  houseRules: Translations;
  address: Translations;
  latitude: number | null;
  longitude: number | null;
  locationPrivacy: "exact" | "approximate";
  checkInTime: string;
  checkOutTime: string;
  amenityCodes: string[];
  nearby: { kind: string; name: Translations; distanceM: number }[];
  stepFreeAccess: boolean;
  accessibleBathroom: boolean;
  medicalFriendly: boolean;
  petsAllowed: boolean;
  smokingAllowed: boolean;
  partiesAllowed: boolean;
  familiesOnly: boolean;
  idRequired: boolean;
  childFreeUnderAge: number;
  confirmationMode: "instant" | "request";
  requestTimeoutHours: number;
  currencyCode: string;
  taxPercent: number;
  timezone: string;
  contactPhone: string | null;
  isFeatured: boolean;
};

export type AdminPropertyRow = {
  id: string;
  slug: string;
  name: string;
  kind: string;
  status: string;
  city: string;
  provider: string;
  rooms: number;
  plans: number;
  photos: number;
  fromPrice: number | null;
  currency: string;
  upcomingBookings: number;
  updatedAt: string;
};

export async function listPropertiesAdmin(filters: { q?: string | null; status?: string | null; cityId?: string | null }, locale: string): Promise<AdminPropertyRow[]> {
  const q = filters.q?.trim() ? `%${filters.q.trim().toLowerCase().replace(/[%_\\]/g, (m) => `\\${m}`)}%` : null;
  const rows = await db<any[]>`
    select p.id::text, p.slug, p.name, p.kind, p.status, c.name as city, sp.name_translations as provider, p.from_price, p.currency_code, p.updated_at,
           (select count(*)::int from stay.room_types rt where rt.property_id = p.id and rt.is_active) as rooms,
           (select count(*)::int from stay.rate_plans rp where rp.property_id = p.id and rp.is_active) as plans,
           (select count(*)::int from stay.media m where m.property_id = p.id) as photos,
           (select count(*)::int from stay.bookings b where b.property_id = p.id and b.status in ('pending_payment','requested','confirmed') and b.check_out >= current_date) as upcoming
      from stay.properties p
      join stay.cities c on c.id = p.city_id
      left join category.service_providers sp on sp.id = p.service_provider_id
     where (${filters.status ?? null}::text is null or p.status = ${filters.status ?? null})
       and (${filters.cityId ?? null}::uuid is null or p.city_id = ${filters.cityId ?? null}::uuid)
       and (${q}::text is null or p.search_text like ${q} or p.slug like ${q})
     order by p.updated_at desc
     limit 500`;
  return rows.map((r) => ({
    id: r.id,
    slug: r.slug,
    name: pickStr(r.name, locale),
    kind: r.kind,
    status: r.status,
    city: pickStr(r.city, locale),
    provider: pickStr(r.provider, locale),
    rooms: r.rooms,
    plans: r.plans,
    photos: r.photos,
    fromPrice: r.from_price == null ? null : Number(r.from_price),
    currency: r.currency_code,
    upcomingBookings: r.upcoming,
    updatedAt: new Date(r.updated_at).toISOString(),
  }));
}

/** Everything the editor needs, with raw translation maps (not resolved to one language). */
export async function getPropertyAdmin(id: string) {
  const [p] = await db<any[]>`
    select p.*, p.id::text as id, p.service_provider_id::text as service_provider_id, p.city_id::text as city_id,
           p.check_in_time::text as cin, p.check_out_time::text as cout, p.current_policy_id::text as current_policy_id,
           sp.name_translations as provider_name
      from stay.properties p left join category.service_providers sp on sp.id = p.service_provider_id
     where p.id = ${id}::uuid`;
  if (!p) throw fail.notFound("property_not_found");
  const [rooms, plans, media, policies] = await Promise.all([
    db<any[]>`select id::text, code, name, description, units, base_occupancy, max_adults, max_children, max_occupancy, extra_beds, bed_config,
                     size_m2, bedrooms, bathrooms, amenity_codes, sort_order, is_active
                from stay.room_types where property_id = ${id}::uuid order by sort_order, created_at`,
    db<any[]>`select id::text, room_type_id::text, code, name, meal_plan, refundable, base_price, extra_adult_price, child_price, min_nights, max_nights,
                     long_stay_nights, long_stay_percent, sort_order, is_active
                from stay.rate_plans where property_id = ${id}::uuid order by sort_order, created_at`,
    db<any[]>`select id::text, room_type_id::text, url, alt, credit, sort_order, is_cover from stay.media where property_id = ${id}::uuid order by is_cover desc, sort_order, created_at`,
    db<any[]>`select id::text, version, rules, no_show_refund_percent, texts, created_at from stay.policies where property_id = ${id}::uuid order by version desc`,
  ]);
  return {
    property: {
      id: p.id,
      serviceProviderId: p.service_provider_id,
      providerName: p.provider_name as Translations | null,
      cityId: p.city_id,
      slug: p.slug,
      status: p.status as string,
      kind: p.kind as PropertyKind,
      inventoryModel: p.inventory_model as "rooms" | "entire_place",
      starRating: p.star_rating as number | null,
      name: p.name as Translations,
      summary: p.summary as Translations,
      description: p.description as Translations,
      houseRules: p.house_rules as Translations,
      address: p.address as Translations,
      latitude: p.latitude == null ? null : Number(p.latitude),
      longitude: p.longitude == null ? null : Number(p.longitude),
      locationPrivacy: p.location_privacy as "exact" | "approximate",
      checkInTime: String(p.cin).slice(0, 5),
      checkOutTime: String(p.cout).slice(0, 5),
      amenityCodes: p.amenity_codes as string[],
      nearby: p.nearby as { kind: string; name: Translations; distanceM: number }[],
      stepFreeAccess: p.step_free_access as boolean,
      accessibleBathroom: p.accessible_bathroom as boolean,
      accessibilityVerifiedAt: p.accessibility_verified_at ? new Date(p.accessibility_verified_at).toISOString() : null,
      medicalFriendly: p.medical_friendly as boolean,
      petsAllowed: p.pets_allowed as boolean,
      smokingAllowed: p.smoking_allowed as boolean,
      partiesAllowed: p.parties_allowed as boolean,
      familiesOnly: p.families_only as boolean,
      idRequired: p.id_required as boolean,
      childFreeUnderAge: p.child_free_under_age as number,
      confirmationMode: p.confirmation_mode as "instant" | "request",
      requestTimeoutHours: p.request_timeout_hours as number,
      currencyCode: p.currency_code as string,
      taxPercent: Number(p.tax_percent),
      timezone: p.timezone as string,
      contactPhone: p.contact_phone as string | null,
      isFeatured: p.is_featured as boolean,
      currentPolicyId: p.current_policy_id as string | null,
      ratingAvg: p.rating_avg == null ? null : Number(p.rating_avg),
      reviewCount: p.review_count as number,
      updatedAt: new Date(p.updated_at).toISOString(),
    },
    rooms: rooms.map((r) => ({
      id: r.id,
      code: r.code,
      name: r.name as Translations,
      description: r.description as Translations,
      units: r.units,
      baseOccupancy: r.base_occupancy,
      maxAdults: r.max_adults,
      maxChildren: r.max_children,
      maxOccupancy: r.max_occupancy,
      extraBeds: r.extra_beds,
      beds: (r.bed_config ?? []) as { type: string; count: number }[],
      sizeM2: r.size_m2,
      bedrooms: r.bedrooms,
      bathrooms: r.bathrooms,
      amenityCodes: r.amenity_codes as string[],
      sortOrder: r.sort_order,
      isActive: r.is_active,
    })),
    plans: plans.map((r) => ({
      id: r.id,
      roomTypeId: r.room_type_id,
      code: r.code,
      name: r.name as Translations,
      mealPlan: r.meal_plan,
      refundable: r.refundable,
      basePrice: Number(r.base_price),
      extraAdultPrice: Number(r.extra_adult_price),
      childPrice: Number(r.child_price),
      minNights: r.min_nights,
      maxNights: r.max_nights,
      longStayNights: r.long_stay_nights,
      longStayPercent: r.long_stay_percent == null ? null : Number(r.long_stay_percent),
      sortOrder: r.sort_order,
      isActive: r.is_active,
    })),
    media: media.map((m) => ({ id: m.id, roomTypeId: m.room_type_id, url: m.url, alt: m.alt as Translations, credit: m.credit, sortOrder: m.sort_order, isCover: m.is_cover })),
    policies: policies.map((x) => ({
      id: x.id,
      version: x.version,
      rules: normalizeRules(x.rules),
      noShowRefundPercent: x.no_show_refund_percent,
      texts: x.texts as Translations,
      createdAt: new Date(x.created_at).toISOString(),
    })),
  };
}
export type PropertyAdminData = Awaited<ReturnType<typeof getPropertyAdmin>>;

function cleanTr(t: Translations | null | undefined): Translations {
  const out: Translations = {};
  for (const [k, v] of Object.entries(t ?? {})) {
    if (/^[a-z]{2,3}(-[A-Za-z]{2,4})?$/.test(k) && typeof v === "string" && v.trim()) out[k] = v.trim();
  }
  return out;
}

function validateProperty(input: PropertyInput) {
  const errors: Record<string, string> = {};
  if (!/^[a-z0-9][a-z0-9-]{0,100}$/.test(input.slug)) errors.slug = "invalid";
  if (Object.keys(cleanTr(input.name)).length === 0) errors.name = "required";
  if ((input.latitude == null) !== (input.longitude == null)) errors.latitude = "both_or_neither";
  if (input.latitude != null && (input.latitude < -90 || input.latitude > 90)) errors.latitude = "invalid";
  if (input.longitude != null && (input.longitude < -180 || input.longitude > 180)) errors.longitude = "invalid";
  if (!/^([01][0-9]|2[0-3]):[0-5][0-9]$/.test(input.checkInTime)) errors.checkInTime = "invalid";
  if (!/^([01][0-9]|2[0-3]):[0-5][0-9]$/.test(input.checkOutTime)) errors.checkOutTime = "invalid";
  if (input.starRating != null && (input.starRating < 1 || input.starRating > 5)) errors.starRating = "invalid";
  if (input.taxPercent < 0 || input.taxPercent > 50) errors.taxPercent = "invalid";
  if (input.contactPhone && !/^\+?[0-9 -]{5,20}$/.test(input.contactPhone)) errors.contactPhone = "invalid";
  if (Object.keys(errors).length) throw fail.validation("invalid_property", { fields: errors });
}

export async function createProperty(actor: Actor, input: PropertyInput): Promise<string> {
  validateProperty(input);
  return db.begin(async (tx) => {
    const [provider] = await tx<{ ok: boolean }[]>`select true as ok from category.service_providers where id = ${input.serviceProviderId}::uuid`;
    if (!provider) throw fail.validation("invalid_property", { fields: { serviceProviderId: "not_found" } });
    const [r] = await tx<{ id: string }[]>`
      insert into stay.properties (
        service_provider_id, city_id, slug, kind, inventory_model, star_rating, name, summary, description, house_rules, address,
        latitude, longitude, location_privacy, check_in_time, check_out_time, amenity_codes, nearby, step_free_access, accessible_bathroom,
        medical_friendly, pets_allowed, smoking_allowed, parties_allowed, families_only, id_required, child_free_under_age,
        confirmation_mode, request_timeout_hours, currency_code, tax_percent, timezone, contact_phone, is_featured, created_by
      ) values (
        ${input.serviceProviderId}::uuid, ${input.cityId}::uuid, ${input.slug}, ${input.kind}, ${input.inventoryModel}, ${input.starRating},
        ${db.json(cleanTr(input.name) as never)}, ${db.json(cleanTr(input.summary) as never)}, ${db.json(cleanTr(input.description) as never)},
        ${db.json(cleanTr(input.houseRules) as never)}, ${db.json(cleanTr(input.address) as never)},
        ${input.latitude}, ${input.longitude}, ${input.locationPrivacy}, ${input.checkInTime}::time, ${input.checkOutTime}::time,
        ${input.amenityCodes}::text[], ${db.json(input.nearby as never)}, ${input.stepFreeAccess}, ${input.accessibleBathroom},
        ${input.medicalFriendly}, ${input.petsAllowed}, ${input.smokingAllowed}, ${input.partiesAllowed}, ${input.familiesOnly}, ${input.idRequired},
        ${input.childFreeUnderAge}, ${input.confirmationMode}, ${input.requestTimeoutHours}, ${input.currencyCode}, ${input.taxPercent},
        ${input.timezone}, ${input.contactPhone}, ${input.isFeatured}, ${actor.userId}::uuid
      ) returning id::text`;
    // Every property starts with a sensible default policy (full refund until 72 h, half until 24 h).
    const [pol] = await tx<{ id: string }[]>`
      insert into stay.policies (property_id, version, rules, no_show_refund_percent, created_by)
      values (${r.id}::uuid, 1, ${db.json([{ hoursBefore: 72, refundPercent: 100 }, { hoursBefore: 24, refundPercent: 50 }] as never)}, 0, ${actor.userId}::uuid)
      returning id::text`;
    await tx`update stay.properties set current_policy_id = ${pol.id}::uuid where id = ${r.id}::uuid`;
    await tx`select stay.ensure_booking_anchor(${r.id}::uuid)`;
    await audit(tx as unknown as Tx, actor, r.id, "property", r.id, "created", { slug: input.slug });
    return r.id;
  });
}

export async function updateProperty(actor: Actor, id: string, input: PropertyInput, expectedUpdatedAt?: string | null): Promise<{ updatedAt: string }> {
  validateProperty(input);
  return db.begin(async (tx) => {
    const [cur] = await tx<any[]>`select slug, inventory_model, updated_at, currency_code from stay.properties where id = ${id}::uuid for update`;
    if (!cur) throw fail.notFound("property_not_found");
    // Optimistic concurrency: two admins editing the same property cannot silently overwrite each other.
    if (expectedUpdatedAt && new Date(cur.updated_at).toISOString() !== expectedUpdatedAt) throw fail.conflict("stale_edit");
    const [bookings] = await tx<{ n: number }[]>`select count(*)::int as n from stay.bookings where property_id = ${id}::uuid`;
    if (bookings.n > 0 && cur.currency_code !== input.currencyCode) throw fail.conflict("currency_locked");
    if (input.inventoryModel === "entire_place" && cur.inventory_model !== "entire_place") {
      const [rt] = await tx<{ n: number; big: number }[]>`
        select count(*)::int as n, count(*) filter (where units > 1)::int as big from stay.room_types where property_id = ${id}::uuid and is_active`;
      if (rt.n > 1 || rt.big > 0) throw fail.conflict("entire_place_needs_one_unit");
    }
    const [r] = await tx<{ updated_at: Date }[]>`
      update stay.properties set
        service_provider_id = ${input.serviceProviderId}::uuid, city_id = ${input.cityId}::uuid, slug = ${input.slug}, kind = ${input.kind},
        inventory_model = ${input.inventoryModel}, star_rating = ${input.starRating},
        name = ${db.json(cleanTr(input.name) as never)}, summary = ${db.json(cleanTr(input.summary) as never)},
        description = ${db.json(cleanTr(input.description) as never)}, house_rules = ${db.json(cleanTr(input.houseRules) as never)},
        address = ${db.json(cleanTr(input.address) as never)}, latitude = ${input.latitude}, longitude = ${input.longitude},
        location_privacy = ${input.locationPrivacy}, check_in_time = ${input.checkInTime}::time, check_out_time = ${input.checkOutTime}::time,
        amenity_codes = ${input.amenityCodes}::text[], nearby = ${db.json(input.nearby as never)},
        step_free_access = ${input.stepFreeAccess}, accessible_bathroom = ${input.accessibleBathroom},
        accessibility_verified_at = case when ${input.stepFreeAccess} or ${input.accessibleBathroom} then accessibility_verified_at else null end,
        medical_friendly = ${input.medicalFriendly}, pets_allowed = ${input.petsAllowed}, smoking_allowed = ${input.smokingAllowed},
        parties_allowed = ${input.partiesAllowed}, families_only = ${input.familiesOnly}, id_required = ${input.idRequired},
        child_free_under_age = ${input.childFreeUnderAge}, confirmation_mode = ${input.confirmationMode},
        request_timeout_hours = ${input.requestTimeoutHours}, currency_code = ${input.currencyCode}, tax_percent = ${input.taxPercent},
        timezone = ${input.timezone}, contact_phone = ${input.contactPhone}, is_featured = ${input.isFeatured}, updated_at = clock_timestamp()
      where id = ${id}::uuid
      returning updated_at`;
    await tx`select stay.ensure_booking_anchor(${id}::uuid)`;
    await audit(tx as unknown as Tx, actor, id, "property", id, "updated", { slugChanged: cur.slug !== input.slug });
    return { updatedAt: new Date(r.updated_at).toISOString() };
  });
}

export async function verifyAccessibility(actor: Actor, id: string) {
  await db.begin(async (tx) => {
    const r = await tx`update stay.properties set accessibility_verified_at = now(), updated_at = clock_timestamp() where id = ${id}::uuid returning id`;
    if (r.length === 0) throw fail.notFound("property_not_found");
    await audit(tx as unknown as Tx, actor, id, "property", id, "accessibility_verified", {});
  });
}

/** What blocks publishing; errors block, warnings do not. */
export async function publishRequirements(id: string): Promise<{ errors: string[]; warnings: string[] }> {
  const d = await getPropertyAdmin(id);
  const errors: string[] = [];
  const warnings: string[] = [];
  const p = d.property;
  if (!p.name["fa-IR"]) errors.push("name_fa");
  if (!p.summary["fa-IR"] && !p.description["fa-IR"]) errors.push("description_fa");
  if (d.media.filter((m) => !m.roomTypeId).length === 0) errors.push("photo");
  const activeRooms = d.rooms.filter((r) => r.isActive);
  if (activeRooms.length === 0) errors.push("room_type");
  const sellable = activeRooms.filter((r) => d.plans.some((pl) => pl.isActive && pl.roomTypeId === r.id));
  if (sellable.length === 0) errors.push("rate_plan");
  if (!p.currentPolicyId) errors.push("policy");
  if (p.inventoryModel === "entire_place" && (activeRooms.length !== 1 || activeRooms[0]?.units !== 1)) errors.push("entire_place_one_unit");
  if (p.latitude == null) warnings.push("location");
  if (!p.name["en-US"]) warnings.push("name_en");
  if (!p.address["fa-IR"]) warnings.push("address");
  if (p.amenityCodes.length === 0) warnings.push("amenities");
  if (!p.contactPhone) warnings.push("contact_phone");
  return { errors, warnings };
}

export async function setPropertyStatus(actor: Actor, id: string, status: "draft" | "published" | "paused" | "archived", reason: string | null) {
  if (status === "published") {
    const req = await publishRequirements(id);
    if (req.errors.length) throw fail.conflict("publish_requirements", { errors: req.errors });
  }
  await db.begin(async (tx) => {
    const [cur] = await tx<{ status: string }[]>`select status from stay.properties where id = ${id}::uuid for update`;
    if (!cur) throw fail.notFound("property_not_found");
    if (cur.status === "archived") throw fail.conflict("archived_is_final");
    await tx`
      update stay.properties set status = ${status}, published_at = case when ${status} = 'published' then coalesce(published_at, now()) else published_at end,
             updated_at = clock_timestamp()
       where id = ${id}::uuid`;
    await audit(tx as unknown as Tx, actor, id, "property", id, `status_${status}`, { from: cur.status, reason });
  });
}

// Room types ---------------------------------------------------------------------

export type RoomTypeInput = {
  code: string;
  name: Translations;
  description: Translations;
  units: number;
  baseOccupancy: number;
  maxAdults: number;
  maxChildren: number;
  maxOccupancy: number;
  extraBeds: number;
  beds: { type: string; count: number }[];
  sizeM2: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  amenityCodes: string[];
  sortOrder: number;
  isActive: boolean;
};

function validateRoom(input: RoomTypeInput) {
  const errors: Record<string, string> = {};
  if (!/^[a-z0-9][a-z0-9-]{0,40}$/.test(input.code)) errors.code = "invalid";
  if (Object.keys(cleanTr(input.name)).length === 0) errors.name = "required";
  if (input.baseOccupancy > input.maxOccupancy) errors.baseOccupancy = "exceeds_max";
  if (input.maxAdults > input.maxOccupancy) errors.maxAdults = "exceeds_max";
  if (input.units < 1) errors.units = "invalid";
  if (Object.keys(errors).length) throw fail.validation("invalid_room", { fields: errors });
}

async function assertEntirePlaceRoom(tx: Tx, propertyId: string, roomId: string | null, input: RoomTypeInput) {
  const [p] = await tx<{ m: string }[]>`select inventory_model as m from stay.properties where id = ${propertyId}::uuid`;
  if (!p) throw fail.notFound("property_not_found");
  if (p.m !== "entire_place" || !input.isActive) return;
  if (input.units !== 1) throw fail.validation("invalid_room", { fields: { units: "entire_place_one_unit" } });
  const [o] = await tx<{ n: number }[]>`
    select count(*)::int as n from stay.room_types where property_id = ${propertyId}::uuid and is_active and (${roomId}::uuid is null or id <> ${roomId}::uuid)`;
  if (o.n > 0) throw fail.conflict("entire_place_needs_one_unit");
}

export async function saveRoomType(actor: Actor, propertyId: string, roomId: string | null, input: RoomTypeInput): Promise<string> {
  validateRoom(input);
  return db.begin(async (tx) => {
    await assertEntirePlaceRoom(tx as unknown as Tx, propertyId, roomId, input);
    const values = {
      name: db.json(cleanTr(input.name) as never),
      description: db.json(cleanTr(input.description) as never),
      beds: db.json(input.beds.filter((b) => b.type && b.count > 0) as never),
    };
    let id = roomId;
    if (roomId) {
      const r = await tx`
        update stay.room_types set code = ${input.code}, name = ${values.name}, description = ${values.description}, units = ${input.units},
          base_occupancy = ${input.baseOccupancy}, max_adults = ${input.maxAdults}, max_children = ${input.maxChildren},
          max_occupancy = ${input.maxOccupancy}, extra_beds = ${input.extraBeds}, bed_config = ${values.beds}, size_m2 = ${input.sizeM2},
          bedrooms = ${input.bedrooms}, bathrooms = ${input.bathrooms}, amenity_codes = ${input.amenityCodes}::text[],
          sort_order = ${input.sortOrder}, is_active = ${input.isActive}, updated_at = now()
        where id = ${roomId}::uuid and property_id = ${propertyId}::uuid returning id`;
      if (r.length === 0) throw fail.notFound("room_not_found");
    } else {
      const [r] = await tx<{ id: string }[]>`
        insert into stay.room_types (property_id, code, name, description, units, base_occupancy, max_adults, max_children, max_occupancy,
                                     extra_beds, bed_config, size_m2, bedrooms, bathrooms, amenity_codes, sort_order, is_active)
        values (${propertyId}::uuid, ${input.code}, ${values.name}, ${values.description}, ${input.units}, ${input.baseOccupancy}, ${input.maxAdults},
                ${input.maxChildren}, ${input.maxOccupancy}, ${input.extraBeds}, ${values.beds}, ${input.sizeM2}, ${input.bedrooms}, ${input.bathrooms},
                ${input.amenityCodes}::text[], ${input.sortOrder}, ${input.isActive})
        returning id::text`;
      id = r.id;
    }
    await tx`update stay.properties set updated_at = clock_timestamp() where id = ${propertyId}::uuid`;
    await audit(tx as unknown as Tx, actor, propertyId, "room_type", id, roomId ? "updated" : "created", { code: input.code, units: input.units });
    return id!;
  });
}

/** Deletes a room type that was never booked; otherwise it must be deactivated instead. */
export async function deleteRoomType(actor: Actor, propertyId: string, roomId: string) {
  await db.begin(async (tx) => {
    const [b] = await tx<{ n: number }[]>`
      select (select count(*) from stay.bookings where room_type_id = ${roomId}::uuid) + (select count(*) from stay.holds where room_type_id = ${roomId}::uuid) as n`;
    if (Number(b.n) > 0) throw fail.conflict("room_has_bookings");
    const r = await tx`delete from stay.room_types where id = ${roomId}::uuid and property_id = ${propertyId}::uuid returning id`;
    if (r.length === 0) throw fail.notFound("room_not_found");
    await tx`select stay.refresh_from_price(${propertyId}::uuid)`;
    await audit(tx as unknown as Tx, actor, propertyId, "room_type", roomId, "deleted", {});
  });
}

// Rate plans -------------------------------------------------------------------------

export type RatePlanInput = {
  roomTypeId: string;
  code: string;
  name: Translations;
  mealPlan: "room_only" | "breakfast" | "half_board" | "full_board";
  refundable: boolean;
  basePrice: number;
  extraAdultPrice: number;
  childPrice: number;
  minNights: number;
  maxNights: number;
  longStayNights: number | null;
  longStayPercent: number | null;
  sortOrder: number;
  isActive: boolean;
};

function validatePlan(input: RatePlanInput) {
  const errors: Record<string, string> = {};
  if (!/^[a-z0-9][a-z0-9-]{0,40}$/.test(input.code)) errors.code = "invalid";
  if (!(input.basePrice >= 0)) errors.basePrice = "invalid";
  if (input.maxNights < input.minNights) errors.maxNights = "below_min";
  if ((input.longStayNights == null) !== (input.longStayPercent == null)) errors.longStayPercent = "both_or_neither";
  if (input.longStayPercent != null && (input.longStayPercent <= 0 || input.longStayPercent >= 100)) errors.longStayPercent = "invalid";
  if (Object.keys(errors).length) throw fail.validation("invalid_rate_plan", { fields: errors });
}

export async function saveRatePlan(actor: Actor, propertyId: string, planId: string | null, input: RatePlanInput): Promise<string> {
  validatePlan(input);
  return db.begin(async (tx) => {
    const [rt] = await tx<{ ok: boolean }[]>`select true as ok from stay.room_types where id = ${input.roomTypeId}::uuid and property_id = ${propertyId}::uuid`;
    if (!rt) throw fail.validation("invalid_rate_plan", { fields: { roomTypeId: "not_found" } });
    let id = planId;
    if (planId) {
      const r = await tx`
        update stay.rate_plans set room_type_id = ${input.roomTypeId}::uuid, code = ${input.code}, name = ${db.json(cleanTr(input.name) as never)},
          meal_plan = ${input.mealPlan}, refundable = ${input.refundable}, base_price = ${input.basePrice}, extra_adult_price = ${input.extraAdultPrice},
          child_price = ${input.childPrice}, min_nights = ${input.minNights}, max_nights = ${input.maxNights}, long_stay_nights = ${input.longStayNights},
          long_stay_percent = ${input.longStayPercent}, sort_order = ${input.sortOrder}, is_active = ${input.isActive}, updated_at = now()
        where id = ${planId}::uuid and property_id = ${propertyId}::uuid returning id`;
      if (r.length === 0) throw fail.notFound("rate_plan_not_found");
    } else {
      const [r] = await tx<{ id: string }[]>`
        insert into stay.rate_plans (property_id, room_type_id, code, name, meal_plan, refundable, base_price, extra_adult_price, child_price,
                                     min_nights, max_nights, long_stay_nights, long_stay_percent, sort_order, is_active)
        values (${propertyId}::uuid, ${input.roomTypeId}::uuid, ${input.code}, ${db.json(cleanTr(input.name) as never)}, ${input.mealPlan}, ${input.refundable},
                ${input.basePrice}, ${input.extraAdultPrice}, ${input.childPrice}, ${input.minNights}, ${input.maxNights}, ${input.longStayNights},
                ${input.longStayPercent}, ${input.sortOrder}, ${input.isActive})
        returning id::text`;
      id = r.id;
    }
    await tx`update stay.properties set updated_at = clock_timestamp() where id = ${propertyId}::uuid`;
    await tx`select stay.ensure_booking_anchor(${propertyId}::uuid)`;
    await audit(tx as unknown as Tx, actor, propertyId, "rate_plan", id, planId ? "updated" : "created", { code: input.code, basePrice: input.basePrice });
    return id!;
  });
}

export async function deleteRatePlan(actor: Actor, propertyId: string, planId: string) {
  await db.begin(async (tx) => {
    const [b] = await tx<{ n: number }[]>`
      select (select count(*) from stay.bookings where rate_plan_id = ${planId}::uuid) + (select count(*) from stay.holds where rate_plan_id = ${planId}::uuid) as n`;
    if (Number(b.n) > 0) throw fail.conflict("rate_plan_has_bookings");
    const r = await tx`delete from stay.rate_plans where id = ${planId}::uuid and property_id = ${propertyId}::uuid returning id`;
    if (r.length === 0) throw fail.notFound("rate_plan_not_found");
    await audit(tx as unknown as Tx, actor, propertyId, "rate_plan", planId, "deleted", {});
  });
}

// Calendar: prices and inventory per night (A04) ----------------------------------------

export type CalendarDay = {
  date: string;
  units: number;
  sold: number;
  held: number;
  stopSell: boolean;
  closedToArrival: boolean;
  minNights: number | null;
  prices: Record<string, number>;
};

export async function getCalendar(propertyId: string, roomTypeId: string, from: string, days: number): Promise<CalendarDay[]> {
  const [rt] = await db<{ units: number }[]>`select units from stay.room_types where id = ${roomTypeId}::uuid and property_id = ${propertyId}::uuid`;
  if (!rt) throw fail.notFound("room_not_found");
  const n = Math.max(1, Math.min(days, 92));
  const rows = await db<any[]>`
    select d::date::text as date, i.units_override, coalesce(i.sold, 0) as sold, coalesce(i.held, 0) as held,
           coalesce(i.stop_sell, false) as stop_sell, coalesce(i.closed_to_arrival, false) as cta, i.min_nights,
           (select coalesce(jsonb_object_agg(rp.id::text, coalesce(o.price, rp.base_price)), '{}'::jsonb)
              from stay.rate_plans rp left join stay.rate_overrides o on o.rate_plan_id = rp.id and o.stay_date = d::date
             where rp.room_type_id = ${roomTypeId}::uuid and rp.is_active) as prices
      from generate_series(${from}::date, ${from}::date + (${n} - 1), interval '1 day') d
      left join stay.inventory i on i.room_type_id = ${roomTypeId}::uuid and i.stay_date = d::date
     order by d`;
  return rows.map((r) => ({
    date: r.date,
    units: r.units_override ?? rt.units,
    sold: Number(r.sold),
    held: Number(r.held),
    stopSell: r.stop_sell,
    closedToArrival: r.cta,
    minNights: r.min_nights,
    prices: Object.fromEntries(Object.entries(r.prices as Record<string, unknown>).map(([k, v]) => [k, Number(v)])),
  }));
}

/** Bulk inventory change for [from, to) — never below what is already sold or held. */
export async function setInventoryRange(
  actor: Actor,
  propertyId: string,
  input: { roomTypeId: string; from: string; to: string; units: number | null; stopSell: boolean | null; closedToArrival: boolean | null; minNights: number | null },
): Promise<number> {
  return db.begin(async (tx) => {
    const [rt] = await tx<{ ok: boolean }[]>`select true as ok from stay.room_types where id = ${input.roomTypeId}::uuid and property_id = ${propertyId}::uuid`;
    if (!rt) throw fail.notFound("room_not_found");
    const [r] = await tx<{ n: number }[]>`
      select stay.set_inventory(${input.roomTypeId}::uuid, ${input.from}::date, ${input.to}::date, ${input.units}, ${input.stopSell},
                                ${input.closedToArrival}, ${input.minNights}) as n`;
    await audit(tx as unknown as Tx, actor, propertyId, "inventory", input.roomTypeId, "range_updated", input);
    return r.n;
  });
}

/** Dated prices for [from, to), optionally only on some weekdays (0 = Sunday). price null → back to the base price. */
export async function setPriceRange(
  actor: Actor,
  propertyId: string,
  input: { ratePlanId: string; from: string; to: string; price: number | null; weekdays: number[] | null },
): Promise<number> {
  if (input.to <= input.from) throw fail.validation("invalid_dates");
  if (input.price != null && !(input.price >= 0)) throw fail.validation("invalid_value", { fields: { price: "invalid" } });
  return db.begin(async (tx) => {
    const [rp] = await tx<{ ok: boolean }[]>`select true as ok from stay.rate_plans where id = ${input.ratePlanId}::uuid and property_id = ${propertyId}::uuid`;
    if (!rp) throw fail.notFound("rate_plan_not_found");
    const days = input.weekdays?.length ? input.weekdays : [0, 1, 2, 3, 4, 5, 6];
    let n: number;
    if (input.price == null) {
      const r = await tx`
        delete from stay.rate_overrides where rate_plan_id = ${input.ratePlanId}::uuid and stay_date >= ${input.from}::date and stay_date < ${input.to}::date
          and extract(dow from stay_date)::int = any(${days}::int[]) returning stay_date`;
      n = r.length;
    } else {
      const r = await tx`
        insert into stay.rate_overrides (rate_plan_id, stay_date, price, updated_by)
        select ${input.ratePlanId}::uuid, d::date, ${input.price}, ${actor.userId}::uuid
          from generate_series(${input.from}::date, ${input.to}::date - 1, interval '1 day') d
         where extract(dow from d)::int = any(${days}::int[])
        on conflict (rate_plan_id, stay_date) do update set price = excluded.price, updated_at = now(), updated_by = excluded.updated_by
        returning stay_date`;
      n = r.length;
    }
    await audit(tx as unknown as Tx, actor, propertyId, "rate_plan", input.ratePlanId, "prices_updated", input);
    return n;
  });
}

// Media --------------------------------------------------------------------------------

export async function addMedia(actor: Actor, propertyId: string, input: { url: string; alt: Translations; credit: string | null; roomTypeId: string | null }) {
  const { isMediaRef } = await import("@/features/tours/domain/media");
  if (!isMediaRef(input.url)) throw fail.validation("invalid_value", { fields: { url: "invalid" } });
  if (Object.keys(cleanTr(input.alt)).length === 0) throw fail.validation("invalid_value", { fields: { alt: "required" } });
  return db.begin(async (tx) => {
    const [{ n }] = await tx<{ n: number }[]>`select count(*)::int as n from stay.media where property_id = ${propertyId}::uuid and room_type_id is null`;
    const [r] = await tx<{ id: string }[]>`
      insert into stay.media (property_id, room_type_id, url, alt, credit, sort_order, is_cover)
      values (${propertyId}::uuid, ${input.roomTypeId}::uuid, ${input.url.trim()}, ${db.json(cleanTr(input.alt) as never)}, ${input.credit?.trim() || null},
              (select coalesce(max(sort_order), 0) + 1 from stay.media where property_id = ${propertyId}::uuid),
              ${!input.roomTypeId && n === 0})
      returning id::text`;
    await tx`update stay.properties set updated_at = clock_timestamp() where id = ${propertyId}::uuid`;
    await audit(tx as unknown as Tx, actor, propertyId, "media", r.id, "added", { roomTypeId: input.roomTypeId });
    return r.id;
  });
}

export async function updateMedia(actor: Actor, propertyId: string, mediaId: string, input: { alt: Translations; credit: string | null }) {
  await db.begin(async (tx) => {
    const r = await tx`update stay.media set alt = ${db.json(cleanTr(input.alt) as never)}, credit = ${input.credit?.trim() || null}
                        where id = ${mediaId}::uuid and property_id = ${propertyId}::uuid returning id`;
    if (r.length === 0) throw fail.notFound("media_not_found");
    await audit(tx as unknown as Tx, actor, propertyId, "media", mediaId, "updated", {});
  });
}

export async function removeMedia(actor: Actor, propertyId: string, mediaId: string) {
  await db.begin(async (tx) => {
    const [m] = await tx<any[]>`select is_cover, room_type_id from stay.media where id = ${mediaId}::uuid and property_id = ${propertyId}::uuid for update`;
    if (!m) throw fail.notFound("media_not_found");
    const [p] = await tx<{ status: string }[]>`select status from stay.properties where id = ${propertyId}::uuid`;
    const [{ n }] = await tx<{ n: number }[]>`select count(*)::int as n from stay.media where property_id = ${propertyId}::uuid and room_type_id is null`;
    if (p.status === "published" && !m.room_type_id && n <= 1) throw fail.conflict("last_photo");
    await tx`delete from stay.media where id = ${mediaId}::uuid`;
    if (m.is_cover) {
      await tx`update stay.media set is_cover = true where id = (select id from stay.media where property_id = ${propertyId}::uuid and room_type_id is null order by sort_order limit 1)`;
    }
    await audit(tx as unknown as Tx, actor, propertyId, "media", mediaId, "removed", {});
  });
}

export async function setCover(actor: Actor, propertyId: string, mediaId: string) {
  await db.begin(async (tx) => {
    const [m] = await tx<any[]>`select room_type_id from stay.media where id = ${mediaId}::uuid and property_id = ${propertyId}::uuid`;
    if (!m) throw fail.notFound("media_not_found");
    if (m.room_type_id) throw fail.validation("room_photo_cannot_be_cover");
    await tx`update stay.media set is_cover = false where property_id = ${propertyId}::uuid and is_cover`;
    await tx`update stay.media set is_cover = true where id = ${mediaId}::uuid`;
    await audit(tx as unknown as Tx, actor, propertyId, "media", mediaId, "cover_set", {});
  });
}

export async function reorderMedia(actor: Actor, propertyId: string, orderedIds: string[]) {
  await db.begin(async (tx) => {
    let i = 0;
    for (const id of orderedIds) {
      i += 1;
      await tx`update stay.media set sort_order = ${i} where id = ${id}::uuid and property_id = ${propertyId}::uuid`;
    }
    await audit(tx as unknown as Tx, actor, propertyId, "media", null, "reordered", { count: orderedIds.length });
  });
}

// Policies (immutable versions) -----------------------------------------------------------

export async function createPolicyVersion(
  actor: Actor,
  propertyId: string,
  input: { rules: { hoursBefore: number; refundPercent: number }[]; noShowRefundPercent: number; texts: Translations },
): Promise<number> {
  const rules = normalizeRules(input.rules);
  if (rules.length !== input.rules.length) throw fail.validation("invalid_value", { fields: { rules: "invalid" } });
  if (new Set(rules.map((r) => r.hoursBefore)).size !== rules.length) throw fail.validation("invalid_value", { fields: { rules: "duplicate_hours" } });
  if (input.noShowRefundPercent < 0 || input.noShowRefundPercent > 100) throw fail.validation("invalid_value", { fields: { noShowRefundPercent: "invalid" } });
  return db.begin(async (tx) => {
    await tx`select id from stay.properties where id = ${propertyId}::uuid for update`;
    const [{ v }] = await tx<{ v: number }[]>`select coalesce(max(version), 0) + 1 as v from stay.policies where property_id = ${propertyId}::uuid`;
    const [r] = await tx<{ id: string }[]>`
      insert into stay.policies (property_id, version, rules, no_show_refund_percent, texts, created_by)
      values (${propertyId}::uuid, ${v}, ${db.json(rules as never)}, ${input.noShowRefundPercent}, ${db.json(cleanTr(input.texts) as never)}, ${actor.userId}::uuid)
      returning id::text`;
    await tx`update stay.properties set current_policy_id = ${r.id}::uuid, updated_at = clock_timestamp() where id = ${propertyId}::uuid`;
    await audit(tx as unknown as Tx, actor, propertyId, "policy", r.id, "version_created", { version: v });
    return v;
  });
}

// History -----------------------------------------------------------------------------------

export async function propertyHistory(propertyId: string) {
  const rows = await db<any[]>`
    select a.id::text, a.actor_user_id::text, a.entity_type, a.action, a.detail, a.created_at,
           nullif(trim(concat_ws(' ', u.first_name, u.last_name)), '') as actor_name
      from stay.audit_log a left join identity.asp_net_users u on u.id::text = a.actor_user_id::text
     where a.property_id = ${propertyId}::uuid
     order by a.created_at desc limit 200`.catch(async () =>
    db<any[]>`select id::text, actor_user_id::text, entity_type, action, detail, created_at, null as actor_name
                from stay.audit_log where property_id = ${propertyId}::uuid order by created_at desc limit 200`,
  );
  return rows.map((r) => ({
    id: r.id,
    actor: r.actor_name ?? r.actor_user_id ?? "system",
    entityType: r.entity_type,
    action: r.action,
    detail: r.detail,
    createdAt: new Date(r.created_at).toISOString(),
  }));
}

// Import an existing accommodation provider as a draft property ------------------------------

export async function listImportableProviders(q: string | null, locale: string) {
  const like = q?.trim() ? `%${q.trim().toLowerCase()}%` : null;
  const rows = await db<any[]>`
    select sp.id::text, sp.name_translations, sp.city, sp.rating, sp.review_count,
           exists (select 1 from stay.properties p where p.service_provider_id = sp.id) as imported
      from category.service_providers sp
      join category.provider_types pt on pt.id = sp.provider_type_id
     where sp.is_active
       and (exists (select 1 from jsonb_each_text(case when jsonb_typeof(pt.name_translations) = 'object' then pt.name_translations else '{}'::jsonb end) t
                     where t.value ilike '%accommodation%' or t.value ilike '%hotel%' or t.value like '%اقامتگاه%' or t.value like '%هتل%')
            or exists (select 1 from category.provider_services ps join category.service_definitions sd on sd.id = ps.service_definition_id
                        where ps.service_provider_id = sp.id and ps.is_active and sd.booking_ui_mode = 'date_range'))
       and (${like}::text is null or lower(sp.name_translations::text) like ${like} or lower(sp.city) like ${like})
     order by imported, sp.review_count desc nulls last
     limit 100`;
  return rows.map((r) => ({
    id: r.id,
    name: pickStr(r.name_translations, locale),
    city: r.city as string,
    rating: r.rating == null ? null : Number(r.rating),
    reviewCount: r.review_count ?? 0,
    imported: r.imported as boolean,
  }));
}

/** Provider search for the "owner" picker on new properties. */
export async function searchProviders(q: string, locale: string) {
  const like = `%${q.trim().toLowerCase()}%`;
  const rows = await db<any[]>`
    select id::text, name_translations, city from category.service_providers
     where is_active and (lower(name_translations::text) like ${like} or id::text = ${q.trim()})
     order by name_translations->>'fa-IR' limit 20`;
  return rows.map((r) => ({ id: r.id, name: pickStr(r.name_translations, locale), city: r.city as string }));
}

/**
 * Turns an existing Lsevin accommodation provider into a draft stay, with the
 * same rules the catalog migration used (stay.import_provider, 0113): rooms from
 * its nightly services with occupancy read from their names ("سه تخته" → 3),
 * stars / kind / amenities from its attributes, photos from its gallery, the
 * default cancellation policy, request-to-book. The admin reviews and publishes.
 */
export async function importProvider(actor: Actor, providerId: string, cityId: string): Promise<string> {
  const [dup] = await db<{ id: string }[]>`select id::text from stay.properties where service_provider_id = ${providerId}::uuid limit 1`;
  if (dup) throw fail.conflict("already_imported", { propertyId: dup.id });
  try {
    return await db.begin(async (tx) => {
      const [r] = await tx<{ id: string }[]>`select stay.import_provider(${providerId}::uuid, ${cityId}::uuid, ${actor.userId}::uuid, false)::text as id`;
      await tx`select stay.ensure_booking_anchor(${r.id}::uuid)`;
      return r.id;
    });
  } catch (e) {
    const message = String((e as { message?: string })?.message ?? "");
    if (message === "PROVIDER_NOT_FOUND") throw fail.notFound("provider_not_found");
    if (message === "CITY_NOT_FOUND") throw fail.validation("invalid_property", { fields: { cityId: "not_found" } });
    if (message === "ALREADY_IMPORTED") throw fail.conflict("already_imported");
    throw e;
  }
}

