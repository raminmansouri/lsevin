import "server-only";

import db from "@/config/database/db";

import { fail, mapDbError } from "../platform/errors";
import { requireProviderRole, type Actor } from "../platform/roles";

import type { ReviewInput } from "./contract";
import { auditOps, iso, requireUuid, scopeFor, type Tx } from "./common";

/**
 * Reviews (C-047, C-108, C-120, V-024, V-056, M-034). Only the traveler of a
 * completed (or past, confirmed) booking may review it, once. Reviews and
 * provider replies are moderated; the tour's rating counts published reviews
 * only and is recomputed whenever a review's moderation status changes.
 */

const LOCALE_RE = /^[a-z]{2,3}(-[A-Za-z]{4})?(-([A-Z]{2}|[0-9]{3}))?$/;

async function refreshRating(q: Tx, tourId: string) {
  await q`
    update tour.tours t
       set rating_avg = s.avg, review_count = s.n, updated_at = now()
      from (select round(avg(rating)::numeric, 2) as avg, count(*)::int as n from tour.reviews where tour_id = ${tourId}::uuid and status = 'published') s
     where t.id = ${tourId}::uuid`;
}

export async function submitReview(userId: string, input: ReviewInput): Promise<{ id: string; status: "pending" }> {
  if (!userId) throw fail.auth();
  requireUuid(input.bookingId, "booking_not_found");
  if (!Number.isInteger(input.rating) || input.rating < 1 || input.rating > 5) throw fail.validation("invalid_rating");
  if (input.guideRating != null && (!Number.isInteger(input.guideRating) || input.guideRating < 1 || input.guideRating > 5)) throw fail.validation("invalid_guide_rating");
  const body = String(input.body ?? "").trim();
  if (body.length > 4000) throw fail.validation("review_too_long");
  if (!LOCALE_RE.test(String(input.locale ?? ""))) throw fail.validation("invalid_locale");
  const [b] = await db<any[]>`
    select tb.tour_id::text, tb.status, tb.service_provider_id::text, coalesce(d.ends_at, d.starts_at) as ended
      from tour.bookings tb join tour.departures d on d.id = tb.departure_id
     where tb.booking_id = ${input.bookingId}::uuid and tb.user_id = ${userId}::uuid`;
  if (!b) throw fail.notFound("booking_not_found");
  const eligible = b.status === "completed" || (b.status === "confirmed" && new Date(b.ended).getTime() < Date.now());
  if (!eligible) throw fail.conflict("review_not_eligible");
  try {
    return await db.begin(async (tx) => {
      const [r] = await tx<any[]>`
        insert into tour.reviews (booking_id, tour_id, user_id, rating, guide_rating, body, locale)
        values (${input.bookingId}::uuid, ${b.tour_id}::uuid, ${userId}::uuid, ${input.rating}, ${input.guideRating ?? null}, ${body}, ${input.locale})
        returning id::text`;
      await auditOps(tx as unknown as Tx, { userId }, "customer", b.service_provider_id, "review", r.id, "review_submitted", { rating: input.rating });
      return { id: r.id as string, status: "pending" as const };
    });
  } catch (e) {
    const mapped = mapDbError(e, "submitReview");
    if (mapped.code === "duplicate") throw fail.conflict("review_exists");
    throw mapped;
  }
}

export async function reportReview(userId: string, reviewId: string, reason: string): Promise<{ id: string }> {
  if (!userId) throw fail.auth();
  requireUuid(reviewId, "review_not_found");
  const text = String(reason ?? "").trim();
  if (text.length < 3 || text.length > 500) throw fail.validation("invalid_reason");
  const [rv] = await db<any[]>`select status from tour.reviews where id = ${reviewId}::uuid`;
  if (!rv || rv.status !== "published") throw fail.notFound("review_not_found");
  try {
    return await db.begin(async (tx) => {
      const [r] = await tx<any[]>`insert into tour.review_reports (review_id, reporter_id, reason) values (${reviewId}::uuid, ${userId}::uuid, ${text}) returning id::text`;
      await auditOps(tx as unknown as Tx, { userId }, "customer", null, "review", reviewId, "review_reported", {});
      return { id: r.id as string };
    });
  } catch (e) {
    const mapped = mapDbError(e, "reportReview");
    if (mapped.code === "duplicate") throw fail.conflict("already_reported");
    throw mapped;
  }
}

async function reviewOwner(reviewId: string) {
  requireUuid(reviewId, "review_not_found");
  const [r] = await db<any[]>`select r.tour_id::text, r.status, t.service_provider_id::text from tour.reviews r join tour.tours t on t.id = r.tour_id where r.id = ${reviewId}::uuid`;
  if (!r) throw fail.notFound("review_not_found");
  return r as { tour_id: string; status: string; service_provider_id: string };
}

export async function replyToReview(actor: Actor, reviewId: string, reply: string): Promise<void> {
  const r = await reviewOwner(reviewId);
  await requireProviderRole(actor, r.service_provider_id, "staff");
  const text = String(reply ?? "").trim();
  if (text.length < 1 || text.length > 2000) throw fail.validation("invalid_reply");
  if (r.status !== "published") throw fail.conflict("review_not_published");
  await db.begin(async (tx) => {
    await tx`update tour.reviews set provider_reply = ${text}, reply_status = 'pending', reply_at = now() where id = ${reviewId}::uuid`;
    await auditOps(tx as unknown as Tx, actor, scopeFor(actor, r.service_provider_id), r.service_provider_id, "review", reviewId, "review_replied", {});
  });
}

export async function moderateReview(actor: Actor, reviewId: string, decision: "published" | "rejected" | "hidden", note?: string | null): Promise<void> {
  if (!actor.isAdmin) throw fail.forbidden("admin_required");
  if (!["published", "rejected", "hidden"].includes(decision)) throw fail.validation("invalid_decision");
  const r = await reviewOwner(reviewId);
  await db.begin(async (tx) => {
    await tx`update tour.reviews set status = ${decision}, moderation_note = ${note ? String(note).slice(0, 1000) : null} where id = ${reviewId}::uuid`;
    await refreshRating(tx as unknown as Tx, r.tour_id);
    if (decision !== "published") await tx`update tour.review_reports set status = 'upheld' where review_id = ${reviewId}::uuid and status = 'open'`;
    else await tx`update tour.review_reports set status = 'dismissed' where review_id = ${reviewId}::uuid and status = 'open'`;
    await auditOps(tx as unknown as Tx, actor, "admin", r.service_provider_id, "review", reviewId, `review_${decision}`, { note: note ?? null });
  });
}

export async function moderateReply(actor: Actor, reviewId: string, decision: "published" | "rejected", note?: string | null): Promise<void> {
  if (!actor.isAdmin) throw fail.forbidden("admin_required");
  if (!["published", "rejected"].includes(decision)) throw fail.validation("invalid_decision");
  const r = await reviewOwner(reviewId);
  await db.begin(async (tx) => {
    const u = await tx`update tour.reviews set reply_status = ${decision} where id = ${reviewId}::uuid and provider_reply is not null returning id`;
    if (u.length === 0) throw fail.conflict("no_reply");
    await auditOps(tx as unknown as Tx, actor, "admin", r.service_provider_id, "review", reviewId, `reply_${decision}`, { note: note ?? null });
  });
}

export async function listProviderReviews(actor: Actor, serviceProviderId: string) {
  requireUuid(serviceProviderId, "provider_not_found");
  await requireProviderRole(actor, serviceProviderId, "staff");
  const rows = await db<any[]>`
    select r.id::text, r.tour_id::text, r.rating, r.guide_rating, r.body, r.locale, r.status, r.provider_reply, r.reply_status, r.reply_at, r.created_at,
           (select coalesce(c.published_value, c.draft_value) from tour.content c
             where c.entity_type = 'tour' and c.entity_id = t.id and c.field_key = 'title' and c.locale = t.source_locale) as title,
           (select count(*)::int from tour.review_reports rr where rr.review_id = r.id and rr.status = 'open') as reports
      from tour.reviews r join tour.tours t on t.id = r.tour_id
     where t.service_provider_id = ${serviceProviderId}::uuid
     order by r.created_at desc limit 300`;
  return rows.map((r) => ({
    id: r.id, tourId: r.tour_id, tourTitle: r.title ?? null, rating: r.rating, guideRating: r.guide_rating, body: r.body, locale: r.locale,
    status: r.status, providerReply: r.provider_reply, replyStatus: r.reply_status, replyAt: iso(r.reply_at), createdAt: iso(r.created_at)!, openReports: r.reports,
  }));
}

/** Admin moderation queue. */
export async function listReviewsForModeration(actor: Actor, status: "pending" | "reported" = "pending") {
  if (!actor.isAdmin) throw fail.forbidden("admin_required");
  const rows = await db<any[]>`
    select r.id::text, r.tour_id::text, r.rating, r.body, r.locale, r.status, r.provider_reply, r.reply_status, r.created_at,
           (select count(*)::int from tour.review_reports rr where rr.review_id = r.id and rr.status = 'open') as reports
      from tour.reviews r
     where ${status === "pending" ? db`r.status = 'pending' or r.reply_status = 'pending'` : db`exists (select 1 from tour.review_reports rr where rr.review_id = r.id and rr.status = 'open')`}
     order by r.created_at limit 200`;
  return rows.map((r) => ({ id: r.id, tourId: r.tour_id, rating: r.rating, body: r.body, locale: r.locale, status: r.status, providerReply: r.provider_reply, replyStatus: r.reply_status, createdAt: iso(r.created_at)!, openReports: r.reports }));
}
