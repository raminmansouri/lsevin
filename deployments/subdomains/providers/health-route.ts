// SUPERSEDED — see README.md in this folder. The real Providers Portal
// repository already has its own /api/health and /api/ready routes.
//
// Caddy and Docker call this endpoint to know when this replica is ready.
// Save this file as: src/app/api/health/route.ts

// Never cache a health response.
export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(
    {
      status: "ok",
      service: "providers",
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
