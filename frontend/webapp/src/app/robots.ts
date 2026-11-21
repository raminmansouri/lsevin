import { MetadataRoute } from "next";

import { seoOrigin } from "@/lib/seo/origin";

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
        // The shop's product photos are served through the same-origin image
        // proxy (src/features/shop/lib/image.ts), and so are their og:image and
        // structured-data images: under the /api/ rule Google could index none
        // of them (found 2026-11-15). The longer, more specific allow wins.
        // The longer app rule wins over broad /*/profile and /*/admin
        // disallows, so crawlers can read each app page's noindex metadata.
        allow: ["/", "/api/shop/img", "/n/app/", "/*/n/app/"],
        disallow,
      },
    ],
    sitemap: `${seoOrigin()}/sitemap.xml`,
  };
}
