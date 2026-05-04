import { createHash } from "crypto";
import { NextRequest, NextResponse } from "next/server";

import sql from "@/config/database/db";
import { getUserId } from "@/lib/auth/session";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
type RouteContext = { params: Promise<{ id: string; reviewId: string }> | { id: string; reviewId: string } };
async function getParams(context: RouteContext) { return await context.params; }
async function getOptionalUserId() { try { return (await getUserId({ redirectToLogin: false })) || null; } catch { return null; } }
function hashVoteKey(value: string) { return createHash("sha256").update(value).digest("hex"); }
function buildAnonymousVoteKey(request: NextRequest) { const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim(); const realIp = request.headers.get("x-real-ip")?.trim(); const ip = forwardedFor || realIp || "unknown-ip"; const userAgent = request.headers.get("user-agent") || "unknown-agent"; return `anon:${hashVoteKey(`${ip}|${userAgent}`)}`; }

export async function POST(request: NextRequest, context: RouteContext) {
  const { id: providerId, reviewId } = await getParams(context);
  if (!UUID_PATTERN.test(providerId) || !UUID_PATTERN.test(reviewId)) return NextResponse.json({ title: "A valid provider and review id are required." }, { status: 400 });
  const body = await request.json().catch(() => ({}));
  const voteValue = body.vote === "dislike" ? -1 : body.vote === "like" ? 1 : 0;
  if (voteValue !== 1 && voteValue !== -1) return NextResponse.json({ title: "Vote must be like or dislike." }, { status: 400 });
  const userId = await getOptionalUserId();
  const voterKey = userId ? `user:${userId}` : buildAnonymousVoteKey(request);
  try {
    const rows = await sql<{ helpfulCount: number | string; notHelpfulCount: number | string; userVote: number | string }[]>`
      with target_review as (
        select c.id
        from category.service_provider_comments c
        where c.id = ${reviewId}::uuid
          and c.service_provider_id = ${providerId}::uuid
          and c.is_public = true
          and coalesce(c.moderation_status, case when c.is_public then 'approved' else 'pending' end) = 'approved'
        limit 1
      ), upsert_vote as (
        insert into category.service_provider_comment_votes (id, review_id, voter_key, vote, create_date, last_modified_date)
        select public.uuid_generate_v4(), target_review.id, ${voterKey}, ${voteValue}, now(), now()
        from target_review
        on conflict (review_id, voter_key)
        do update set vote = excluded.vote, last_modified_date = now()
        returning review_id, vote
      ), refreshed_counts as (
        update category.service_provider_comments c
        set helpful_count = coalesce((select count(*)::int from category.service_provider_comment_votes v where v.review_id = c.id and v.vote = 1), 0),
            not_helpful_count = coalesce((select count(*)::int from category.service_provider_comment_votes v where v.review_id = c.id and v.vote = -1), 0),
            last_modified_date = now()
        where c.id = ${reviewId}::uuid and exists (select 1 from upsert_vote)
        returning c.helpful_count::int as "helpfulCount", c.not_helpful_count::int as "notHelpfulCount"
      )
      select refreshed_counts."helpfulCount", refreshed_counts."notHelpfulCount", (select vote from upsert_vote limit 1)::int as "userVote"
      from refreshed_counts
    `;
    const row = rows[0];
    if (!row) return NextResponse.json({ title: "Review was not found or is not public." }, { status: 404 });
    return NextResponse.json({ helpfulCount: Number(row.helpfulCount || 0), notHelpfulCount: Number(row.notHelpfulCount || 0), userVote: Number(row.userVote || 0) === -1 ? "dislike" : "like" });
  } catch (error) {
    return NextResponse.json({ title: "Could not save review vote.", detail: error instanceof Error ? error.message : undefined }, { status: 500 });
  }
}
