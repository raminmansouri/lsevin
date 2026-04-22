import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const form = await request.formData();
    const file = form.get("file");
    const title = String(form.get("title") || "Document");
    const requirementId = form.get("requirementId");

    if (!(file instanceof File)) {
      return NextResponse.json({ message: "No file uploaded." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = path.extname(file.name);
    const fileName = `${randomUUID()}${ext}`;
    const relativeDir = path.join("uploads", "booking-v2");
    const diskDir = path.join(process.cwd(), "public", relativeDir);
    await mkdir(diskDir, { recursive: true });
    await writeFile(path.join(diskDir, fileName), buffer);

    return NextResponse.json({
      title,
      requirementId: requirementId ? String(requirementId) : null,
      fileName: file.name,
      fileUrl: `/${relativeDir.replace(/\\/g, "/")}/${fileName}`,
      mimeType: file.type || null,
      sizeBytes: file.size,
    });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Upload failed." },
      { status: 500 },
    );
  }
}
