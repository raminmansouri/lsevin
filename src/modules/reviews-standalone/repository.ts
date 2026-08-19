import "server-only";
import { sql } from "@core/db/client";

export type ModuleRecord = { id: string; status?: string | null; type?: string | null; createdAt?: string | null };
export type ReviewItem = {
  id: string;
  targetType: string;
  targetId: string;
  serviceProviderId: string | null;
  customerName: string;
  rating: number | null;
  body: string;
  locale: string;
  status: string;
  isVerified: boolean;
  repliesCount: number;
  approvedRepliesCount: number;
  createdAt: string;
};
export type ReviewReplyItem = {
  id: string;
  reviewId: string;
  authorEntityType: string;
  authorEntityId: string | null;
  body: string;
  status: string;
  decisionReason: string | null;
  createdAt: string;
};

export async function getModuleSummary(providerId?: string) {
  const reviews = await listReviews({ providerId, limit: 100 });
  const averageRating = reviews.length ? reviews.reduce((sum, item) => sum + Number(item.rating ?? 0), 0) / reviews.length : 0;
  return {
    recordCount: reviews.length,
    providerId: providerId ?? null,
    reviewsCount: reviews.length,
    pendingCount: reviews.filter((review) => review.status === "pending").length,
    repliedCount: reviews.filter((review) => review.repliesCount > 0).length,
    averageRating: averageRating.toFixed(1),
  };
}

export async function listRecentRecords(providerId?: string): Promise<ModuleRecord[]> {
  try {
    if (providerId) {
      return sql<ModuleRecord[]>`
        select id::text as id, status, target_type as type, created_at::text as "createdAt"
        from reviews.reviews
        where service_provider_id = ${providerId}::uuid or target_id = ${providerId}::uuid
        order by created_at desc
        limit 10
      `;
    }
    return sql<ModuleRecord[]>`
      select id::text as id, status, target_type as type, created_at::text as "createdAt"
      from reviews.reviews
      order by created_at desc
      limit 10
    `;
  } catch {
    return [];
  }
}

export async function listReviews(input: { providerId?: string; status?: string; limit?: number } = {}): Promise<ReviewItem[]> {
  const limit = input.limit ?? 50;
  try {
    if (input.providerId) {
      return sql<ReviewItem[]>`
        select ${reviewSelectFragment()}
        from reviews.reviews r
        left join lateral (
          select count(*)::int as replies_count, count(*) filter (where status = 'approved')::int as approved_replies_count
          from reviews.review_replies rr where rr.review_id = r.id
        ) replies on true
        where (r.service_provider_id = ${input.providerId}::uuid or r.target_id = ${input.providerId}::uuid)
          and (${input.status || ""} = '' or r.status = ${input.status || ""})
        order by r.created_at desc
        limit ${limit}
      `;
    }
    return sql<ReviewItem[]>`
      select ${reviewSelectFragment()}
      from reviews.reviews r
      left join lateral (
        select count(*)::int as replies_count, count(*) filter (where status = 'approved')::int as approved_replies_count
        from reviews.review_replies rr where rr.review_id = r.id
      ) replies on true
      where (${input.status || ""} = '' or r.status = ${input.status || ""})
      order by r.created_at desc
      limit ${limit}
    `;
  } catch {
    return [];
  }
}

function reviewSelectFragment() {
  return sql`
    r.id::text as id,
    r.target_type as "targetType",
    r.target_id::text as "targetId",
    r.service_provider_id::text as "serviceProviderId",
    r.customer_name as "customerName",
    r.rating::int as rating,
    r.body,
    r.locale,
    r.status,
    r.is_verified as "isVerified",
    coalesce(replies.replies_count, 0)::int as "repliesCount",
    coalesce(replies.approved_replies_count, 0)::int as "approvedRepliesCount",
    r.created_at::text as "createdAt"
  `;
}

export async function listReplies(reviewId?: string, limit = 50): Promise<ReviewReplyItem[]> {
  try {
    if (reviewId) {
      return sql<ReviewReplyItem[]>`
        select ${replySelectFragment()}
        from reviews.review_replies rr
        where rr.review_id = ${reviewId}::uuid
        order by rr.created_at desc
        limit ${limit}
      `;
    }
    return sql<ReviewReplyItem[]>`
      select ${replySelectFragment()}
      from reviews.review_replies rr
      order by rr.created_at desc
      limit ${limit}
    `;
  } catch {
    return [];
  }
}

function replySelectFragment() {
  return sql`
    rr.id::text as id,
    rr.review_id::text as "reviewId",
    rr.author_entity_type as "authorEntityType",
    rr.author_entity_id::text as "authorEntityId",
    rr.body,
    rr.status,
    rr.decision_reason as "decisionReason",
    rr.created_at::text as "createdAt"
  `;
}

export async function replyToReview(input: { reviewId: string; providerId: string; body: string; authorUserId: string }) {
  const rows = await sql<{ id: string }[]>`
    insert into reviews.review_replies(review_id, author_entity_type, author_entity_id, body, status, created_by_user_id)
    values (${input.reviewId}::uuid, 'provider', ${input.providerId}::uuid, ${input.body}, 'pending', ${input.authorUserId}::uuid)
    returning id::text
  `;
  return rows[0].id;
}

export async function moderateReview(input: { reviewId: string; decision: "approved" | "rejected" | "hidden"; reviewerUserId: string; reason?: string }) {
  await sql`
    update reviews.reviews
    set status = ${input.decision}, updated_at = now(), metadata = coalesce(metadata, '{}'::jsonb) || ${sql.json({ reviewedByUserId: input.reviewerUserId, reviewedAt: new Date().toISOString(), decisionReason: input.reason || null })}
    where id = ${input.reviewId}::uuid
  `;
}

export async function moderateReply(input: { replyId: string; decision: "approved" | "rejected" | "hidden"; reviewerUserId: string; reason?: string }) {
  await sql`
    update reviews.review_replies
    set status = ${input.decision}, reviewed_by_user_id = ${input.reviewerUserId}::uuid, reviewed_at = now(), decision_reason = nullif(${input.reason || ""}, ''), updated_at = now()
    where id = ${input.replyId}::uuid
  `;
}
