import "server-only";

import { createHash, timingSafeEqual } from "node:crypto";

import { z } from "zod";

import db from "@/config/database/db";

import * as authoring from "../platform/authoring";
import { decideBookingRequest } from "../platform/booking";
import { getTourDetail } from "../platform/catalog";
import { httpStatusFor, logUnexpected, mapDbError, ToursError, type ToursErrorKind } from "../platform/errors";
import type { Actor } from "../platform/roles";

import { providerAnalytics, providerPayoutSummary } from "./analytics";
import { checkinSummary, getManifest, scanTicket, syncCheckins } from "./checkin";
import { cancelDeparture, delayDeparture, listProviderBookings, listProviderDepartures, notifyItineraryChange, updateDeparture } from "./departures";
import {
  assignToDeparture, getGuideProfile, guideSchedule, inviteGuide, listProviderGuides, respondToAssignment, respondToGuideInvitation,
  reviewGuideBio, revokeAssignment, revokeGuide, saveGuideProfile,
} from "./guides";
import { escalateIncident, listIncidents, reportIncident, resolveIncident } from "./incidents";
import { declineInquiry, listProviderInquiries, quoteInquiry } from "./inquiries";
import { getLiveView, postMilestone, pushPoints, startTracking, stopTracking } from "./live";
import { sendNotice } from "./notices";
import { listProviderTours, meContext, tourEditorBundle } from "./portal";
import { listProviderReviews, replyToReview } from "./reviews";

/**
 * Internal RPC API used by lsevin-portal (docs/designs/tours/IMPLEMENTATION.md,
 * "Internal RPC contract"). The route handler is a thin wrapper around
 * handleRpc() so every rule here — service key, acting user, strict argument
 * validation, error mapping, rate limit — is testable without Next.js.
 *
 * Trust model: the portal proves it is the portal (service key) and says WHO is
 * acting (X-Acting-User-Id). It never says what that user may do: roles are read
 * here from identity.asp_net_user_roles and every method authorizes per object.
 */

// ----------------------------------------------------------------------------
// Argument schemas (unknown fields rejected everywhere)
// ----------------------------------------------------------------------------

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const uuid = z.string().regex(UUID_RE, "invalid_uuid");
const locale = z.string().regex(/^[a-z]{2,3}(-[A-Za-z]{4})?(-([A-Z]{2}|[0-9]{3}))?$/, "invalid_locale");
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "invalid_date");
const calendarDate = z.string().min(6).max(20); // typed in the given calendar, parsed by authoring
const calendar = z.enum(["gregory", "persian", "islamic-umalqura"]);
const instant = z.string().min(10).max(40).refine((s) => !Number.isNaN(Date.parse(s)), "invalid_instant");
const shortText = (max: number) => z.string().max(max);
const texts = z.record(locale, z.strictObject({ title: z.string().min(1).max(200), body: z.string().max(4000) }));
const noticeTexts = z.strictObject({ sourceLocale: locale, texts });
const translations = z.record(locale, z.string().max(1000));
const nullable = <T extends z.ZodType>(t: T) => t.nullable().optional();

const corePatch = z.strictObject({
  destinationId: nullable(uuid), tourType: z.enum(["single_day", "multi_day", "self_guided", "private_charter", "activity"]).optional(),
  categoryCodes: z.array(z.string().max(63)).max(20).optional(), tagCodes: z.array(z.string().max(63)).max(40).optional(),
  transportModes: z.array(z.string().max(63)).max(10).optional(), difficulty: nullable(z.enum(["easy", "moderate", "challenging", "strenuous"])),
  activityLevel: nullable(z.number().int().min(1).max(5)), durationMinutes: nullable(z.number().int().min(1).max(60 * 24 * 60)),
  durationDays: z.number().int().min(1).max(60).optional(), nights: z.number().int().min(0).max(60).optional(),
  minParticipants: z.number().int().min(1).max(10_000).optional(), maxParticipants: nullable(z.number().int().min(1).max(10_000)),
  minAge: nullable(z.number().int().min(0).max(120)), maxAge: nullable(z.number().int().min(0).max(120)),
  guideLanguages: z.array(z.string().regex(/^[a-z]{2,3}$/)).max(20).optional(), confirmationMode: z.enum(["instant", "request"]).optional(),
  requestTimeoutHours: z.number().int().min(1).max(168).optional(), bookingCutoffMinutes: z.number().int().min(0).max(60 * 24 * 30).optional(),
  timezone: z.string().max(64).optional(), meetingLat: nullable(z.number().min(-90).max(90)), meetingLng: nullable(z.number().min(-180).max(180)),
  endLat: nullable(z.number().min(-90).max(90)), endLng: nullable(z.number().min(-180).max(180)),
  locationPrivacy: z.enum(["exact", "approximate"]).optional(), approxRadiusM: z.number().int().min(100).max(50_000).optional(),
  pickupAvailable: z.boolean().optional(), privateAvailable: z.boolean().optional(), wheelchairAccessible: z.boolean().optional(),
  lowMobilityFriendly: z.boolean().optional(), familyFriendly: z.boolean().optional(), recoveryFriendly: z.boolean().optional(),
});

const stop = z.strictObject({
  id: uuid.optional(), day: z.number().int().min(1).max(60), position: z.number().int().min(1).max(200), type: z.enum(["meeting", "activity", "transfer", "accommodation", "meal", "recommendation", "finish"]),
  lat: nullable(z.number()), lng: nullable(z.number()), exact: z.boolean().optional(), startTime: nullable(z.string().max(5)),
  durationMinutes: nullable(z.number().int().min(0).max(10_000)), transportMode: nullable(z.string().max(30)),
  travelMinutesFromPrev: nullable(z.number().int().min(0).max(10_000)), distanceKmFromPrev: nullable(z.number().min(0).max(100_000)),
  imageUrl: nullable(z.string().max(1000)), included: z.boolean().optional(),
  text: z.strictObject({ title: shortText(200).optional(), description: shortText(5000).optional(), instructions: shortText(2000).optional() }).optional(),
});

const option = z.strictObject({
  code: z.string().max(41), kind: z.enum(["public", "private"]), pickupIncluded: z.boolean().optional(), guideLanguage: nullable(z.string().max(10)),
  minGroup: z.number().int().min(1).max(10_000).optional(), maxGroup: nullable(z.number().int().min(1).max(10_000)),
  privateGroupPrice: nullable(z.number().min(0)), isActive: z.boolean().optional(),
  tiers: z.array(z.strictObject({ travelerClass: z.string().max(10), amount: z.number().min(0), minAge: nullable(z.number().int().min(0).max(120)), maxAge: nullable(z.number().int().min(0).max(120)) })).max(5),
  label: shortText(200).optional(),
});

// ----------------------------------------------------------------------------
// Method table
// ----------------------------------------------------------------------------

type Method = { schema: z.ZodType; run: (actor: Actor, args: any) => Promise<unknown> };
const m = <S extends z.ZodType>(schema: S, run: (actor: Actor, args: z.infer<S>) => Promise<unknown>): Method => ({ schema, run });
const empty = z.strictObject({});
const ok = async (p: Promise<unknown>) => { await p; return {}; };

export const RPC_METHODS: Record<string, Method> = {
  "me.context": m(empty, (a) => meContext(a)),

  // Tours (authoring)
  "provider.tours": m(z.strictObject({ serviceProviderId: uuid, status: z.enum(["draft", "submitted", "approved", "published", "paused", "retired", "rejected"]).optional() }),
    (a, x) => listProviderTours(a, x.serviceProviderId, x.status)),
  "tour.create": m(z.strictObject({ serviceProviderId: uuid, slug: z.string().max(101), sourceLocale: locale, currency: z.string().max(10), title: z.string().min(1).max(200),
    tourType: z.enum(["single_day", "multi_day", "self_guided", "private_charter", "activity"]).optional(), timezone: z.string().max(64).optional(), destinationId: nullable(uuid) }),
    (a, x) => authoring.createTour(a, x)),
  "tour.get": m(z.strictObject({ tourId: uuid }), (a, x) => tourEditorBundle(a, x.tourId)),
  "tour.updateCore": m(z.strictObject({ tourId: uuid, patch: corePatch }), (a, x) => ok(authoring.updateTourCore(a, x.tourId, x.patch))),
  "tour.preview": m(z.strictObject({ tourId: uuid, locale, calendar: calendar.optional() }), async (a, x) => {
    await authoring.authorizeTour(a, x.tourId, "viewer");
    return getTourDetail(x.tourId, x.locale, { mode: "preview", revealExactLocation: true });
  }),
  "content.save": m(z.strictObject({ tourId: uuid, locale, entityType: z.enum(["tour", "stop", "option", "addon"]).optional(), entityId: uuid.optional(),
    fields: z.record(z.string().max(63), z.string().max(20_000).nullable()), submit: z.boolean().optional(), machineTranslated: z.boolean().optional() }),
    (a, x) => ok(authoring.saveContent(a, x.tourId, x))),
  "content.approve": m(z.strictObject({ tourId: uuid, locale, fieldKeys: z.array(z.string().max(63)).max(50).optional() }),
    (a, x) => ok(authoring.approveContent(a, x.tourId, x.locale, { fieldKeys: x.fieldKeys }))),
  "media.add": m(z.strictObject({ tourId: uuid, url: z.string().max(1000), kind: z.enum(["image", "video", "panorama"]).optional(), album: z.string().max(40).optional(),
    mimeType: z.string().max(60).optional(), byteSize: z.number().int().min(0).optional(), width: z.number().int().min(0).optional(), height: z.number().int().min(0).optional(),
    alt: translations.optional(), caption: translations.optional(), isCover: z.boolean().optional() }),
    (a, { tourId, ...rest }) => authoring.addMedia(a, tourId, rest)),
  "media.remove": m(z.strictObject({ tourId: uuid, mediaId: uuid }), (a, x) => ok(authoring.removeMedia(a, x.tourId, x.mediaId))),
  "media.reorder": m(z.strictObject({ tourId: uuid, orderedIds: z.array(uuid).max(200) }), (a, x) => ok(authoring.reorderMedia(a, x.tourId, x.orderedIds))),
  "itinerary.save": m(z.strictObject({ tourId: uuid, locale, stops: z.array(stop).max(200), changeSummary: shortText(500).optional() }), async (a, x) => {
    const r = await authoring.saveItinerary(a, x.tourId, x.locale, x.stops, x.changeSummary);
    // C-056 / V-021: a material change is announced to booked travelers.
    const notified = r.material ? await notifyItineraryChange(a, x.tourId, r.revision).catch((e) => { logUnexpected("rpc.notifyItineraryChange", e); return null; }) : null;
    return { ...r, notified: notified?.recipients ?? 0 };
  }),
  "options.save": m(z.strictObject({ tourId: uuid, locale, options: z.array(option).max(30) }), (a, x) => ok(authoring.saveOptions(a, x.tourId, x.locale, x.options))),
  "addons.save": m(z.strictObject({ tourId: uuid, locale, addons: z.array(z.strictObject({ code: z.string().max(41), pricing: z.enum(["per_person", "per_booking"]), amount: z.number().min(0),
    maxQty: z.number().int().min(1).max(100).optional(), isActive: z.boolean().optional(), label: shortText(200).optional() })).max(50) }),
    (a, x) => ok(authoring.saveAddons(a, x.tourId, x.locale, x.addons))),
  "policy.create": m(z.strictObject({ tourId: uuid, cancellationRules: z.array(z.strictObject({ hoursBefore: z.number().min(0).max(24 * 365), refundPercent: z.number().min(0).max(100) })).max(10),
    noShowRefundPercent: z.number().int().min(0).max(100).optional(), lateArrivalMinutes: nullable(z.number().int().min(0).max(1440)),
    weatherPolicy: z.enum(["reschedule_or_refund", "full_refund", "operator_decides", "no_refund"]).optional(),
    texts: z.record(locale, z.strictObject({ cancellation: shortText(5000).optional(), rules: shortText(5000).optional() })) }),
    (a, { tourId, ...rest }) => authoring.createPolicyVersion(a, tourId, rest)),
  "schedule.addRule": m(z.strictObject({ tourId: uuid, optionId: nullable(uuid), calendar, kind: z.enum(["once", "weekly", "monthly_day"]), weekdays: z.array(z.number().int().min(1).max(7)).max(7).optional(),
    monthDay: nullable(z.number().int().min(1).max(30)), localTime: z.string().max(5), startDate: calendarDate, endDate: nullable(calendarDate), capacity: z.number().int().min(1).max(10_000) }),
    (a, { tourId, ...rest }) => authoring.addScheduleRule(a, tourId, rest)),
  "schedule.materialize": m(z.strictObject({ tourId: uuid, horizonDays: z.number().int().min(1).max(730).optional() }), (a, x) => authoring.materializeDepartures(a, x.tourId, x.horizonDays)),
  "blackout.add": m(z.strictObject({ tourId: uuid, from: calendarDate, to: calendarDate, calendar, reason: shortText(300).optional() }), (a, { tourId, ...rest }) => authoring.addBlackout(a, tourId, rest)),
  "priceRule.add": m(z.strictObject({ tourId: uuid, optionId: nullable(uuid), from: calendarDate, to: calendarDate, calendar, kind: z.enum(["percent", "amount_delta"]), value: z.number(), note: shortText(300).optional() }),
    (a, { tourId, ...rest }) => authoring.addPriceRule(a, tourId, rest)),
  "tour.submit": m(z.strictObject({ tourId: uuid }), (a, x) => ok(authoring.submitForReview(a, x.tourId))),
  "tour.setVisibility": m(z.strictObject({ tourId: uuid, target: z.enum(["paused", "published", "retired"]) }), (a, x) => ok(authoring.setTourVisibility(a, x.tourId, x.target))),
  "tour.duplicate": m(z.strictObject({ tourId: uuid, newSlug: z.string().max(101) }), (a, x) => authoring.duplicateTour(a, x.tourId, x.newSlug)),

  // Departures and bookings
  "departures.list": m(z.strictObject({ tourId: uuid, from: isoDate.optional(), to: isoDate.optional() }), async (a, x) => {
    const owner = await authoring.authorizeTour(a, x.tourId, "viewer");
    return listProviderDepartures(a, owner.serviceProviderId, { tourId: x.tourId, from: x.from, to: x.to });
  }),
  "departure.update": m(z.strictObject({ departureId: uuid, capacity: z.number().int().optional(), block: z.boolean().optional(), minToOperate: nullable(z.number().int()),
    meetingOverride: z.strictObject({ lat: z.number(), lng: z.number(), note: nullable(shortText(500)) }).nullable().optional() }),
    (a, { departureId, ...patch }) => ok(updateDeparture(a, departureId, patch))),
  "departure.delay": m(z.strictObject({ departureId: uuid, minutes: z.number().int().min(1).max(1440), notice: noticeTexts }), (a, x) => delayDeparture(a, x.departureId, x.minutes, x.notice)),
  "departure.cancel": m(z.strictObject({ departureId: uuid, reasonCode: z.string().regex(/^[a-z0-9_]{2,60}$/), notice: noticeTexts }), (a, x) => cancelDeparture(a, x.departureId, x.reasonCode, x.notice)),
  "bookings.list": m(z.strictObject({ serviceProviderId: uuid, status: z.string().max(20).optional(), departureId: uuid.optional(), from: isoDate.optional(), to: isoDate.optional() }), (a, x) => listProviderBookings(a, x)),
  "booking.decide": m(z.strictObject({ bookingId: uuid, decision: z.enum(["accept", "decline"]), reason: shortText(300).optional() }), async (a, x) => ({ status: await decideBookingRequest(a, x.bookingId, x.decision, x.reason) })),

  // Day of the tour
  "manifest.get": m(z.strictObject({ departureId: uuid }), async (a, x) => ({ rows: await getManifest(a, x.departureId), summary: await checkinSummary(a, x.departureId) })),
  "checkin.scan": m(z.strictObject({ departureId: uuid, token: z.string().min(4).max(200), clientEventId: z.string().min(8).max(100), scannedAt: instant, deviceId: shortText(100).optional() }), (a, x) => scanTicket(a, x)),
  "checkin.sync": m(z.strictObject({ departureId: uuid, events: z.array(z.strictObject({ token: z.string().min(4).max(200), clientEventId: z.string().min(8).max(100), scannedAt: instant, deviceId: shortText(100).optional() })).max(500) }),
    (a, x) => syncCheckins(a, x.departureId, x.events)),
  "tracking.start": m(z.strictObject({ departureId: uuid }), (a, x) => startTracking(a, x.departureId)),
  "tracking.stop": m(z.strictObject({ departureId: uuid }), async (a, x) => ({ session: await stopTracking(a, x.departureId, "manual") })),
  "tracking.push": m(z.strictObject({ sessionId: uuid, points: z.array(z.strictObject({ seq: z.number().int().min(1), recordedAt: instant, latitude: z.number(), longitude: z.number(), accuracyM: nullable(z.number().min(0)) })).max(500) }),
    (a, x) => pushPoints(a, x.sessionId, x.points)),
  "live.get": m(z.strictObject({ departureId: uuid }), (a, x) => getLiveView(a, x.departureId)),
  "milestone.post": m(z.strictObject({ departureId: uuid, kind: z.enum(["departed", "arrived_stop", "delayed", "completed", "note"]), stopId: nullable(uuid), delayMinutes: nullable(z.number().int()), note: nullable(shortText(1000)) }),
    (a, x) => postMilestone(a, x)),
  "notice.send": m(z.strictObject({ departureId: uuid, kind: z.enum(["delay", "cancellation", "meeting_point_change", "pickup_update", "weather_hold", "route_substitution", "announcement", "safety", "itinerary_change", "guide_change"]),
    reasonCode: nullable(z.string().max(60)), effectiveAt: instant, sourceLocale: locale, texts }),
    async (a, x) => { const r = await sendNotice(a, x); return { noticeId: r.noticeId, recipients: r.recipients, fellBack: r.fellBack }; }),
  "incident.create": m(z.strictObject({ departureId: uuid, severity: z.enum(["low", "medium", "high", "critical"]), kind: z.string().max(60), description: z.string().min(1).max(4000) }), (a, x) => reportIncident(a, x)),
  "incidents.list": m(z.strictObject({ serviceProviderId: uuid.optional(), status: z.enum(["open", "escalated", "resolved"]).optional(), departureId: uuid.optional() }), (a, x) => listIncidents(a, x)),
  "incident.escalate": m(z.strictObject({ incidentId: uuid }), (a, x) => ok(escalateIncident(a, x.incidentId))),
  "incident.resolve": m(z.strictObject({ incidentId: uuid, resolution: z.string().min(1).max(4000) }), (a, x) => ok(resolveIncident(a, x.incidentId, x.resolution))),

  // Guides
  "guides.list": m(z.strictObject({ serviceProviderId: uuid }), (a, x) => listProviderGuides(a, x.serviceProviderId)),
  "guides.invite": m(z.strictObject({ serviceProviderId: uuid, guideUserId: uuid.optional(), phone: z.string().max(20).optional() }), (a, x) => inviteGuide(a, x.serviceProviderId, { guideUserId: x.guideUserId, phone: x.phone })),
  "guides.revoke": m(z.strictObject({ serviceProviderId: uuid, guideId: uuid }), (a, x) => revokeGuide(a, x.serviceProviderId, x.guideId)),
  "guide.bio.review": m(z.strictObject({ guideId: uuid, decision: z.enum(["approve", "reject"]), locales: z.array(locale).max(20).optional() }), (a, x) => reviewGuideBio(a, x.guideId, x.decision, x.locales)),
  "guide.invitation.respond": m(z.strictObject({ serviceProviderId: uuid, accept: z.boolean() }), (a, x) => respondToGuideInvitation(a, x.serviceProviderId, x.accept)),
  "assignment.create": m(z.strictObject({ departureId: uuid, guideId: uuid.optional(), resourceId: uuid.optional(), role: z.enum(["lead_guide", "guide", "driver", "vehicle", "equipment"]), overrideReason: nullable(shortText(500)) }),
    (a, x) => assignToDeparture(a, x)),
  "assignment.revoke": m(z.strictObject({ assignmentId: uuid }), (a, x) => ok(revokeAssignment(a, x.assignmentId))),
  "assignment.respond": m(z.strictObject({ assignmentId: uuid, decision: z.enum(["accepted", "declined"]) }), (a, x) => ok(respondToAssignment(a, x.assignmentId, x.decision))),
  "guide.profile.get": m(empty, (a) => getGuideProfile(a)),
  "guide.profile.save": m(z.strictObject({ displayName: z.string().max(80).optional(), photoUrl: nullable(z.string().max(1000)),
    languages: z.array(z.strictObject({ code: z.string().max(3), level: z.enum(["basic", "conversational", "fluent", "native"]) })).max(20).optional(),
    destinations: z.array(z.string().max(60)).max(30).optional(), specialties: z.array(z.string().max(60)).max(30).optional(),
    contactPolicy: z.enum(["via_platform", "phone_during_tour"]).optional(), publicPhone: nullable(z.string().max(20)), bios: z.record(locale, z.string().max(4000).nullable()).optional() }),
    (a, x) => saveGuideProfile(a, x)),
  "guide.schedule": m(z.strictObject({ from: isoDate.optional(), to: isoDate.optional() }), (a, x) => guideSchedule(a, x)),

  // Reviews, inquiries, reports
  "reviews.list": m(z.strictObject({ serviceProviderId: uuid }), (a, x) => listProviderReviews(a, x.serviceProviderId)),
  "review.reply": m(z.strictObject({ reviewId: uuid, reply: z.string().min(1).max(2000) }), (a, x) => ok(replyToReview(a, x.reviewId, x.reply))),
  "inquiries.list": m(z.strictObject({ serviceProviderId: uuid }), (a, x) => listProviderInquiries(a, x.serviceProviderId)),
  "inquiry.quote": m(z.strictObject({ inquiryId: uuid, amount: z.number().min(0), currency: z.string().max(10), expiresAt: instant, reply: nullable(shortText(2000)) }),
    (a, x) => ok(quoteInquiry(a, x.inquiryId, x))),
  "inquiry.decline": m(z.strictObject({ inquiryId: uuid, reply: nullable(shortText(2000)) }), (a, x) => ok(declineInquiry(a, x.inquiryId, x.reply))),
  "provider.analytics": m(z.strictObject({ serviceProviderId: uuid, from: isoDate, to: isoDate }), (a, x) => providerAnalytics(a, x.serviceProviderId, x)),
  "provider.payouts": m(z.strictObject({ serviceProviderId: uuid }), (a, x) => providerPayoutSummary(a, x.serviceProviderId)),
};

// ----------------------------------------------------------------------------
// Transport rules
// ----------------------------------------------------------------------------

export type RpcResponse = { status: number; body: { ok: true; data: unknown } | { ok: false; error: { kind: ToursErrorKind | "rate_limited"; code: string; details?: Record<string, unknown> } }; headers?: Record<string, string> };

const failure = (status: number, kind: ToursErrorKind | "rate_limited", code: string, details?: Record<string, unknown>): RpcResponse =>
  ({ status, body: { ok: false, error: details ? { kind, code, details } : { kind, code } } });

const digest = (s: string) => createHash("sha256").update(s, "utf8").digest();

/** Constant-time service-key check. A missing or short configured key disables the API (503). */
export function checkServiceKey(authorization: string | null, configured: string | undefined): RpcResponse | null {
  if (!configured || configured.length < 32) return failure(503, "infrastructure", "service_not_configured");
  const presented = /^Bearer\s+(.+)$/i.exec(authorization ?? "")?.[1]?.trim() ?? "";
  // Compare fixed-length digests so neither content nor length leaks through timing.
  if (!timingSafeEqual(digest(presented), digest(configured)) || presented.length === 0) return failure(401, "authentication", "invalid_service_key");
  return null;
}

/** Builds the Actor from the identity tables — never from anything the caller asserts. */
export async function resolveActingActor(userId: string | null): Promise<Actor | null> {
  if (!userId || !UUID_RE.test(userId)) return null;
  const rows = await db<{ id: string; role: string | null }[]>`
    select u.id::text, lower(coalesce(r.normalized_name, r.name)) as role
      from identity.asp_net_users u
      left join identity.asp_net_user_roles ur on ur.user_id = u.id
      left join identity.asp_net_roles r on r.id = ur.role_id
     where u.id = ${userId}::uuid`;
  if (rows.length === 0) return null;
  const roles = rows.map((r) => r.role).filter((r): r is string => Boolean(r));
  return { userId, roles, isAdmin: roles.includes("admin") || roles.includes("superadmin") };
}

const RATE_LIMIT = Number(process.env.TOURS_RPC_RATE_LIMIT_PER_MIN ?? 120);
const buckets = new Map<string, { start: number; count: number }>();

/** Fixed one-minute window per acting user (per process). */
export function rateLimited(userId: string, now = Date.now()): number | null {
  const b = buckets.get(userId);
  if (!b || now - b.start >= 60_000) {
    buckets.set(userId, { start: now, count: 1 });
    if (buckets.size > 10_000) for (const [k, v] of buckets) if (now - v.start >= 60_000) buckets.delete(k);
    return null;
  }
  b.count += 1;
  return b.count > RATE_LIMIT ? Math.ceil((b.start + 60_000 - now) / 1000) : null;
}
export function resetRateLimits() {
  buckets.clear();
}

export async function handleRpc(req: { method: string; authorization: string | null; actingUserId: string | null; requestId?: string | null; body: unknown; serviceKey?: string }): Promise<RpcResponse> {
  const started = Date.now();
  const keyFailure = checkServiceKey(req.authorization, req.serviceKey ?? process.env.TOURS_INTERNAL_API_KEY);
  if (keyFailure) return keyFailure;

  const method = Object.prototype.hasOwnProperty.call(RPC_METHODS, req.method) ? RPC_METHODS[req.method] : null;
  if (!method) return failure(404, "not_found", "unknown_method");

  let actor: Actor | null;
  try {
    actor = await resolveActingActor(req.actingUserId);
  } catch (e) {
    const err = mapDbError(e, "rpc.resolveActingActor");
    return failure(httpStatusFor[err.kind], err.kind, err.code);
  }
  if (!actor) return failure(401, "authentication", "invalid_acting_user");

  const retryAfter = rateLimited(actor.userId!);
  if (retryAfter !== null) return { ...failure(429, "rate_limited", "rate_limited"), headers: { "Retry-After": String(retryAfter) } };

  const envelope = z.strictObject({ args: z.unknown().optional() }).safeParse(req.body ?? {});
  if (!envelope.success) return failure(400, "validation", "invalid_body");
  const parsed = method.schema.safeParse(envelope.data.args ?? {});
  if (!parsed.success) {
    return failure(400, "validation", "invalid_args", {
      issues: parsed.error.issues.slice(0, 20).map((i) => ({ path: i.path.join("."), code: i.code, message: i.message })),
    });
  }

  try {
    const data = await method.run(actor, parsed.data);
    return { status: 200, body: { ok: true, data: data ?? {} } };
  } catch (e) {
    const err = e instanceof ToursError ? e : mapDbError(e, `rpc.${req.method}`);
    if (err.kind === "unexpected" || err.kind === "infrastructure") {
      console.error("[tours] rpc failed", { method: req.method, requestId: req.requestId ?? null, kind: err.kind, code: err.code, ms: Date.now() - started });
    }
    return failure(httpStatusFor[err.kind], err.kind, err.code, err.details);
  }
}
