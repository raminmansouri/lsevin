"use client";

import { SessionProvider } from "next-auth/react";

/**
 * The session is a cookie-backed JWT that only changes on sign-in, sign-out or
 * an explicit `update()`. Re-fetching it on a timer or on every window focus
 * bought nothing and cost a 3.2 KB request each time — a HAR of the mobile home
 * page had 50 calls to /api/auth/session in 14 minutes, 160 KB of the 3.37 MB
 * page weight. So poll nothing: the screens that mutate the session already call
 * `update()` themselves, and `refetchWhenOffline: false` stops a flaky mobile
 * connection from retrying into a dead network.
 */
const AuthProvider = ({ children }: React.PropsWithChildren) => {
  return (
    <SessionProvider
      refetchInterval={0}
      refetchOnWindowFocus={false}
      refetchWhenOffline={false}
    >
      {children}
    </SessionProvider>
  );
};

export default AuthProvider;
