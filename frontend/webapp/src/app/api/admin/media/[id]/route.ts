import { UpdateMediaInput } from "@/components/media";
import { deleteMedia, getMediaById, updateMedia } from "@/components/media/server/repository";
import { NextRequest, NextResponse } from "next/server";
import { requireApiAdmin, requireApiUser } from "@/lib/auth/api-guard";




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
    const success = await deleteMedia(id, { deleteLocalFile: true });

    return NextResponse.json({ success });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to delete media.",
      },
      { status: 500 }
    );
  }
}
