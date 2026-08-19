import { NextResponse } from "next/server";

const SERVICE_NAME = "lsevin-providers-portal";
const NO_STORE_HEADERS = { "Cache-Control": "no-store, max-age=0" } as const;

export function createLivenessResponse() {
  return NextResponse.json(
    {
      status: "ok",
      service: SERVICE_NAME,
      version: process.env.APP_VERSION?.trim() || process.env.npm_package_version || "unknown",
      revision: process.env.GIT_COMMIT?.trim() || process.env.IMAGE_TAG?.trim() || "unknown",
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
    },
    { status: 200, headers: NO_STORE_HEADERS },
  );
}

export async function createReadinessResponse() {
  const startedAt = Date.now();

  try {
    const { sql } = await import("@core/db/client");
    await sql`select 1 as ready`;

    return NextResponse.json(
      {
        status: "ready",
        service: SERVICE_NAME,
        database: "reachable",
        latencyMs: Date.now() - startedAt,
        timestamp: new Date().toISOString(),
      },
      { status: 200, headers: NO_STORE_HEADERS },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown readiness failure";
    console.error("[readiness] database check failed", error);

    return NextResponse.json(
      {
        status: "not_ready",
        service: SERVICE_NAME,
        database: "unreachable",
        error: message,
        latencyMs: Date.now() - startedAt,
        timestamp: new Date().toISOString(),
      },
      { status: 503, headers: NO_STORE_HEADERS },
    );
  }
}
