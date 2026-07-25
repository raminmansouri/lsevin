import { NextRequest, NextResponse } from "next/server";

import { putData } from "@/config/http/http-service.server";
import { requireApiUser } from "@/lib/auth/api-guard";
import { getSession } from "../../../../../lib/auth/session";

function resolveMediaType(mimeType?: string | null): "image" | "video" | "file" {
  if (mimeType?.startsWith("image/")) return "image";
  if (mimeType?.startsWith("video/")) return "video";
  return "file";
}

function getExtension(fileName: string) {
  const index = fileName.lastIndexOf(".");
  if (index < 0) return null;
  return fileName.slice(index + 1).toLowerCase();
}

function firstString(value: unknown): string | null {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) {
    const item = value.find((entry) => typeof entry === "string");
    return typeof item === "string" ? item : null;
  }
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return (
      firstString(record.fileUrl) ??
      firstString(record.url) ??
      firstString(record.path) ??
      firstString(record.data) ??
      firstString(record.result)
    );
  }
  return null;
}

export async function POST(request: NextRequest) {
  try {
    // Signed-in rather than admin: despite the /api/admin prefix this is the upload
    // endpoint behind the customer avatar picker and the booking flow's file fields
    // (form-builder's default file upload endpoint), plus the provider portal.
    // It was previously anonymous, and forwarded `token: undefined` to the .NET
    // File/UploadAnyFile endpoint — which accepted it. That backend needs its own fix.
    const auth = await requireApiUser();
    if (auth instanceof NextResponse) return auth;

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file was provided." }, { status: 400 });
    }

    const session = await getSession();
    const user = session?.user;

    if (!formData.has("path")) {
      formData.append("path", "1");
    }

    const { data, error } = await putData<FormData, any>(
      "File/UploadAnyFile?path=1",
      formData,
      { locale: "en", token: user?.accessToken }
    );

    if (error) {
      return NextResponse.json(
        { error: typeof error === "string" ? error : "File storage upload failed." },
        { status: 502 }
      );
    }

    const fileUrl = firstString(data);

    if (!fileUrl) {
      return NextResponse.json(
        { error: "File storage upload did not return a usable URL." },
        { status: 502 }
      );
    }

    return NextResponse.json({
      fileUrl,
      originalName: file.name,
      storedName: file.name,
      mimeType: file.type || "application/octet-stream",
      mediaType: resolveMediaType(file.type),
      fileSize: file.size,
      extension: getExtension(file.name),
      width: null,
      height: null,
      durationSeconds: null,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to store uploaded file.",
      },
      { status: 500 }
    );
  }
}
