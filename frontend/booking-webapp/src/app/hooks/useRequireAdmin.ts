import { useEffect, useState } from "react";

type SessionUser = {
  roles?: string[];
};

type Session = {
  user?: SessionUser;
};

type UseRequireAdminResult = {
  loading: boolean;
  authorized: boolean;
};

/**
 * Checks the NextAuth session from the main webapp and ensures
 * the current user is authenticated and has the Admin role.
 *
 * This relies on:
 * - Shared cookies between the main webapp and this booking micro frontend.
 * - NextAuth session endpoint being available at `/api/auth/session`.
 */
export function useRequireAdmin(): UseRequireAdminResult {
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const redirectToLogin = () => {
      if (typeof window === "undefined") return;
      const callbackUrl = encodeURIComponent("/booking/admin");
      window.location.href = `/sign-in?callbackUrl=${callbackUrl}`;
    };

    const redirectToHome = () => {
      if (typeof window === "undefined") return;
      window.location.href = "/";
    };

    async function checkSession() {
      try {
        const response = await fetch("/api/auth/session", {
          credentials: "include",
        });

        if (!response.ok) {
          if (!cancelled) {
            setAuthorized(false);
            setLoading(false);
            redirectToLogin();
          }
          return;
        }

        const data = (await response.json()) as Session | null;
        const roles = data?.user?.roles ?? [];
        const isAdmin =
          Array.isArray(roles) &&
          roles.some((role) => String(role).toLowerCase() === "admin");

        if (!isAdmin) {
          if (!cancelled) {
            setAuthorized(false);
            setLoading(false);
            redirectToHome();
          }
          return;
        }

        if (!cancelled) {
          setAuthorized(true);
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setAuthorized(false);
          setLoading(false);
          redirectToLogin();
        }
      }
    }

    void checkSession();

    return () => {
      cancelled = true;
    };
  }, []);

  return { loading, authorized };
}

