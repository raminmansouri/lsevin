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

  const privateMobileAreas = [
    "profile",
    "bookings",
    "booking",
    "booking-v2",
    "notifications",
    "support",
    "bug-reports",
    "shop/cart",
    "shop/checkout",
    "shop/orders",
    "shop/order",
    "shop/addresses",
    "shop/wishlist",
    "shop/compare",
    "packages/*/checkout",
  ];

  const disallow = [
    "/api/",
    "/*/api/",
    ...privateAreas.flatMap((area) => [`/${area}`, `/*/${area}`]),
    ...privateMobileAreas.flatMap((area) => [
      `/n/app/mobile/${area}`,
      `/*/n/app/mobile/${area}`,
    ]),
  ];

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow,
      },
    ],
    sitemap: `${seoOrigin()}/sitemap.xml`,
  };
}
