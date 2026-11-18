"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { CALENDAR_IDS, type CalendarId } from "@/features/tours/domain/calendar";
import { contentLocaleFor } from "@/features/tours/domain/content";
import { currentActor, ownerKey, requireUser } from "@/features/tours/server/platform/access";

import {
  cancelStayByCustomer,
  confirmStayCheckout,
  quoteStayCancellation,
  quoteStaySelection,
  releaseStayHold,
  startStayCheckout,
  submitStayReview,
} from "../booking";
import { getPriceCalendar, getRoomOffers, recordView } from "../catalog";
import { fail, runStayAction } from "../errors";
import { clearRecentViews, markStaysIntroCompleted, toggleWishlist } from "../state";

/**
 * Customer server actions of the Stays app. Each resolves the actor from the
 * session and returns a structured ActionResult; the UI maps `error.code` to
 * StayApp.errors.* (never raw server text).
 */

// Hex-with-dashes, not RFC-variant checked: production ids are not all RFC 4122.
const uuid = z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
const idemKey = z.string().regex(/^[A-Za-z0-9_-]{16,80}$/);
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const occupancy = z
  .object({
    rooms: z.number().int().min(1).max(10),
    adults: z.number().int().min(1).max(60),
    childAges: z.array(z.number().int().min(0).max(17)).max(20),
  })
  .strict();
const selection = z
  .object({ propertyId: uuid, roomTypeId: uuid, ratePlanId: uuid, checkIn: isoDate, checkOut: isoDate, occupancy })
  .strict();
const optName = z.string().trim().max(80).nullable().optional();

function parse<T>(schema: z.ZodType<T>, input: unknown): T {
  const r = schema.safeParse(input);
  if (!r.success) {
    const fields: Record<string, string> = {};
    for (const issue of r.error.issues) fields[issue.path.join(".")] = "invalid";
    throw fail.validation("invalid_value", { fields });
  }
  return r.data;
}

export async function completeStaysIntroAction() {
  return runStayAction("completeIntro", async () => {
    await markStaysIntroCompleted(await currentActor());
    return { done: true };
  });
}

export async function toggleStayWishlistAction(input: { propertyId: string; saved: boolean }) {
  return runStayAction("toggleWishlist", async () => {
    const data = parse(z.object({ propertyId: uuid, saved: z.boolean() }).strict(), input);
    const actor = await requireUser();
    const saved = await toggleWishlist(actor.userId, data.propertyId, data.saved);
    revalidatePath("/[locale]/stays/wishlist", "page");
    return { saved };
  });
}

export async function recordStayViewAction(input: { propertyId: string }) {
  return runStayAction("recordView", async () => {
    const { propertyId } = parse(z.object({ propertyId: uuid }).strict(), input);
    const owner = await ownerKey(await currentActor(), { create: true });
    if (owner) await recordView(owner, propertyId);
    return { recorded: Boolean(owner) };
  });
}

export async function clearStayRecentViewsAction() {
  return runStayAction("clearRecent", async () => {
    const owner = await ownerKey(await currentActor());
    if (owner) await clearRecentViews(owner);
    return { cleared: true };
  });
}

/** Room list for new dates / party without a full page reload. */
export async function roomOffersAction(input: { propertyId: string; checkIn: string | null; checkOut: string | null; occupancy: unknown; locale: string }) {
  return runStayAction("roomOffers", async () => {
    const data = parse(
      z.object({ propertyId: uuid, checkIn: isoDate.nullable(), checkOut: isoDate.nullable(), occupancy, locale: z.string().max(10) }).strict(),
      input,
    );
    return getRoomOffers(data.propertyId, { checkIn: data.checkIn, checkOut: data.checkOut, occupancy: data.occupancy }, contentLocaleFor(data.locale));
  });
}

export async function quoteStayAction(input: unknown) {
  return runStayAction("quote", async () => quoteStaySelection(parse(selection, input)));
}

export async function startStayCheckoutAction(input: unknown) {
  return runStayAction("startCheckout", async () => {
    const data = parse(selection.extend({ idempotencyKey: idemKey }).strict(), input);
    const actor = await requireUser();
    return startStayCheckout(actor.userId, data);
  });
}

export async function releaseStayHoldAction(input: { holdId: string }) {
  return runStayAction("releaseHold", async () => {
    const { holdId } = parse(z.object({ holdId: uuid }).strict(), input);
    const actor = await requireUser();
    return { released: await releaseStayHold(actor.userId, holdId) };
  });
}

export async function confirmStayCheckoutAction(input: unknown) {
  return runStayAction("confirmCheckout", async () => {
    const data = parse(
      selection
        .extend({
          holdId: uuid,
          idempotencyKey: idemKey,
          expectedTotal: z.number().min(0),
          acceptedPolicyVersion: z.number().int().min(1),
          uiLocale: z.string().max(10),
          displayCalendar: z.enum(CALENDAR_IDS as [string, ...string[]]),
          // Optional: the account's own name / mobile / email fill anything left out (server side).
          buyer: z
            .object({ firstName: optName, lastName: optName, phone: z.string().trim().max(20).nullable().optional(), email: z.string().trim().max(200).nullable().optional() })
            .strict()
            .nullable()
            .optional(),
          guests: z.array(z.object({ firstName: z.string().trim().max(80), lastName: z.string().trim().max(80) }).strict()).max(20).nullable().optional(),
          specialRequests: z.string().max(1000).nullable().optional(),
          arrivalTime: z.string().max(5).nullable().optional(),
          policyAccepted: z.literal(true),
        })
        .strict(),
      input,
    );
    const actor = await requireUser();
    const { policyAccepted: _accepted, ...rest } = data;
    const result = await confirmStayCheckout(actor.userId, { ...rest, uiLocale: contentLocaleFor(data.uiLocale), displayCalendar: data.displayCalendar as CalendarId });
    revalidatePath("/[locale]/stays/bookings", "page");
    return result;
  });
}

export async function quoteStayCancellationAction(input: { bookingId: string }) {
  return runStayAction("quoteCancellation", async () => {
    const { bookingId } = parse(z.object({ bookingId: uuid }).strict(), input);
    const actor = await requireUser();
    return quoteStayCancellation(actor.userId, bookingId);
  });
}

export async function cancelStayAction(input: { bookingId: string; reason: string }) {
  return runStayAction("cancel", async () => {
    const data = parse(z.object({ bookingId: uuid, reason: z.string().trim().min(3).max(500) }).strict(), input);
    const actor = await requireUser();
    const quote = await cancelStayByCustomer(actor.userId, data.bookingId, data.reason);
    revalidatePath("/[locale]/stays/bookings", "page");
    return quote;
  });
}

export async function submitStayReviewAction(input: unknown) {
  return runStayAction("review", async () => {
    const score = z.number().int().min(1).max(5);
    const data = parse(
      z
        .object({
          bookingId: uuid,
          rating: score,
          cleanliness: score.nullable().optional(),
          location: score.nullable().optional(),
          staff: score.nullable().optional(),
          value: score.nullable().optional(),
          body: z.string().max(3000).nullable().optional(),
          authorName: z.string().max(60).nullable().optional(),
          locale: z.string().max(10),
        })
        .strict(),
      input,
    );
    const actor = await requireUser();
    const id = await submitStayReview(actor.userId, { ...data, locale: contentLocaleFor(data.locale) });
    // Not shown until an admin publishes it; moderation clears the catalogue cache.
    return { id };
  });
}

/** Cheapest nightly price per day for the date picker (public, read-only). */
export async function stayPriceCalendarAction(input: unknown) {
  return runStayAction("priceCalendar", async () => {
    const data = parse(z.object({ propertyId: uuid, from: isoDate, days: z.number().int().min(1).max(120), occupancy }).strict(), input);
    return getPriceCalendar(data.propertyId, data.from, data.days, data.occupancy);
  });
}
