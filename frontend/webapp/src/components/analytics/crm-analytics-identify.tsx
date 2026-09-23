"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";

declare global {
  interface Window {
    crmAnalyticsIdentity?: { externalId?: string; isSignedUp?: boolean; isLoggedIn?: boolean };
    crmAnalytics?: {
      identify?: (info: { externalId?: string; isSignedUp?: boolean; isLoggedIn?: boolean }) => void;
    };
  }
}

/** Publish session state before or after tracker loading. Late identification
 * emits an identity event so a single-page visit is classified immediately.
 * Unauthenticated sessions explicitly clear the previous external account ID.
 */
export function CrmAnalyticsIdentify() {
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "loading") return;
    const identity = {
      externalId: session?.user?.id ?? "",
      isSignedUp: Boolean(session?.user?.id),
      isLoggedIn: status === "authenticated",
    };
    window.crmAnalyticsIdentity = identity;
    const identify = () => window.crmAnalytics?.identify?.(identity);
    identify();
    window.addEventListener("crm:ready", identify);
    return () => window.removeEventListener("crm:ready", identify);
  }, [status, session?.user?.id]);

  return null;
}
