import { env } from "@/config/env/client";

// Diagnostic for "the CRM analytics snippet is not loading". The <Script> tag in
// src/app/layout.tsx only renders when BOTH NEXT_PUBLIC_CRM_ANALYTICS_URL and
// NEXT_PUBLIC_CRM_ANALYTICS_SITE_KEY are present — and because they are
// NEXT_PUBLIC_*, they are baked in at `next build` time, not read at runtime.
// So a running container with the values in its environment still serves the
// OLD build's values (or none) until it is rebuilt.
//
// This route reads the same `env` object the layout does, so it reports exactly
// what the current bundle was built with:
//
//   curl -s https://appmain.lsevin.com/api/analytics-status | jq
//
//   { "configured": false, ... }  -> the deployed build has no analytics vars:
//        add NEXT_PUBLIC_CRM_ANALYTICS_URL and NEXT_PUBLIC_CRM_ANALYTICS_SITE_KEY
//        to the server's deployments/docker/.env and run a fresh webapp build.
//   { "configured": true, "snippetReachable": false } -> vars are baked in but
//        <crmAnalyticsUrl>/t.js does not serve JS from the browser's network.
//   { "configured": true, "snippetReachable": true } -> the snippet IS wired;
//        if it still is not firing, look at the page's CSP / an ad-blocker /
//        the <Script> being stripped downstream.
//
// Values here are not secrets: NEXT_PUBLIC_* are compiled into the browser
// bundle and the site key already appears in every page's HTML by design.

export const dynamic = "force-dynamic";

// Set once when this server process starts. A recent value means the container
// was (re)started recently — i.e. a deploy happened.
const PROCESS_STARTED_AT = new Date().toISOString();

export async function GET() {
  const url = env.NEXT_PUBLIC_CRM_ANALYTICS_URL ?? null;
  const siteKey = env.NEXT_PUBLIC_CRM_ANALYTICS_SITE_KEY ?? null;
  const configured = Boolean(url && siteKey);
  const snippetSrc = url ? `${url.replace(/\/$/, "")}/t.js` : null;

  let snippetReachable: boolean | null = null;
  let snippetContentType: string | null = null;
  if (snippetSrc) {
    try {
      const res = await fetch(snippetSrc, {
        signal: AbortSignal.timeout(5000),
        cache: "no-store",
      });
      snippetContentType = res.headers.get("content-type");
      snippetReachable = res.ok && (snippetContentType ?? "").includes("javascript");
    } catch {
      snippetReachable = false;
    }
  }

  return Response.json(
    {
      configured,
      analyticsUrl: url,
      siteKey,
      snippetSrc,
      snippetReachable,
      snippetContentType,
      // A recent value = the webapp container was restarted recently (a deploy).
      // If it is old, no deploy has picked up your .env change yet.
      processStartedAt: PROCESS_STARTED_AT,
      checkedAt: new Date().toISOString(),
      hint: configured
        ? "Analytics vars are baked into this build. If the snippet still is not firing, check the page CSP and that /t.js is reachable from the browser."
        : "This build was compiled WITHOUT the analytics vars. Add NEXT_PUBLIC_CRM_ANALYTICS_URL and NEXT_PUBLIC_CRM_ANALYTICS_SITE_KEY to the server .env and rebuild the webapp image.",
    },
    { status: 200, headers: { "Cache-Control": "no-store" } },
  );
}
