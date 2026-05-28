import { NextRequest, NextResponse } from "next/server";

import db from "@/config/database/db";
import { localeToHeader } from "@/config/locales";
import { getStaff } from "@/features/staff/api/server/get-staff";
import { getSession } from "@/lib/auth/session";
import { LocaleTypes } from "@/types/common";
import { DEFAULT_PAGE_NUMBER, DEFAULT_PAGE_SIZE } from "@/types/filter";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type StaffSearchItemWithImage = {
  profileImageUrl?: string | null;
  profile_image_url?: string | null;
};

type MediaImageRow = {
  id: string;
  file_url: string;
};

async function resolveStaffSearchImageUrls<T extends StaffSearchItemWithImage>(items?: T[]) {
  if (!items?.length) return;

  const mediaIds = Array.from(
    new Set(
      items
        .map((item) => item.profileImageUrl ?? item.profile_image_url ?? null)
        .map((value) => value?.trim())
        .filter((value): value is string => Boolean(value && UUID_RE.test(value)))
    )
  );

  if (!mediaIds.length) return;

  const rows = await db<MediaImageRow[]>`
    select id::text, file_url
    from media.media_library
    where id::text = any(${mediaIds}::text[])
      and nullif(btrim(file_url), '') is not null
  `;

  const mediaUrlById = new Map(rows.map((row) => [row.id, row.file_url]));

  for (const item of items) {
    const current = (item.profileImageUrl ?? item.profile_image_url ?? null)?.trim();
    if (!current || !UUID_RE.test(current)) continue;

    const resolvedUrl = mediaUrlById.get(current);
    if (!resolvedUrl) continue;

    if ("profileImageUrl" in item) item.profileImageUrl = resolvedUrl;
    if ("profile_image_url" in item) item.profile_image_url = resolvedUrl;
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("Search") || searchParams.get("search") || searchParams.get("q") || "";
  const page = searchParams.get("PageNumber") || searchParams.get("page");
  const pageSize = searchParams.get("PageSize") || searchParams.get("pageSize");
  const locale = searchParams.get("Locale") || searchParams.get("locale") || "en";
  const localeHeader = localeToHeader(locale as LocaleTypes) || locale;
  const session = await getSession();
  const token = session?.user?.accessToken;

  const { data, error } = await getStaff(
    { locale: localeHeader, token },
    {
      filters: search,
      startDate: "",
      endDate: "",
      pageNumber: page ? parseInt(page, 10) : DEFAULT_PAGE_NUMBER,
      pageSize: pageSize ? parseInt(pageSize, 10) : DEFAULT_PAGE_SIZE,
      sortOrder: "",
    }
  );

  if (error) {
    return NextResponse.json(error, { status: error.status });
  }

  await resolveStaffSearchImageUrls(data?.items as StaffSearchItemWithImage[] | undefined);

  return NextResponse.json(data);
}
