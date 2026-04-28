import { NextRequest, NextResponse } from "next/server";

import {
  createProviderReviewInDb,
  getProviderReviewsPageFromDb,
} from "@/features/service-providers/server/provider-page.repository";

type RouteContext = { params: Promise<{ providerId: string }> | { providerId: string } };

async function getParams(context: RouteContext) {
  return await context.params;
}

export async function GET(request: NextRequest, context: RouteContext) {
  const { providerId } = await getParams(context);
  const searchParams = request.nextUrl.searchParams;

  const result = await getProviderReviewsPageFromDb({
    providerId,
    offset: Number(searchParams.get("offset") || 0),
    limit: Number(searchParams.get("limit") || 10),
  });

  if (result.error || !result.data) {
    return NextResponse.json(result.error || { title: "Could not load provider reviews.", status: 500 }, { status: result.error?.status || 500 });
  }

  return NextResponse.json(result.data);
}

export async function POST(request: NextRequest, context: RouteContext) {
  const { providerId } = await getParams(context);
  const body = await request.json().catch(() => ({}));

  const result = await createProviderReviewInDb({
    providerId,
    userId: body.userId,
    rating: body.rating,
    title: body.title,
    treatment: body.treatment,
    comment: body.comment,
    imageUrls: body.imageUrls,
  });

  if (result.error || !result.data) {
    return NextResponse.json(result.error || { title: "Could not submit review.", status: 500 }, { status: result.error?.status || 500 });
  }

  return NextResponse.json(result.data, { status: 201 });
}
