import { NextRequest, NextResponse } from "next/server";

import { createProviderReviewReplyInDb } from "@/features/service-providers/server/provider-page.repository";
import { getUserId } from "@/lib/auth/session";

type RouteContext = {
  params:
    | Promise<{ id: string; reviewId: string }>
    | { id: string; reviewId: string };
};

async function getParams(context: RouteContext) {
  return await context.params;
}

async function getOptionalUserId() {
  try {
    return (await getUserId({ redirectToLogin: false })) || null;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  const { id: providerId, reviewId } = await getParams(context);
  const body = await request.json().catch(() => ({}));
  const userId = await getOptionalUserId();

  const result = await createProviderReviewReplyInDb({
    providerId,
    reviewId,
    userId,
    replyText: body.replyText || body.comment || body.text || "",
  });

  if (result.error || !result.data) {
    return NextResponse.json(
      result.error || { title: "Could not submit review reply.", status: 500 },
      { status: result.error?.status || 500 },
    );
  }

  return NextResponse.json(result.data, { status: 201 });
}
