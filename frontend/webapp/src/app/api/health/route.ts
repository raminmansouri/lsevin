// Caddy and Docker call this to know when a lsevin-webapp replica is ready to
// receive traffic during a rolling deploy (see deployments/jenkins/deploy-local.sh
// and deployments/docker/Caddyfile.server).

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(
    {
      status: "ok",
      service: "lsevin-webapp",
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
