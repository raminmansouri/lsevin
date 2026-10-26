"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { CALENDAR_IDS } from "../../domain/calendar";
import { TRAVELER_CLASSES } from "../../domain/pricing";
import { createInquiry } from "../ops/inquiries";
import { reportReview, submitReview } from "../ops/reviews";
import { joinWaitlist, leaveWaitlist } from "../ops/waitlist";
import { currentActor, ownerKey, requireUser } from "../platform/access";
import {
  cancelByCustomer,
  confirmCheckout,
  quoteCustomerCancellation,
  quoteSelection,
  releaseCheckoutHold,
  startCheckout,
} from "../platform/booking";
import {
  cardsByIds,
  clearRecentSearches,
  clearRecentViews,
  mergeGuestHistory,
  recordRecentSearch,
  recordRecentView,
  toggleWishlist,
} from "../platform/catalog";
import { fail, runAction } from "../platform/errors";

import {
  addressBook,
  createShareLink,
  deleteMyData,
  historyAllowed,
  markIntroCompleted,
  removeChecklistItem,
  revokeShareLink,
  saveCommunicationPrefs,
  savePrefs,
  setChecklistItem,
} from "./customer/state";

/**
 * Customer server actions of the Tours app. Each one resolves the actor from the
 * session (requireUser/currentActor) and returns a structured ActionResult —
 * the UI maps `error.code` to TourShared.errors.* (never raw text).
 */

const uuid = z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
const idemKey = z.string().regex(/^[A-Za-z0-9_-]{16,80}$/);
const travelers = z.object(Object.fromEntries(TRAVELER_CLASSES.map((c) => [c, z.number().int().min(0).max(50).optional()]))).strict();
const selection = z
  .object({
    departureId: uuid,
    optionId: uuid,
    travelers,
    addons: z.array(z.object({ id: uuid, quantity: z.number().int().min(0).max(50) })).max(30).optional(),
  })
  .strict();

function parse<T>(schema: z.ZodType<T>, input: unknown): T {
  const r = schema.safeParse(input);
  if (!r.success) throw fail.validation("invalid_value");
  return r.data;
}

// ---------------------------------------------------------------------------
// Onboarding, preferences, history
// ---------------------------------------------------------------------------

export async function completeIntroAction() {
  return runAction("completeIntro", async () => {
    const actor = await currentActor();
    await markIntroCompleted(actor);
    return { done: true };
  });
}

export async function savePrefsAction(input: { calendar?: string | null; currency?: string | null }) {
  return runAction("savePrefs", async () => {
    const data = parse(
      z.object({ calendar: z.enum(CALENDAR_IDS as [string, ...string[]]).nullable().optional(), currency: z.string().regex(/^[A-Z]{3,5}$/).nullable().optional() }).strict(),
      input,
    );
    await savePrefs(await currentActor(), data);
    return { saved: true };
  });
}

export async function saveCommunicationPrefsAction(input: {
  channels?: { in_app: boolean; email: boolean; sms: boolean; push: boolean };
  marketingOptIn?: boolean;
  personalizationOptIn?: boolean;
  historyOptIn?: boolean;
}) {
  return runAction("saveCommunicationPrefs", async () => {
    const actor = await requireUser();
    const data = parse(
      z
        .object({
          channels: z.object({ in_app: z.boolean(), email: z.boolean(), sms: z.boolean(), push: z.boolean() }).strict().optional(),
          marketingOptIn: z.boolean().optional(),
          personalizationOptIn: z.boolean().optional(),
          historyOptIn: z.boolean().optional(),
        })
        .strict(),
      input,
    );
    await saveCommunicationPrefs(actor.userId, data);
    if (data.historyOptIn === false) await clearRecentViews(`u:${actor.userId}`);
    return { saved: true };
  });
}

/** Records a tour view for Recently Viewed (C-103). Needs an action: RSC renders cannot set the guest cookie. */
export async function recordViewAction(tourId: string) {
  return runAction("recordView", async () => {
    const id = parse(uuid, tourId);
    const actor = await currentActor();
    if (!(await historyAllowed(actor))) return { recorded: false };
    const owner = await ownerKey(actor, { create: true });
    if (!owner) return { recorded: false };
    if (actor.userId) {
      // A device's guest history becomes the account's on first signed-in view.
      const guest = await ownerKey({ ...actor, userId: null });
      if (guest) await mergeGuestHistory(guest, owner);
    }
    await recordRecentView(owner, id);
    return { recorded: true };
  });
}

export async function clearRecentViewsAction() {
  return runAction("clearRecentViews", async () => {
    const actor = await currentActor();
    const owners = [await ownerKey(actor), actor.userId ? await ownerKey({ ...actor, userId: null }) : null].filter(Boolean) as string[];
    for (const o of owners) await clearRecentViews(o);
    revalidatePath("/[locale]/tours", "page");
    return { cleared: true };
  });
}

export async function recordSearchAction(query: string, filters: Record<string, string>) {
  return runAction("recordSearch", async () => {
    const data = parse(z.object({ q: z.string().max(120), f: z.record(z.string().max(40), z.string().max(80)) }), { q: query, f: filters });
    if (Object.keys(data.f).length > 30) throw fail.validation("invalid_value");
    const actor = await currentActor();
    if (!(await historyAllowed(actor))) return { recorded: false };
    const owner = await ownerKey(actor, { create: true });
    if (owner) await recordRecentSearch(owner, data.q, data.f);
    return { recorded: Boolean(owner) };
  });
}

export async function clearRecentSearchesAction() {
  return runAction("clearRecentSearches", async () => {
    const owner = await ownerKey(await currentActor());
    if (owner) await clearRecentSearches(owner);
    return { cleared: true };
  });
}

export async function toggleWishlistAction(tourId: string) {
  return runAction("toggleWishlist", async () => {
    const actor = await requireUser();
    return { saved: await toggleWishlist(actor.userId, parse(uuid, tourId)) };
  });
}

/** Cards for a guest's locally saved wishlist / compare list (public data only). */
export async function cardsAction(ids: string[], locale: string) {
  return runAction("cards", async () => {
    const list = parse(z.array(uuid).max(50), ids);
    const { contentLocaleFor } = await import("../../domain/content");
    return cardsByIds(list, contentLocaleFor(locale));
  });
}

export async function deleteMyDataAction() {
  return runAction("deleteMyData", async () => {
    await deleteMyData(await currentActor());
    return { deleted: true };
  });
}

// ---------------------------------------------------------------------------
// Booking
// ---------------------------------------------------------------------------

export async function quoteAction(input: unknown) {
  return runAction("quote", async () => quoteSelection(parse(selection, input)));
}

export async function startCheckoutAction(input: unknown) {
  return runAction("startCheckout", async () => {
    const actor = await requireUser();
    const data = parse(selection.extend({ idempotencyKey: idemKey }), input);
    return startCheckout(actor.userId, data);
  });
}

export async function releaseHoldAction(holdId: string) {
  return runAction("releaseHold", async () => {
    const actor = await requireUser();
    return { released: await releaseCheckoutHold(actor.userId, parse(uuid, holdId)) };
  });
}

const participant = z
  .object({
    travelerClass: z.enum(TRAVELER_CLASSES),
    firstName: z.string().max(80),
    lastName: z.string().max(80),
    nationality: z.string().max(2).nullable().optional(),
    age: z.number().int().nullable().optional(),
    idDocumentLast4: z.string().max(4).nullable().optional(),
    assistanceRequest: z.string().max(500).nullable().optional(),
    isForeign: z.boolean().optional(),
  })
  .strict();

const confirmInput = selection
  .extend({
    holdId: uuid,
    idempotencyKey: idemKey,
    expectedTotal: z.number().nonnegative(),
    acceptedPolicyVersion: z.number().int().positive(),
    policyLocale: z.string().max(10),
    uiLocale: z.string().max(10),
    displayCalendar: z.enum(CALENDAR_IDS as [string, ...string[]]),
    buyer: z
      .object({
        firstName: z.string().max(80),
        lastName: z.string().max(80),
        email: z.string().max(160).nullable().optional(),
        phone: z.string().max(24),
        phoneCountryCode: z.string().max(6).nullable().optional(),
      })
      .strict(),
    participants: z.array(participant).max(50),
    notes: z.string().max(500).nullable().optional(),
  })
  .strict();

export async function confirmCheckoutAction(input: unknown) {
  return runAction("confirmCheckout", async () => {
    const actor = await requireUser();
    const data = parse(confirmInput, input) as unknown as Parameters<typeof confirmCheckout>[1];
    return confirmCheckout(actor.userId, data);
  });
}

export async function addressBookAction() {
  return runAction("addressBook", async () => addressBook((await requireUser()).userId));
}

export async function quoteCancellationAction(bookingId: string) {
  return runAction("quoteCancellation", async () => quoteCustomerCancellation((await requireUser()).userId, parse(uuid, bookingId)));
}

export async function cancelBookingAction(bookingId: string, reason: string) {
  return runAction("cancelBooking", async () => {
    const actor = await requireUser();
    const res = await cancelByCustomer(actor.userId, parse(uuid, bookingId), String(reason ?? "").slice(0, 200));
    return { refund: res.refund, refundRequested: Boolean(res.refundRequestId) };
  });
}

// ---------------------------------------------------------------------------
// After booking: checklist, share links, waitlist, inquiries, reviews
// ---------------------------------------------------------------------------

export async function setChecklistItemAction(bookingId: string, item: { key: string; label: string; done: boolean; sortOrder: number }) {
  return runAction("setChecklistItem", async () => {
    const actor = await requireUser();
    await setChecklistItem(actor.userId, parse(uuid, bookingId), item);
    return { saved: true };
  });
}

export async function removeChecklistItemAction(bookingId: string, key: string) {
  return runAction("removeChecklistItem", async () => {
    const actor = await requireUser();
    await removeChecklistItem(actor.userId, parse(uuid, bookingId), String(key));
    return { removed: true };
  });
}

export async function createShareLinkAction(bookingId: string, days: number) {
  return runAction("createShareLink", async () => createShareLink((await requireUser()).userId, parse(uuid, bookingId), Number(days)));
}

export async function revokeShareLinkAction(linkId: string) {
  return runAction("revokeShareLink", async () => {
    await revokeShareLink((await requireUser()).userId, parse(uuid, linkId));
    return { revoked: true };
  });
}

export async function joinWaitlistAction(departureId: string, seats: number) {
  return runAction("joinWaitlist", async () => {
    const actor = await requireUser();
    return joinWaitlist(actor.userId, parse(uuid, departureId), parse(z.number().int().min(1).max(50), seats));
  });
}

export async function leaveWaitlistAction(departureId: string) {
  return runAction("leaveWaitlist", async () => {
    const actor = await requireUser();
    return leaveWaitlist(actor.userId, parse(uuid, departureId));
  });
}

export async function createInquiryAction(input: unknown) {
  return runAction("createInquiry", async () => {
    const actor = await requireUser();
    const data = parse(
      z
        .object({
          tourId: uuid,
          kind: z.enum(["private_quote", "group"]),
          partySize: z.number().int().min(1).max(500),
          preferredDates: z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).max(5),
          message: z.string().max(2000),
        })
        .strict(),
      input,
    );
    return createInquiry(actor.userId, data);
  });
}

export async function submitReviewAction(input: unknown) {
  return runAction("submitReview", async () => {
    const actor = await requireUser();
    const data = parse(
      z
        .object({
          bookingId: uuid,
          rating: z.number().int().min(1).max(5),
          guideRating: z.number().int().min(1).max(5).nullable().optional(),
          body: z.string().max(4000),
          locale: z.string().max(10),
        })
        .strict(),
      input,
    );
    return submitReview(actor.userId, data);
  });
}

export async function reportReviewAction(reviewId: string, reason: string) {
  return runAction("reportReview", async () => {
    const actor = await requireUser();
    return reportReview(actor.userId, parse(uuid, reviewId), String(reason ?? "").slice(0, 500));
  });
}
