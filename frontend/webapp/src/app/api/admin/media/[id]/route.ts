import { UpdateMediaInput } from "@/components/media";
import { deleteMedia, getMediaById, updateMedia } from "@/components/media/server/repository";
import { NextRequest, NextResponse } from "next/server";
import { requireApiAdmin, requireApiUser } from "@/lib/auth/api-guard";
import { deleteStoredObject } from "@/components/media/server/storage-delete";
import { getSession } from "@/lib/auth/session";




export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireApiUser();
    if (auth instanceof NextResponse) return auth;

    const { id } = await context.params;
    const data = await getMediaById(id);

    if (!data) {
      return NextResponse.json({ error: "Media item not found." }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to get media.",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireApiUser();
    if (auth instanceof NextResponse) return auth;

    const { id } = await context.params;
    const body = (await request.json()) as UpdateMediaInput;

    const updated = await updateMedia(id, body);
    if (!updated) {
      return NextResponse.json({ error: "Media item not found." }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to update media.",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireApiAdmin();
    if (auth instanceof NextResponse) return auth;

    const { id } = await context.params;

    const existing = await getMediaById(id);
    if (!existing) {
      return NextResponse.json({ success: false }, { status: 404 });
    }

    // Remove the stored object before the row. The other order leaves a row pointing at
    // bytes that no longer exist — a visible break — whereas failing here changes nothing
    // and the caller can simply try again.
    const session = await getSession();
    const outcome = await deleteStoredObject(existing.fileUrl, session?.user?.accessToken);

    if (outcome.error && !outcome.skipped) {
      return NextResponse.json(
        { error: `The stored file could not be deleted: ${outcome.error}` },
        { status: 502 }
      );
    }

    const success = await deleteMedia(id);

    return NextResponse.json({
      success,
      objectDeleted: outcome.deleted,
      objectSkipped: outcome.skipped,
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
