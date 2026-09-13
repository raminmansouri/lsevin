"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";

declare global {
  interface Window {
    crmAnalytics?: {
      identify?: (info: { externalId?: string; isSignedUp?: boolean; isLoggedIn?: boolean }) => void;
    };
  }
}

/**
 * Bridges lsevin's own next-auth session into the CRM analytics snippet's
 * dynamic `identify()` call (see crm/apps/web/app/t.js) -- without this,
 * every visitor, including a signed-in lsevin user, counts as "anonymous" in
 * CRM analytics.
 *
 * Static `data-external-id`/`data-signed-up`/`data-logged-in` attributes on
 * the `<Script>` tag (app/layout.tsx) are the *simpler* way the snippet
 * supports this, but aren't an option here: that root layout sits above
 * next-intl's `[locale]` segment and must stay a server component making no
 * request-scoped calls (see its own comment on the earlier
 * Mağaza/فروشگاه locale-mixing bug caused by exactly that). So the session
 * can only reach the already-loaded snippet via this client-side call, once
 * `useSession()` resolves -- which is precisely the "dynamic escape hatch"
 * `identify()` exists for. One inherent gap: the snippet's very first
 * pageview per page load fires synchronously before this effect runs, so
 * that one event stays anonymous; every event after it (including the next
 * client-side navigation's pageview) carries the identity.
 */
export function CrmAnalyticsIdentify() {
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "loading") return;
    const identify = window.crmAnalytics?.identify;
    if (!identify) return;
    identify({
      externalId: session?.user?.id,
      isSignedUp: Boolean(session?.user?.id),
      isLoggedIn: status === "authenticated",
    });
  }, [status, session?.user?.id]);

  return null;
}
