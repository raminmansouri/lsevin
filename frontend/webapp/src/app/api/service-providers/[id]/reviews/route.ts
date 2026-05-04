import { NextRequest, NextResponse } from "next/server";

import {
  createProviderReviewInDb,
  getProviderReviewEligibilityInDb,
  getProviderReviewsPageFromDb,
  type ReviewSort,
  type ReviewTargetType,
} from "@/features/service-providers/server/provider-page.repository";
import { getUserId } from "@/lib/auth/session";

type RouteContext = { params: Promise<{ id: string }> | { id: string } };

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

export async function GET(request: NextRequest, context: RouteContext) {
  const { id: providerId } = await getParams(context);
  const searchParams = request.nextUrl.searchParams;

  if (searchParams.get("eligibility") === "1") {
    const userId = await getOptionalUserId();
    const result = await getProviderReviewEligibilityInDb({
      providerId,
      userId,
      targetType: searchParams.get("targetType") as ReviewTargetType | null,
      providerServiceId: searchParams.get("providerServiceId") || searchParams.get("serviceId"),
      staffId: searchParams.get("staffId") || searchParams.get("specialistId"),
    });

    if (result.error || !result.data) {
      return NextResponse.json(
        result.error || { title: "Could not check review eligibility.", status: 500 },
        { status: result.error?.status || 500 },
      );
    }

    return NextResponse.json(result.data);
  }

  const result = await getProviderReviewsPageFromDb({
    providerId,
    offset: Number(searchParams.get("offset") || 0),
    limit: Number(searchParams.get("limit") || 3),
    sort: searchParams.get("sort") as ReviewSort | null,
    targetType: searchParams.get("targetType") as ReviewTargetType | null,
    providerServiceId: searchParams.get("providerServiceId") || searchParams.get("serviceId"),
    staffId: searchParams.get("staffId") || searchParams.get("specialistId"),
  });

  if (result.error || !result.data) {
    return NextResponse.json(
      result.error || {
        title: "Could not load provider reviews.",
        status: 500,
      },
      { status: result.error?.status || 500 },
    );
  }

  return NextResponse.json(result.data);
}

export async function POST(request: NextRequest, context: RouteContext) {
  const { id: providerId } = await getParams(context);
  const body = await request.json().catch(() => ({}));
  const userId = await getOptionalUserId();

  const result = await createProviderReviewInDb({
    providerId,
    userId,
    rating: body.rating,
    title: body.title,
    treatment: body.treatment,
    comment: body.comment,
    imageUrls: body.imageUrls,
    pros: body.pros,
    cons: body.cons,
    targetType: body.targetType as ReviewTargetType | undefined,
    providerServiceId: body.providerServiceId || body.serviceId || null,
    staffId: body.staffId || body.specialistId || null,
  });

  if (result.error || !result.data) {
    return NextResponse.json(
      result.error || { title: "Could not submit review.", status: 500 },
      { status: result.error?.status || 500 },
    );
  }

  return NextResponse.json(result.data, { status: 201 });
}
