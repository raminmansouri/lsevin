import "server-only";
import { sql } from "@core/db/client";
import { translationSql } from "@core/db/translations";
import type { ProviderReview } from "./types";

export async function listProviderReviews(providerId: string, locale = process.env.NEXT_PUBLIC_DEFAULT_LOCALE || "fa-IR") {
  return sql<ProviderReview[]>`
    select
      c.id::text,
      c.customer_name as "customerName",
      c.comment_text as "commentText",
      c.rating,
      c.is_public as "isPublic",
      c.is_verified as "isVerified",
      c.moderation_status as "moderationStatus",
      c.create_date::text as "createdAt",
      c.treatment,
      ${translationSql(sql`ps.display_name_translations`, locale)} as "providerServiceName",
      coalesce(r.count, 0)::int as "repliesCount"
    from category.service_provider_comments c
    left join category.provider_services ps on ps.id = c.provider_service_id
    left join lateral (select count(*) from category.service_provider_comment_replies rr where rr.review_id = c.id) r on true
    where c.service_provider_id = ${providerId}::uuid
    order by c.create_date desc
    limit 100
  `;
}

export async function listStaffReviews(staffId: string, providerId: string, locale = process.env.NEXT_PUBLIC_DEFAULT_LOCALE || "fa-IR") {
  return sql<ProviderReview[]>`
    select
      c.id::text,
      c.customer_name as "customerName",
      c.comment_text as "commentText",
      c.rating,
      c.is_public as "isPublic",
      c.is_verified as "isVerified",
      c.moderation_status as "moderationStatus",
      c.create_date::text as "createdAt",
      c.treatment,
      ${translationSql(sql`ps.display_name_translations`, locale)} as "providerServiceName",
      coalesce(r.count, 0)::int as "repliesCount"
    from category.service_provider_comments c
    left join category.provider_services ps on ps.id = c.provider_service_id
    left join lateral (select count(*) from category.service_provider_comment_replies rr where rr.review_id = c.id) r on true
    where c.service_provider_id = ${providerId}::uuid and c.staff_id = ${staffId}::uuid
    order by c.create_date desc
    limit 100
  `;
}

export async function createProviderReviewReply(input: { providerId: string; reviewId: string; userId: string; authorName: string; replyText: string }) {
  await sql`
    insert into category.service_provider_comment_replies (
      id, review_id, service_provider_id, author_user_id, author_name, author_role, reply_text,
      is_public, moderation_status, created_by_admin, is_verified, create_date, last_modified_date
    )
    select public.uuid_generate_v4(), ${input.reviewId}::uuid, ${input.providerId}::uuid, ${input.userId}::uuid, ${input.authorName}, 'provider', ${input.replyText},
      false, 'pending', false, true, now(), now()
    where exists (select 1 from category.service_provider_comments where id = ${input.reviewId}::uuid and service_provider_id = ${input.providerId}::uuid)
  `;
}

export async function createStaffReviewReply(input: { providerId: string; staffId: string; reviewId: string; userId: string; authorName: string; replyText: string }) {
  const result = await sql`
    insert into category.service_provider_comment_replies (
      id, review_id, service_provider_id, author_user_id, author_name, author_role, reply_text,
      is_public, moderation_status, created_by_admin, is_verified, create_date, last_modified_date
    )
    select public.uuid_generate_v4(), c.id, ${input.providerId}::uuid, ${input.userId}::uuid, ${input.authorName}, 'staff', ${input.replyText},
      false, 'pending', false, true, now(), now()
    from category.service_provider_comments c
    where c.id = ${input.reviewId}::uuid
      and c.service_provider_id = ${input.providerId}::uuid
      and c.staff_id = ${input.staffId}::uuid
  `;
  if (result.count === 0) throw new Error("The review is not assigned to this staff profile.");
}

export type PendingReviewReply = { id:string; reviewId:string; authorRole:string; authorName:string; customerName:string; replyText:string; createdAt:string };
export async function listPendingReviewReplies(limit=100):Promise<PendingReviewReply[]> {
  return sql<PendingReviewReply[]>`
    select r.id::text id, r.review_id::text "reviewId", r.author_role "authorRole", coalesce(r.author_name,r.author_role) "authorName",
      coalesce(c.customer_name,'Customer') "customerName", r.reply_text "replyText", r.create_date::text "createdAt"
    from category.service_provider_comment_replies r
    join category.service_provider_comments c on c.id=r.review_id
    where r.author_role in ('provider','staff') and r.moderation_status='pending'
    order by r.create_date asc limit ${limit}
  `;
}
export type ReviewReportItem = { id:string; reviewId:string; reporterRole:string; reasonCategory:string; note:string|null; commentText:string; createdAt:string };
export async function listReviewReports(limit=100):Promise<ReviewReportItem[]> {
  return sql<ReviewReportItem[]>`
    select rr.id::text id, rr.review_id::text "reviewId", rr.reporter_role "reporterRole", rr.reason_category "reasonCategory", rr.note,
      coalesce(c.comment_text,'') "commentText", rr.created_at::text "createdAt"
    from provider_reviews.review_reports rr join category.service_provider_comments c on c.id=rr.review_id
    where rr.status in ('pending','reviewed') order by rr.created_at asc limit ${limit}
  `;
}
export type ModeratedReviewReply = { reviewId: string; providerId: string; staffId: string | null; authorRole: "provider" | "staff" };
export async function moderateReviewReply(input:{replyId:string;status:'approved'|'rejected';reviewedByUserId:string}) {
  const rows = await sql<ModeratedReviewReply[]>`
    update category.service_provider_comment_replies r
    set moderation_status=${input.status}, reviewed_by_user_id=${input.reviewedByUserId}::uuid, reviewed_at=now(), last_modified_date=now()
    from category.service_provider_comments c
    where r.id=${input.replyId}::uuid and r.review_id=c.id and r.author_role in ('provider','staff') and r.moderation_status='pending'
    returning r.review_id::text as "reviewId", r.service_provider_id::text as "providerId", c.staff_id::text as "staffId", r.author_role as "authorRole"
  `;
  return rows[0] ?? null;
}
export async function moderateReviewReport(input:{reportId:string;status:'actioned'|'dismissed';reviewedByUserId:string;note?:string}) {
  await sql`update provider_reviews.review_reports set status=${input.status}, reviewed_by_user_id=${input.reviewedByUserId}::uuid, review_note=nullif(${input.note||''},''), updated_at=now() where id=${input.reportId}::uuid and status in ('pending','reviewed')`;
}
