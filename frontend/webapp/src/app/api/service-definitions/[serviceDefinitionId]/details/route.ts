import { NextRequest, NextResponse } from "next/server";

import { getServiceDefinitionById } from "@/features/service-definitions/api/server/get-service-definition-by-id";
import { localeToHeader } from "@/features/shared/utils/localization";
import { getSession } from "@/lib/auth/session";
import { LocaleTypes } from "@/types/common";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ serviceDefinitionId: string }> }
) {
  const { serviceDefinitionId } = await params;
  const { searchParams } = new URL(request.url);
  const locale = searchParams.get("locale");
  const localeHeader = localeToHeader(locale as LocaleTypes);
  const session = await getSession();
  const token = session?.user?.accessToken;

  const { data, error } = await getServiceDefinitionById(serviceDefinitionId, {
    locale: localeHeader,
    token,
  });

  if (error) {
    return NextResponse.json(error, { status: error.status });
  }

  return NextResponse.json(data);
}
