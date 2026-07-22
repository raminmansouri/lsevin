// Caddy and Docker call this endpoint to know when this replica is ready.
// Save this file as: src/app/api/health/route.ts

// Never cache a health response.
export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(
    {
      status: "ok",
      service: "shop",
      time: new Date().toISOString(),
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
