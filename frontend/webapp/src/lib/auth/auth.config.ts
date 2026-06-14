import "server-only";

import { NextAuthConfig } from "next-auth";

import { routing } from "@/i18n/routing";

import {
  apiAuthPrefix,
  authRoutes,
  DEFAULT_SIGNIN_REDIRECT,
  publicRoutes,
} from "./routes";

type Locale = (typeof routing.locales)[number];

export const authConfig = {
  trustHost:true,
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;

      // Extract locale from URL path
      const pathSegments = nextUrl.pathname.split("/").filter(Boolean);
      const potentialLocale = pathSegments[0];
      const isValidLocale = routing.locales.includes(potentialLocale as Locale);
      const locale = isValidLocale
        ? (potentialLocale as Locale)
        : routing.defaultLocale;
      const localePrefix = `/${locale}`;

      const isApiAuthRoute = nextUrl.pathname.startsWith(apiAuthPrefix);
      const isPublicRoute = publicRoutes.some((route) => {
        return (
          nextUrl.pathname === route ||
          nextUrl.pathname === `${localePrefix}${route}` ||
          publicRoutes.some((r) =>
            nextUrl.pathname.match(new RegExp(`^(\/[a-z]{2})?${r}$`))
          )
        );
      });

      const isAuthRoute = authRoutes.some((route) => {
        // Convert route pattern to regex
        const pattern = route
          .replace(/:[^/]+/g, "[^/]+") // Replace :param with regex pattern
          .replace(/\//g, "\\/"); // Escape forward slashes
        const regex = new RegExp(`^(\/[a-z]{2})?\/${pattern}$`);
        return regex.test(nextUrl.pathname);
      });

      if (isApiAuthRoute) {
        return true;
      }

      if (isAuthRoute) {
        if (isLoggedIn) {
          const localizedDefaultRedirect = `${localePrefix}${DEFAULT_SIGNIN_REDIRECT}`;
          return Response.redirect(new URL(localizedDefaultRedirect, nextUrl));
        }
        return true;
      }

      if (!isLoggedIn && !isPublicRoute) {
        const onBoardingPath = `${localePrefix}/on-boarding`;

        return Response.redirect(new URL(`${onBoardingPath}`, nextUrl));
      }

      return true;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
