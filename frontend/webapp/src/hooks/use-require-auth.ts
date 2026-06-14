"use client";

import { usePathname } from "next/navigation";

import { useCurrentSession } from "@/hooks/use-current-session";

/**
 * Auth gate for inline actions that live on otherwise-public pages
 * (e.g. leaving a review/comment, booking from a provider page).
 *
 * Guests can browse freely, so we don't block rendering — instead the caller
 * uses `isAuthenticated` to decide whether to show the real control or a
 * "sign in to continue" prompt, and `signInHref` to send the guest to sign-in
 * with a `redirectTo` back to the current page.
 *
 * `usePathname()` (from next/navigation) returns the real, locale-prefixed URL,
 * so the user comes right back here after authenticating.
 */
export function useRequireAuth() {
  const pathname = usePathname();
  const { status } = useCurrentSession(false);

  const isAuthenticated = status === "authenticated";
  const isLoading = status === "loading";

  // next-intl <Link> prefixes the locale onto `pathname: "/sign-in"`; the
  // redirectTo query carries the already-prefixed current path verbatim.
  const signInHref = {
    pathname: "/sign-in",
    query: { redirectTo: pathname },
  } as const;

  return { isAuthenticated, isLoading, status, signInHref, pathname };
}
