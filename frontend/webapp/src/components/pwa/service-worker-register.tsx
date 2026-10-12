"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

import { appStoreLinks, type AppStore } from "@/config/app-stores";
import {
  APPLICATION_CACHE,
  saveApplicationPage,
} from "@/lib/pwa/application-cache";
import { catalogDataLocale } from "@/lib/pwa/data-locale";

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
  const [stores, setStores] = useState<AppStore[]>([]);
  const [supported, setSupported] = useState(false);
  const [required, setRequired] = useState(false);
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
    let noticeTimer: number | undefined;
    const onlineRequired = () => {
      setRequired(true);
      window.clearTimeout(noticeTimer);
      noticeTimer = window.setTimeout(() => setRequired(false), 4000);
    };
    window.addEventListener("lsevin-online-required", onlineRequired);
    const connectionChanged = () => {
      setOffline(!navigator.onLine);
      document.documentElement.dataset.lsevinConnection = navigator.onLine
        ? "online"
        : "offline";
      if (new URL(location.href).searchParams.has("offlineUnavailable"))
        onlineRequired();
    };
    const beforeInstall = (event: Event) => event.preventDefault();
    setStores(
      appStoreLinks(
        navigator.userAgent,
        location.hostname,
        window.matchMedia("(display-mode: standalone)").matches
      )
    );
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
    const openOffline = async (path: string) => {
      const url = new URL(path, location.origin);
      const saved = await (
        await caches.open(APPLICATION_CACHE)
      ).match(url.pathname);
      const profile =
        /^\/(?:en|fa|tr|es|ar|ku|de|fr|ru|tg|zh)\/n\/app\/mobile\/profile\/?$/.test(
          url.pathname
        ) && (await globalThis.LsevinViewStore?.read(url.pathname));
      if (saved || profile) location.assign(url.href);
      else window.dispatchEvent(new Event("lsevin-online-required"));
    };
    const offlineNavigate = (event: Event) => {
      void openOffline((event as CustomEvent<string>).detail).catch(() => {});
    };
    window.addEventListener("lsevin-offline-navigate", offlineNavigate);
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
      // Preserve the current screen for online-only routes. Cached pages retain
      // their original bootstrap/layout through a worker-backed document load.
      void openOffline(url.href).catch(() => {});
    };
    connectionChanged();
    window.addEventListener("online", connectionChanged);
    window.addEventListener("offline", connectionChanged);
    window.addEventListener("beforeinstallprompt", beforeInstall);
    window.addEventListener("lsevin-pwa-update", applyUpdate);
    document.addEventListener("click", navigateOffline, true);
    navigator.serviceWorker.addEventListener(
      "controllerchange",
      controllerChanged
    );
    const register = async () => {
      try {
        // A failed atomic installation removes its registration. `ready` then
        // remains pending forever, so retry registration after a bounded wait.
        for (let attempt = 0; attempt < 3; attempt++) {
          if (disposed) return;
          registration = await navigator.serviceWorker.register("/sw.js", {
            scope: "/",
            updateViaCache: "none",
          });
          let deadline: number | undefined;
          try {
            await Promise.race([
              navigator.serviceWorker.ready,
              new Promise<never>((_, reject) => {
                deadline = window.setTimeout(
                  () => reject(new Error("WorkerReadinessTimeout")),
                  12000
                );
              }),
            ]);
            break;
          } catch (error) {
            if (attempt === 2) throw error;
          } finally {
            window.clearTimeout(deadline);
          }
        }
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
    // Slow images and third-party resources must not delay offline readiness.
    if (document.readyState !== "loading") void register();
    else
      document.addEventListener("DOMContentLoaded", register, { once: true });
    return () => {
      disposed = true;
      window.removeEventListener("lsevin-online-required", onlineRequired);
      window.clearTimeout(noticeTimer);
      window.removeEventListener("lsevin-offline-navigate", offlineNavigate);
      document.removeEventListener("DOMContentLoaded", register);
      window.removeEventListener("online", connectionChanged);
      window.removeEventListener("offline", connectionChanged);
      window.removeEventListener("beforeinstallprompt", beforeInstall);
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
        const locale = pathname.split("/")[1] || "fa";
        const home = "/" + locale + "/n/app/mobile/home";
        await Promise.all([
          saveApplicationPage(pathname, controller.signal),
          ...(pathname !== home
            ? [saveApplicationPage(home, controller.signal)]
            : []),
        ]);
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

  if (!supported || (!waiting && !(stores.length && !offline) && !required))
    return null;
  return (
    <aside
      data-pwa-transient
      aria-label={persian ? "اتصال و برنامه" : "Connection and app"}
      className="bg-background fixed inset-x-3 top-3 z-[100] mx-auto flex max-w-xl flex-wrap items-center gap-3 rounded-xl border p-3 text-sm shadow-lg"
      dir={persian ? "rtl" : "ltr"}
    >
      {required && (
        <span role="status">
          {persian
            ? "این بخش به اتصال اینترنت نیاز دارد."
            : "This action requires an internet connection."}
        </span>
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
      {!offline &&
        stores.map((store) => (
          <a
            key={store.url}
            className="rounded border px-3 py-2"
            href={store.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            {(persian ? "دریافت از " : "Get Lsevin on ") + store.name}
          </a>
        ))}
    </aside>
  );
}
