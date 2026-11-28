import { MetadataRoute } from "next";

import { seoOrigin } from "@/lib/seo/origin";
import { routing } from "@/i18n/routing";

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
    // The customer's account (/fa/account, /fa/account/bookings, …; served from
    // n/app/mobile/profile by the rewrites in next.config.ts). Listed per locale,
    // not as "/*/account": "*" also spans slashes, so that form would block any
    // public URL with "/account" inside it, e.g. /fa/products/accounting-book.
    "account",
    // The booking flow (/fa/n/app/mobile/booking?serviceId=…). As a prefix this
    // also covers booking-v2 and the old /n/app/mobile/bookings redirects.
    "n/app/mobile/booking",
  ];

  const disallow = [
    "/api/",
    "/*/api/",
    ...privateAreas.flatMap((area) => [
      `/${area}`,
      ...routing.locales.map((locale) => `/${locale}/${area}`),
    ]),
  ];

  return {
    rules: [
      {
        userAgent: "*",
        // The shop's product photos are served through the same-origin image
        // proxy (src/features/shop/lib/image.ts), and so are their og:image and
        // structured-data images: under the /api/ rule Google could index none
        // of them (found 2026-11-15). The longer, more specific allow wins.
        allow: ["/", "/api/shop/img"],
        disallow,
      },
    ],
    sitemap: `${seoOrigin()}/sitemap.xml`,
  };
}
