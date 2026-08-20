import { NextRequest, NextResponse } from "next/server";

import {
  bulkDeleteMedia,
  createMedia,
  getMediaFileUrls,
  listMedia,
} from "@/components/media/server/repository";
import { deleteStoredObjects } from "@/components/media/server/storage-delete";
import { getSession } from "@/lib/auth/session";
import { CreateMediaInput, MediaListParams } from "@/components/media";
import { requireApiAdmin, requireApiUser } from "@/lib/auth/api-guard";


function toNumber(value: string | null, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireApiUser();
    if (auth instanceof NextResponse) return auth;

    const searchParams = request.nextUrl.searchParams;

    const params: MediaListParams = {
      page: toNumber(searchParams.get("page"), 1),
      pageSize: toNumber(searchParams.get("pageSize"), 24),
      search: searchParams.get("search") ?? undefined,
      mediaType: (searchParams.get("mediaType") as MediaListParams["mediaType"]) ?? "all",
      mimeType: searchParams.get("mimeType") ?? undefined,
      sort: (searchParams.get("sort") as MediaListParams["sort"]) ?? "newest",
      locale: searchParams.get("locale") ?? "fa",
    };

    const data = await listMedia(params);
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to list media.",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireApiUser();
    if (auth instanceof NextResponse) return auth;

    const body = (await request.json()) as CreateMediaInput;
    const created = await createMedia(body);
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to create media record.",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Destructive: drops media.media_library rows. The stored objects are NOT removed —
    // see deleteMedia in components/media/server/repository.ts for why, and for where the
    // fix belongs.
    const auth = await requireApiAdmin();
    if (auth instanceof NextResponse) return auth;

    const body = (await request.json()) as { ids?: string[] };
    const ids = Array.isArray(body.ids) ? body.ids : [];

    // Objects first, rows second, and per item: a store failure on one item must not take the
    // whole batch down, but the row for that item stays so it can be retried.
    const rows = await getMediaFileUrls(ids);
    const session = await getSession();
    const outcomes = await deleteStoredObjects(
      rows.map((row) => row.fileUrl),
      session?.user?.accessToken
    );

    const removableIds = rows
      .filter((_row, index) => {
        const outcome = outcomes[index];
        return !outcome?.error || outcome.skipped;
      })
      .map((row) => row.id);

    const deleted = await bulkDeleteMedia(removableIds);

    return NextResponse.json({
      deleted,
      objectsDeleted: outcomes.filter((outcome) => outcome.deleted).length,
      objectsSkipped: outcomes.filter((outcome) => outcome.skipped).length,
      failed: outcomes.filter((outcome) => outcome.error && !outcome.skipped).length,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to delete media.",
      },
      { status: 500 }
    );
  }
}
