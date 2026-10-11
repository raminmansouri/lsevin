"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

import { catalogDataLocale } from "@/lib/pwa/data-locale";
import { savePublicPage } from "@/lib/pwa/public-snapshot";

type InstallPrompt = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: string }>;
};
type NetworkNavigator = Navigator & {
  connection?: { saveData?: boolean; effectiveType?: string };
};

/**
 * Registers the app-shell service worker (`/public/sw.js`) on the client.
 *
 * Production-only on purpose: a service worker in `next dev` interferes with
 * HMR and fast refresh. Optional cache failures never block online navigation.
 */
export function ServiceWorkerRegister() {
  const pathname = usePathname();
  const [offline, setOffline] = useState(false);
  const [waiting, setWaiting] = useState<ServiceWorker | null>(null);
  const [install, setInstall] = useState<InstallPrompt | null>(null);
  const [supported, setSupported] = useState(false);
  const persian = pathname?.split("/")[1] === "fa";
  useEffect(() => {
    if (
      process.env.NODE_ENV !== "production" ||
      !("serviceWorker" in navigator) ||
      location.hostname.startsWith("financial.")
    )
      return;
    let disposed = false;
    let registration: ServiceWorkerRegistration | undefined;
    let reloadForUpdate = false;
    const connectionChanged = () => setOffline(!navigator.onLine);
    const beforeInstall = (event: Event) => {
      event.preventDefault();
      setInstall(event as InstallPrompt);
    };
    const installed = () => setInstall(null);
    const controllerChanged = () => {
      if (reloadForUpdate) location.reload();
    };
    const checkWaiting = () => {
      if (!disposed && registration?.waiting) setWaiting(registration.waiting);
    };
    const updateFound = () =>
      registration?.installing?.addEventListener("statechange", checkWaiting);
    const applyUpdate = () => {
      reloadForUpdate = true;
    };
    const navigateOffline = (event: MouseEvent) => {
      if (
        navigator.onLine ||
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      )
        return;
      const anchor = (event.target as Element).closest?.("a");
      if (
        !anchor ||
        anchor.hasAttribute("download") ||
        (anchor.target && anchor.target !== "_self")
      )
        return;
      const url = new URL(anchor.href);
      if (
        url.origin !== location.origin ||
        (url.pathname === location.pathname && url.hash)
      )
        return;
      event.preventDefault();
      event.stopPropagation();
      // Document navigation lets the worker serve the independent offline reader.
      location.assign(url.href);
    };
    connectionChanged();
    window.addEventListener("online", connectionChanged);
    window.addEventListener("offline", connectionChanged);
    window.addEventListener("beforeinstallprompt", beforeInstall);
    window.addEventListener("appinstalled", installed);
    window.addEventListener("lsevin-pwa-update", applyUpdate);
    document.addEventListener("click", navigateOffline, true);
    navigator.serviceWorker.addEventListener(
      "controllerchange",
      controllerChanged
    );
    const register = async () => {
      try {
        registration = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
          updateViaCache: "none",
        });
        if (disposed) return;
        await navigator.serviceWorker.ready;
        if (disposed) return;
        registration.active?.postMessage({ type: "REPAIR_SHELL" });
        setSupported(true);
        checkWaiting();
        registration.addEventListener("updatefound", updateFound);
        updateFound();
      } catch (error) {
        console.warn(
          "LSevin offline support could not start",
          error instanceof Error ? error.name : "RegistrationError"
        );
      }
    };
    if (document.readyState === "complete") void register();
    else window.addEventListener("load", register, { once: true });
    return () => {
      disposed = true;
      window.removeEventListener("load", register);
      window.removeEventListener("online", connectionChanged);
      window.removeEventListener("offline", connectionChanged);
      window.removeEventListener("beforeinstallprompt", beforeInstall);
      window.removeEventListener("appinstalled", installed);
      window.removeEventListener("lsevin-pwa-update", applyUpdate);
      document.removeEventListener("click", navigateOffline, true);
      navigator.serviceWorker.removeEventListener(
        "controllerchange",
        controllerChanged
      );
      registration?.removeEventListener("updatefound", updateFound);
    };
  }, []);

  useEffect(() => {
    if (!supported || offline || !pathname) return;
    const currentLocale = pathname.split("/")[1];
    if (/^(en|fa|tr|es|ar|ku|de|fr|ru|tg|zh)$/.test(currentLocale || "")) {
      try {
        localStorage.setItem("lsevin-pwa-locale", currentLocale);
      } catch {
        /* Optional preference. */
      }
    }
    const connection = (navigator as NetworkNavigator).connection;
    if (
      connection?.saveData ||
      /^(slow-)?2g$/.test(connection?.effectiveType || "")
    )
      return;
    const controller = new AbortController();
    const timeout = window.setTimeout(
      () =>
        controller.abort(new DOMException("Snapshot deadline", "TimeoutError")),
      20000
    );
    const task = window.setTimeout(async () => {
      try {
        await navigator.serviceWorker.ready;
        if (controller.signal.aborted) return;
        await savePublicPage(pathname, controller.signal);
        const locale = pathname.split("/")[1] || "fa";
        const marker = `lsevin-pwa-directory-sync-${locale}`;
        if (
          Date.now() - Number(sessionStorage.getItem(marker) || 0) <
          30 * 60 * 1000
        )
          return;
        if (!navigator.serviceWorker.controller) return;
        const response = await fetch(
          `/api/booking-pro/catalog/providers?locale=${encodeURIComponent(catalogDataLocale(locale))}&take=20`,
          { credentials: "omit", signal: controller.signal }
        );
        if (response.ok) sessionStorage.setItem(marker, String(Date.now()));
      } catch {
        /* Optional snapshots never block the current screen. */
      }
    }, 4000);
    return () => {
      controller.abort();
      window.clearTimeout(task);
      window.clearTimeout(timeout);
    };
  }, [supported, offline, pathname]);

  if (!supported || (!offline && !waiting && !install)) return null;
  return (
    <aside
      aria-label={persian ? "اتصال و برنامه" : "Connection and app"}
      className="bg-background fixed inset-x-3 top-3 z-[100] mx-auto flex max-w-xl flex-wrap items-center gap-3 rounded-xl border p-3 text-sm shadow-lg"
      dir={persian ? "rtl" : "ltr"}
    >
      {offline && (
        <>
          <span role="status">
            {persian
              ? "آفلاین هستید؛ تغییرات به اینترنت نیاز دارند."
              : "You are offline. Changes require a connection."}
          </span>
          <a className="underline" href="/offline.html">
            {persian ? "صفحات ذخیره‌شده" : "Saved pages"}
          </a>
        </>
      )}
      {waiting && (
        <button
          type="button"
          className="rounded border px-3 py-2"
          onClick={() => {
            window.dispatchEvent(new Event("lsevin-pwa-update"));
            waiting.postMessage({ type: "SKIP_WAITING" });
          }}
        >
          {persian ? "به‌روزرسانی و بارگذاری دوباره" : "Update and reload"}
        </button>
      )}
      {install && (
        <button
          type="button"
          className="rounded border px-3 py-2"
          onClick={async () => {
            try {
              await install.prompt();
              await install.userChoice;
            } finally {
              setInstall(null);
            }
          }}
        >
          {persian ? "نصب لسوین" : "Install LSevin"}
        </button>
      )}
    </aside>
  );
}
