"use client";

import { useEffect } from "react";

/**
 * Registers the app-shell service worker (`/public/sw.js`) on the client.
 *
 * Production-only on purpose: a service worker in `next dev` interferes with
 * HMR and fast refresh. Registration failures are swallowed — the app is fully
 * functional without the SW; it only accelerates repeat visits.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    const register = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        /* non-fatal: app works without the SW */
      });
    };

    // Wait for load so SW registration never competes with the initial render.
    if (document.readyState === "complete") {
      register();
    } else {
      window.addEventListener("load", register, { once: true });
      return () => window.removeEventListener("load", register);
    }
  }, []);

  return null;
}
