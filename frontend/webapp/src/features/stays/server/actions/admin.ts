"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import db from "@/config/database/db";
import { STAY_CONTENT_LOCALES } from "../../domain/locales";
import { z } from "zod";

import { requireAdmin } from "@/features/tours/server/platform/access";

import { STAYS_CATALOG_TAG } from "../cache";
import { audit, cancelStayByAdmin, decideStayRequest } from "../booking";
import {
  type CityInput,
  deleteCity,
  moderateReview,
  replyToReview,
  revealBookingContact,
  saveCity,
  saveStaySettings,
} from "../admin/operations";
import {
  type PropertyInput,
  type RatePlanInput,
  type RoomTypeInput,
  addMedia,
  createPolicyVersion,
  createProperty,
  deleteRatePlan,
  deleteRoomType,
  getCalendar,
  importProvider,
  listImportableProviders,
  publishRequirements,
  removeMedia,
  reorderMedia,
  saveRatePlan,
  saveRoomType,
  searchProviders,
  setCover,
  setInventoryRange,
  setPriceRange,
  setPropertyStatus,
  updateMedia,
  updateProperty,
  verifyAccessibility,
} from "../admin/properties";
import { fail, runStayAction } from "../errors";
import { AMENITY_GROUPS, amenityCodeFrom } from "../../domain/amenities";
import { PROPERTY_KINDS, MEAL_PLANS } from "../../domain/search";

/**
 * Admin server actions (A02–A09, A12). Every action re-checks the admin role on
 * the server (requireAdmin) — menu visibility is never the only guard — and
 * validates its whole payload; unknown keys are rejected (no mass assignment).
 */

const uuid = z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const tr = z.record(z.string().regex(/^[a-z]{2,3}(-[A-Za-z]{2,4})?$/), z.string().max(20000));
const time = z.string().regex(/^([01][0-9]|2[0-3]):[0-5][0-9]$/);
const reason = z.string().trim().min(5).max(500);

function parse<T>(schema: z.ZodType<T>, input: unknown): T {
  const r = schema.safeParse(input);
  if (!r.success) {
    const fields: Record<string, string> = {};
    for (const issue of r.error.issues) fields[issue.path.join(".")] = issue.code === "too_small" ? "required" : "invalid";
    throw fail.validation("invalid_value", { fields });
  }
  return r.data;
}

async function validateAmenityCodes(codes: string[]) {
  if (!codes.length) return;
  const entries = await db<{ code: string; parent_code: string | null }[]>`
    select code, parent_code from stay.amenities where code = any(${codes}::text[])`;
  const parents = entries.flatMap(row => row.parent_code ? [row.parent_code] : []);
  if (entries.length !== codes.length || parents.some(parent => !codes.includes(parent)) ||
      new Set(parents).size !== parents.length) {
    throw fail.validation("invalid_value", { fields: { amenityCodes: "invalid" } });
  }
}

function touchCustomerPages() {
  revalidateTag(STAYS_CATALOG_TAG);
  revalidatePath("/[locale]/stays", "layout");
  revalidatePath("/sitemap.xml");
}

const propertySchema = z
  .object({
    serviceProviderId: uuid,
    cityId: uuid,
    slug: z.string().regex(/^[a-z0-9][a-z0-9-]{0,100}$/),
    kind: z.enum(PROPERTY_KINDS),
    inventoryModel: z.enum(["rooms", "entire_place"]),
    starRating: z.number().int().min(1).max(5).nullable(),
    name: tr,
    summary: tr,
    description: tr,
    houseRules: tr,
    address: tr,
    latitude: z.number().min(-90).max(90).nullable(),
    longitude: z.number().min(-180).max(180).nullable(),
    locationPrivacy: z.enum(["exact", "approximate"]),
    checkInTime: time,
    checkOutTime: time,
    amenityCodes: z.array(z.string().regex(/^[a-z][a-z0-9_]{1,40}$/)).max(300),
    nearby: z.array(z.object({ kind: z.enum(["hospital", "clinic", "airport", "station", "attraction", "shrine", "beach", "shopping", "other"]), name: tr, distanceM: z.number().int().min(0).max(200000) }).strict()).max(20),
    stepFreeAccess: z.boolean(),
    accessibleBathroom: z.boolean(),
    medicalFriendly: z.boolean(),
    petsAllowed: z.boolean(),
    smokingAllowed: z.boolean(),
    partiesAllowed: z.boolean(),
    familiesOnly: z.boolean(),
    idRequired: z.boolean(),
    childFreeUnderAge: z.number().int().min(0).max(17),
    confirmationMode: z.enum(["instant", "request"]),
    requestTimeoutHours: z.number().int().min(1).max(168),
    currencyCode: z.string().regex(/^[A-Z]{3,5}$/),
    taxPercent: z.number().min(0).max(50),
    timezone: z.string().min(3).max(60),
    contactPhone: z.string().max(20).nullable(),
    isFeatured: z.boolean(),
  })
  .strict();

// New stays: the owner is optional. Without one, createProperty makes a provider from
// the hotel's details; ownerLogin (email or mobile) then links a provider-panel account.
const createPropertySchema = propertySchema.extend({
  serviceProviderId: uuid.nullable(),
  ownerLogin: z.string().trim().max(120).nullable().optional(),
});

export async function createPropertyAction(input: unknown) {
  return runStayAction("admin.createProperty", async () => {
    const actor = await requireAdmin();
    const { ownerLogin, ...data } = parse(createPropertySchema, input);
    await validateAmenityCodes(data.amenityCodes);
    const id = await createProperty(actor, data as Omit<PropertyInput, "serviceProviderId"> & { serviceProviderId: string | null }, ownerLogin ?? null);
    return { id };
  });
}

export async function updatePropertyAction(input: { id: string; data: unknown; expectedUpdatedAt?: string | null }) {
  return runStayAction("admin.updateProperty", async () => {
    const actor = await requireAdmin();
    const id = parse(uuid, input?.id);
    const data = parse(propertySchema, input?.data) as PropertyInput;
    await validateAmenityCodes(data.amenityCodes);
    const r = await updateProperty(actor, id, data, input?.expectedUpdatedAt ?? null);
    touchCustomerPages();
    return r;
  });
}

export async function setPropertyStatusAction(input: { id: string; status: string; reason?: string | null }) {
  return runStayAction("admin.setStatus", async () => {
    const actor = await requireAdmin();
    const data = parse(z.object({ id: uuid, status: z.enum(["draft", "published", "paused", "archived"]), reason: z.string().max(500).nullable().optional() }).strict(), input);
    if ((data.status === "paused" || data.status === "archived") && (data.reason ?? "").trim().length < 5) throw fail.validation("reason_too_short");
    await setPropertyStatus(actor, data.id, data.status, data.reason ?? null);
    touchCustomerPages();
    return { status: data.status };
  });
}

export async function publishRequirementsAction(input: { id: string }) {
  return runStayAction("admin.requirements", async () => {
    await requireAdmin();
    return publishRequirements(parse(uuid, input?.id));
  });
}

export async function verifyAccessibilityAction(input: { id: string }) {
  return runStayAction("admin.verifyAccessibility", async () => {
    const actor = await requireAdmin();
    await verifyAccessibility(actor, parse(uuid, input?.id));
    touchCustomerPages();
    return { verified: true };
  });
}

const roomSchema = z
  .object({
    code: z.string().regex(/^[a-z0-9][a-z0-9-]{0,40}$/),
    name: tr,
    description: tr,
    units: z.number().int().min(1).max(1000),
    baseOccupancy: z.number().int().min(1).max(30),
    maxAdults: z.number().int().min(1).max(30),
    maxChildren: z.number().int().min(0).max(20),
    maxOccupancy: z.number().int().min(1).max(40),
    extraBeds: z.number().int().min(0).max(10),
    beds: z.array(z.object({ type: z.enum(["single", "double", "queen", "king", "twin", "sofa_bed", "floor_mattress", "bunk"]), count: z.number().int().min(1).max(20) }).strict()).max(10),
    sizeM2: z.number().int().min(1).max(5000).nullable(),
    bedrooms: z.number().int().min(0).max(50).nullable(),
    bathrooms: z.number().int().min(0).max(50).nullable(),
    amenityCodes: z.array(z.string().regex(/^[a-z][a-z0-9_]{1,40}$/)).max(300),
    sortOrder: z.number().int().min(0).max(1000),
    isActive: z.boolean(),
  })
  .strict();

export async function saveRoomTypeAction(input: { propertyId: string; roomId: string | null; data: unknown }) {
  return runStayAction("admin.saveRoom", async () => {
    const actor = await requireAdmin();
    const data = parse(roomSchema, input?.data) as RoomTypeInput;
    await validateAmenityCodes(data.amenityCodes);
    const id = await saveRoomType(actor, parse(uuid, input?.propertyId), input?.roomId ? parse(uuid, input.roomId) : null, data);
    touchCustomerPages();
    return { id };
  });
}

export async function deleteRoomTypeAction(input: { propertyId: string; roomId: string }) {
  return runStayAction("admin.deleteRoom", async () => {
    const actor = await requireAdmin();
    await deleteRoomType(actor, parse(uuid, input?.propertyId), parse(uuid, input?.roomId));
    touchCustomerPages();
    return { deleted: true };
  });
}

const planSchema = z
  .object({
    roomTypeId: uuid,
    code: z.string().regex(/^[a-z0-9][a-z0-9-]{0,40}$/),
    name: tr,
    mealPlan: z.enum(MEAL_PLANS),
    refundable: z.boolean(),
    basePrice: z.number().min(0).max(1e15),
    extraAdultPrice: z.number().min(0).max(1e15),
    childPrice: z.number().min(0).max(1e15),
    minNights: z.number().int().min(1).max(60),
    maxNights: z.number().int().min(1).max(365),
    longStayNights: z.number().int().min(2).max(365).nullable(),
    longStayPercent: z.number().gt(0).lt(100).nullable(),
    sortOrder: z.number().int().min(0).max(1000),
    isActive: z.boolean(),
  })
  .strict();

export async function saveRatePlanAction(input: { propertyId: string; planId: string | null; data: unknown }) {
  return runStayAction("admin.savePlan", async () => {
    const actor = await requireAdmin();
    const id = await saveRatePlan(actor, parse(uuid, input?.propertyId), input?.planId ? parse(uuid, input.planId) : null, parse(planSchema, input?.data) as RatePlanInput);
    touchCustomerPages();
    return { id };
  });
}

export async function deleteRatePlanAction(input: { propertyId: string; planId: string }) {
  return runStayAction("admin.deletePlan", async () => {
    const actor = await requireAdmin();
    await deleteRatePlan(actor, parse(uuid, input?.propertyId), parse(uuid, input?.planId));
    touchCustomerPages();
    return { deleted: true };
  });
}

export async function calendarAction(input: { propertyId: string; roomTypeId: string; from: string; days: number }) {
  return runStayAction("admin.calendar", async () => {
    await requireAdmin();
    const d = parse(z.object({ propertyId: uuid, roomTypeId: uuid, from: isoDate, days: z.number().int().min(1).max(92) }).strict(), input);
    return getCalendar(d.propertyId, d.roomTypeId, d.from, d.days);
  });
}

export async function setInventoryRangeAction(input: unknown) {
  return runStayAction("admin.inventory", async () => {
    const actor = await requireAdmin();
    const d = parse(
      z
        .object({
          propertyId: uuid,
          roomTypeId: uuid,
          from: isoDate,
          to: isoDate,
          units: z.number().int().min(0).max(1000).nullable(),
          stopSell: z.boolean().nullable(),
          closedToArrival: z.boolean().nullable(),
          minNights: z.number().int().min(0).max(60).nullable(),
        })
        .strict(),
      input,
    );
    const { propertyId, ...rest } = d;
    const n = await setInventoryRange(actor, propertyId, rest as Parameters<typeof setInventoryRange>[2]);
    touchCustomerPages();
    return { nights: n };
  });
}

export async function setPriceRangeAction(input: unknown) {
  return runStayAction("admin.prices", async () => {
    const actor = await requireAdmin();
    const d = parse(
      z
        .object({
          propertyId: uuid,
          ratePlanId: uuid,
          from: isoDate,
          to: isoDate,
          price: z.number().min(0).max(1e15).nullable(),
          weekdays: z.array(z.number().int().min(0).max(6)).max(7).nullable(),
        })
        .strict(),
      input,
    );
    const { propertyId, ...rest } = d;
    const n = await setPriceRange(actor, propertyId, rest as Parameters<typeof setPriceRange>[2]);
    touchCustomerPages();
    return { nights: n };
  });
}

export async function addMediaAction(input: { propertyId: string; url: string; alt: unknown; credit: string | null; roomTypeId: string | null }) {
  return runStayAction("admin.addMedia", async () => {
    const actor = await requireAdmin();
    const d = parse(z.object({ propertyId: uuid, url: z.string().min(1).max(1000), alt: tr, credit: z.string().max(200).nullable(), roomTypeId: uuid.nullable() }).strict(), input);
    const id = await addMedia(actor, d.propertyId, { url: d.url, alt: d.alt, credit: d.credit ?? null, roomTypeId: d.roomTypeId ?? null });
    touchCustomerPages();
    return { id };
  });
}

export async function updateMediaAction(input: { propertyId: string; mediaId: string; alt: unknown; credit: string | null }) {
  return runStayAction("admin.updateMedia", async () => {
    const actor = await requireAdmin();
    const d = parse(z.object({ propertyId: uuid, mediaId: uuid, alt: tr, credit: z.string().max(200).nullable() }).strict(), input);
    await updateMedia(actor, d.propertyId, d.mediaId, { alt: d.alt, credit: d.credit ?? null });
    touchCustomerPages();
    return { saved: true };
  });
}

export async function mediaCommandAction(input: { propertyId: string; command: "remove" | "cover" | "reorder"; mediaId?: string; order?: string[] }) {
  return runStayAction("admin.mediaCommand", async () => {
    const actor = await requireAdmin();
    const d = parse(
      z.object({ propertyId: uuid, command: z.enum(["remove", "cover", "reorder"]), mediaId: uuid.optional(), order: z.array(uuid).max(200).optional() }).strict(),
      input,
    );
    if (d.command === "reorder") await reorderMedia(actor, d.propertyId, d.order ?? []);
    else if (!d.mediaId) throw fail.validation("invalid_value");
    else if (d.command === "remove") await removeMedia(actor, d.propertyId, d.mediaId);
    else await setCover(actor, d.propertyId, d.mediaId);
    touchCustomerPages();
    return { done: true };
  });
}

export async function createPolicyVersionAction(input: unknown) {
  return runStayAction("admin.policy", async () => {
    const actor = await requireAdmin();
    const d = parse(
      z
        .object({
          propertyId: uuid,
          rules: z.array(z.object({ hoursBefore: z.number().int().min(0).max(8760), refundPercent: z.number().int().min(0).max(100) }).strict()).max(10),
          noShowRefundPercent: z.number().int().min(0).max(100),
          texts: tr,
        })
        .strict(),
      input,
    );
    const version = await createPolicyVersion(actor, d.propertyId, d);
    touchCustomerPages();
    return { version };
  });
}

export async function searchProvidersAction(input: { q: string; locale: string }) {
  return runStayAction("admin.searchProviders", async () => {
    await requireAdmin();
    const d = parse(z.object({ q: z.string().trim().min(2).max(80), locale: z.string().max(10) }).strict(), input);
    return searchProviders(d.q, d.locale);
  });
}

export async function importableProvidersAction(input: { q: string | null; locale: string }) {
  return runStayAction("admin.importable", async () => {
    await requireAdmin();
    const d = parse(z.object({ q: z.string().max(80).nullable(), locale: z.string().max(10) }).strict(), input);
    return listImportableProviders(d.q, d.locale);
  });
}

export async function importProviderAction(input: { providerId: string; cityId: string }) {
  return runStayAction("admin.import", async () => {
    const actor = await requireAdmin();
    const d = parse(z.object({ providerId: uuid, cityId: uuid }).strict(), input);
    return { id: await importProvider(actor, d.providerId, d.cityId) };
  });
}

const citySchema = z
  .object({
    slug: z.string().regex(/^[a-z0-9][a-z0-9-]{0,60}$/),
    name: tr,
    region: tr,
    intro: tr,
    coverUrl: z.string().max(1000).nullable(),
    coverAlt: tr,
    coverCredit: z.string().max(200).nullable(),
    latitude: z.number().min(-90).max(90).nullable(),
    longitude: z.number().min(-180).max(180).nullable(),
    isPublished: z.boolean(),
    isFeatured: z.boolean(),
    sortOrder: z.number().int().min(0).max(10000),
  })
  .strict();

export async function saveCityAction(input: { id: string | null; data: unknown }) {
  return runStayAction("admin.saveCity", async () => {
    const actor = await requireAdmin();
    const id = await saveCity(actor, input?.id ? parse(uuid, input.id) : null, parse(citySchema, input?.data) as CityInput);
    touchCustomerPages();
    return { id };
  });
}

export async function deleteCityAction(input: { id: string }) {
  return runStayAction("admin.deleteCity", async () => {
    const actor = await requireAdmin();
    await deleteCity(actor, parse(uuid, input?.id));
    touchCustomerPages();
    return { deleted: true };
  });
}

export async function decideRequestAction(input: { bookingId: string; decision: "accept" | "decline"; reason?: string | null }) {
  return runStayAction("admin.decide", async () => {
    const actor = await requireAdmin();
    const d = parse(z.object({ bookingId: uuid, decision: z.enum(["accept", "decline"]), reason: z.string().max(500).nullable().optional() }).strict(), input);
    if (d.decision === "decline" && (d.reason ?? "").trim().length < 5) throw fail.validation("reason_too_short");
    return { status: await decideStayRequest(actor, d.bookingId, d.decision, d.reason ?? undefined) };
  });
}

export async function adminCancelBookingAction(input: { bookingId: string; reason: string; operatorFault: boolean }) {
  return runStayAction("admin.cancel", async () => {
    const actor = await requireAdmin();
    const d = parse(z.object({ bookingId: uuid, reason, operatorFault: z.boolean() }).strict(), input);
    return cancelStayByAdmin(actor, d.bookingId, d.reason, d.operatorFault);
  });
}

export async function revealContactAction(input: { bookingId: string; reason: string; locale: string }) {
  return runStayAction("admin.reveal", async () => {
    const actor = await requireAdmin();
    const d = parse(z.object({ bookingId: uuid, reason: z.string().trim().min(10).max(500), locale: z.string().max(10) }).strict(), input);
    return revealBookingContact(actor, d.bookingId, d.reason, d.locale);
  });
}

export async function moderateReviewAction(input: { id: string; status: "published" | "hidden" | "rejected"; reason?: string | null }) {
  return runStayAction("admin.moderate", async () => {
    const actor = await requireAdmin();
    const d = parse(z.object({ id: uuid, status: z.enum(["published", "hidden", "rejected"]), reason: z.string().max(500).nullable().optional() }).strict(), input);
    await moderateReview(actor, d.id, d.status, d.reason ?? null);
    touchCustomerPages();
    return { status: d.status };
  });
}

export async function replyReviewAction(input: { id: string; reply: string | null }) {
  return runStayAction("admin.reply", async () => {
    const actor = await requireAdmin();
    const d = parse(z.object({ id: uuid, reply: z.string().max(2000).nullable() }).strict(), input);
    await replyToReview(actor, d.id, d.reply);
    touchCustomerPages();
    return { saved: true };
  });
}

export async function saveSettingsAction(input: unknown) {
  return runStayAction("admin.settings", async () => {
    const actor = await requireAdmin();
    const d = parse(
      z
        .object({
          holdMinutes: z.number().int().optional(),
          paymentWindowMinutes: z.number().int().optional(),
          requestTimeoutHours: z.number().int().optional(),
          serviceFeePercent: z.number().optional(),
          maxNights: z.number().int().optional(),
          maxRooms: z.number().int().optional(),
          bookingWindowDays: z.number().int().optional(),
        })
        .strict(),
      input,
    );
    return saveStaySettings(actor, d);
  });
}
const amenityLabel = z
  .record(z.string().refine((key) => STAY_CONTENT_LOCALES.some((locale) => locale === key)), z.string().trim().max(200))
  .refine((label) => Object.values(label).some(Boolean), { message: "label_required" });
const amenityCode = z.string().regex(/^[a-z][a-z0-9_]{1,40}$/);
const amenityIcon = z.string().regex(/^[a-z][a-z0-9-]{0,45}$/);

/**
 * Validates where an amenity sits: an option (child) needs an active top-level parent, cannot be
 * its own parent, and an amenity that already has options cannot become an option itself
 * (one level only). An option always takes its parent's section.
 */
async function amenityPlacement(tx: typeof db, code: string | null, parentCode: string | null, grp: string) {
  if (!parentCode) return grp;
  if (parentCode === code) throw fail.validation("invalid_parent");
  const [parent] = await tx<{ grp: string; parent_code: string | null }[]>`
    select grp, parent_code from stay.amenities where code = ${parentCode} and is_active`;
  if (!parent || parent.parent_code) throw fail.validation("invalid_parent");
  if (code) {
    const [child] = await tx<{ n: number }[]>`select count(*)::int as n from stay.amenities where parent_code = ${code} and is_active`;
    if (child.n > 0) throw fail.conflict("amenity_has_options");
  }
  return parent.grp;
}

async function checkAmenityImage(tx: typeof db, imageId: string | null) {
  if (!imageId) return;
  const images = await tx`select id from media.media_library where id = ${imageId}::uuid and is_public and mime_type like 'image/%' for share`;
  if (!images.length) throw fail.validation("invalid_value");
}

/** Edits an amenity: name in every language, icon or image, section, option-of, order, on/off. */
export async function saveAmenityAction(input: unknown) {
  return runStayAction("admin.saveAmenity", async () => {
    const actor = await requireAdmin();
    const data = parse(
      z
        .object({
          code: amenityCode,
          imageId: uuid.nullable(),
          revision: z.number().int().positive(),
          label: amenityLabel,
          icon: amenityIcon,
          group: z.enum(AMENITY_GROUPS).optional(),
          parentCode: amenityCode.nullable().optional(),
          sortOrder: z.number().int().min(0).max(1_000_000).optional(),
          isActive: z.boolean().optional(),
        })
        .strict(),
      input,
    );
    await db.begin(async (tx) => {
      await checkAmenityImage(tx as unknown as typeof db, data.imageId);
      const [current] = await tx<{ grp: string; parent_code: string | null; sort_order: number; is_active: boolean }[]>`
        select grp, parent_code, sort_order, is_active from stay.amenities where code = ${data.code} for update`;
      if (!current) throw fail.notFound();
      const parentCode = data.parentCode === undefined ? current.parent_code : data.parentCode;
      const grp = await amenityPlacement(tx as unknown as typeof db, data.code, parentCode, data.group ?? current.grp);
      const changed = await tx`
        update stay.amenities
           set label = label || ${db.json(data.label)}::jsonb, icon = ${data.icon}, image_id = ${data.imageId}::uuid,
               grp = ${grp}, parent_code = ${parentCode}, sort_order = ${data.sortOrder ?? current.sort_order},
               is_active = ${data.isActive ?? current.is_active}, revision = revision + 1
         where code = ${data.code} and revision = ${data.revision}
        returning code`;
      if (!changed.length) throw fail.conflict("stale_edit");
      // Options follow their parent's section.
      await tx`update stay.amenities set grp = ${grp} where parent_code = ${data.code} and grp <> ${grp}`;
      await audit(tx as unknown as typeof db, actor, null, "amenity", null, "updated", {
        code: data.code, revision: data.revision + 1, group: grp, parentCode, isActive: data.isActive ?? current.is_active,
      });
    });
    touchCustomerPages();
    revalidatePath("/[locale]/admin/stays", "layout");
    return { code: data.code };
  });
}

/**
 * Adds an amenity to the catalogue (or an option of one). Its code is derived from the English
 * (else any) name and made unique; it starts at the end of its section.
 */
export async function createAmenityAction(input: unknown) {
  return runStayAction("admin.createAmenity", async () => {
    const actor = await requireAdmin();
    const data = parse(
      z
        .object({
          label: amenityLabel,
          icon: amenityIcon,
          group: z.enum(AMENITY_GROUPS),
          parentCode: amenityCode.nullable(),
          imageId: uuid.nullable(),
        })
        .strict(),
      input,
    );
    const code = await db.begin(async (tx) => {
      await checkAmenityImage(tx as unknown as typeof db, data.imageId);
      const grp = await amenityPlacement(tx as unknown as typeof db, null, data.parentCode, data.group);
      const seed = amenityCodeFrom(data.label["en-US"] || Object.values(data.label).find(Boolean) || "amenity");
      let candidate = seed;
      for (let i = 2; ; i += 1) {
        const [taken] = await tx<{ n: number }[]>`select count(*)::int as n from stay.amenities where code = ${candidate}`;
        if (taken.n === 0) break;
        candidate = `${seed.slice(0, 36)}_${i}`;
      }
      const [{ next }] = await tx<{ next: number }[]>`
        select coalesce(max(sort_order), 0) + 10 as next from stay.amenities
         where ${data.parentCode}::text is null and grp = ${grp} or parent_code = ${data.parentCode}`;
      await tx`
        insert into stay.amenities (code, grp, label, icon, sort_order, parent_code, image_id)
        values (${candidate}, ${grp}, ${db.json(data.label)}::jsonb, ${data.icon}, ${next}, ${data.parentCode}, ${data.imageId}::uuid)`;
      await audit(tx as unknown as typeof db, actor, null, "amenity", null, "created", { code: candidate, group: grp, parentCode: data.parentCode });
      return candidate;
    });
    touchCustomerPages();
    revalidatePath("/[locale]/admin/stays", "layout");
    return { code };
  });
}
