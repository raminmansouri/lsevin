import { NextRequest, NextResponse } from "next/server";

import { getProviderTypeById } from "@/features/provider-types/api/server/get-provider-type-by-id";
import { localeToHeader } from "@/features/shared/utils/localization";
import { getSession } from "@/lib/auth/session";
import { LocaleTypes } from "@/types/common";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ providerTypeId: string }> }
) {
  const { providerTypeId } = await params;
  const { searchParams } = new URL(request.url);
  const locale = searchParams.get("locale");
  const localeHeader = localeToHeader(locale as LocaleTypes);
  const session = await getSession();
  const token = session?.user?.accessToken;

  const { data, error } = await getProviderTypeById(providerTypeId, {
    locale: localeHeader,
    token,
  });

  if (error) {
    return NextResponse.json(error, { status: error.status });
  }

  return NextResponse.json(data);
}
