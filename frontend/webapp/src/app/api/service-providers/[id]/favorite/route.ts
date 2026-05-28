import { NextRequest, NextResponse } from "next/server";

import { setProviderFavoriteInDb } from "@/features/service-providers/server/provider-page.repository";

type RouteContext = { params: Promise<{ providerId: string }> | { providerId: string } };

async function getParams(context: RouteContext) {
  return await context.params;
}

async function readUserId(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  return body.userId || request.nextUrl.searchParams.get("userId");
}

export async function POST(request: NextRequest, context: RouteContext) {
  const { providerId } = await getParams(context);
  const userId = await readUserId(request);
  const result = await setProviderFavoriteInDb({ providerId, userId, isFavorite: true });

  if (result.error || !result.data) {
    return NextResponse.json(result.error || { title: "Could not save favorite.", status: 500 }, { status: result.error?.status || 500 });
  }

  return NextResponse.json(result.data);
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const { providerId } = await getParams(context);
  const userId = await readUserId(request);
  const result = await setProviderFavoriteInDb({ providerId, userId, isFavorite: false });

  if (result.error || !result.data) {
    return NextResponse.json(result.error || { title: "Could not remove favorite.", status: 500 }, { status: result.error?.status || 500 });
  }

  return NextResponse.json(result.data);
}
