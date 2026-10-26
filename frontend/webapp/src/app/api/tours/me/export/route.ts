import { NextResponse } from "next/server";

import { exportMyData } from "@/features/tours/server/actions/customer/state";
import { currentActor } from "@/features/tours/server/platform/access";
import { httpStatusFor, mapDbError } from "@/features/tours/server/platform/errors";

/** Download of the visitor's own Tours browsing data and preferences (C-110). */
export async function GET() {
  try {
    const data = await exportMyData(await currentActor());
    return new NextResponse(JSON.stringify(data, null, 2), {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="lsevin-tours-data-${new Date().toISOString().slice(0, 10)}.json"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (e) {
    const err = mapDbError(e, "tours.export");
    return NextResponse.json({ ok: false, error: { kind: err.kind, code: err.code } }, { status: httpStatusFor[err.kind] });
  }
}
