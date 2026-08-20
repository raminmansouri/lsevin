import { MetadataRoute } from "next";

import { env } from "@/config/env/client";

/**
 * Every private area of the app lives behind a locale prefix (/fa/admin, /en/admin,
 * …), so a bare "/admin" rule would match nothing. The `/*​/` forms cover the
 * prefixed paths and the bare forms cover the pre-redirect ones a crawler may
 * still hold from a link.
 *
 * These are all auth-gated already — this only stops crawlers from burning budget
 * on sign-in redirects and listing them as soft 404s.
 */
export default function robots(): MetadataRoute.Robots {
  const privateAreas = [
    "admin",
    "provider-portal",
    "provider-panel",
    "financial",
    "sign-in",
    "sign-up",
    "otp",
    "forgot-password",
    "reset-password",
    "on-boarding",
    "profile",
  ];

  const disallow = [
    "/api/",
    "/*/api/",
    ...privateAreas.flatMap((area) => [`/${area}`, `/*/${area}`]),
  ];

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow,
      },
    ],
    sitemap: `${env.NEXT_PUBLIC_URL.replace(/\/$/, "")}/sitemap.xml`,
  };
}
