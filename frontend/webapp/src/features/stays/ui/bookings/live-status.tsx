"use client";

import { useEffect, useRef, useState } from "react";
import { Bell, BellRing, CheckCircle2, Info, XCircle } from "lucide-react";
import { useTranslations } from "next-intl";

import { useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

/** Statuses that are waiting on someone else (the host, or the payment). */
const WAITING = new Set(["requested", "pending_payment"]);
const VISIBLE_MS = 5_000;
const HIDDEN_MS = 30_000;

type Change = { from: string; to: string };

function base64UrlToBytes(base64: string) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

function canNotify() {
  return typeof window !== "undefined" && "Notification" in window && "serviceWorker" in navigator;
}

/**
 * While a booking waits for the host or for payment, the page checks its status every few
 * seconds (less often in a background tab, immediately when the tab comes back) and reloads its
 * data when it changes, so an accept or decline appears without a refresh. If the guest allowed
 * notifications and the tab is in the background, the change also shows as a system notification.
 */
export function useLiveBookingStatus(bookingId: string, status: string) {
  const router = useRouter();
  const [change, setChange] = useState<Change | null>(null);
  const current = useRef(status);
  const t = useTranslations("StayApp.bookings.live");

  useEffect(() => {
    if (current.current !== status) current.current = status;
  }, [status]);

  useEffect(() => {
    if (!WAITING.has(status)) return;
    let stopped = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let inFlight = false;

    const schedule = () => {
      if (stopped) return;
      timer = setTimeout(check, document.visibilityState === "visible" ? VISIBLE_MS : HIDDEN_MS);
    };
    const check = async () => {
      if (stopped || inFlight) return;
      inFlight = true;
      try {
        const res = await fetch(`/api/stays/bookings/${bookingId}/status`, { cache: "no-store", headers: { Accept: "application/json" } });
        if (res.ok) {
          const data = (await res.json()) as { status?: string };
          if (data.status && data.status !== current.current) {
            const from = current.current;
            current.current = data.status;
            setChange({ from, to: data.status });
            router.refresh();
            if (document.visibilityState !== "visible" && canNotify() && Notification.permission === "granted") {
              const reg = await navigator.serviceWorker.getRegistration().catch(() => undefined);
              const title = t(`title.${data.status}` as never);
              if (reg) await reg.showNotification(title, { body: t(`text.${data.status}` as never), icon: "/favicon.ico", tag: `stay-${bookingId}`, data: { url: window.location.href } }).catch(() => undefined);
            }
          }
        }
      } catch {
        // offline or server busy: try again on the next tick
      } finally {
        inFlight = false;
        schedule();
      }
    };
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        if (timer) clearTimeout(timer);
        void check();
      }
    };
    schedule();
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("online", onVisible);
    return () => {
      stopped = true;
      if (timer) clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("online", onVisible);
    };
  }, [bookingId, status, router, t]);

  return change;
}

const GOOD = new Set(["pending_payment", "confirmed"]);

/** The "your request was answered" banner shown in place, announced to screen readers. */
export function StatusChangeBanner({ change }: { change: Change | null }) {
  const t = useTranslations("StayApp.bookings.live");
  if (!change) return <div role="status" aria-live="polite" className="sr-only" />;
  const good = GOOD.has(change.to);
  const Icon = good ? CheckCircle2 : change.to === "cancelled" || change.to === "declined" ? XCircle : Info;
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn("flex items-start gap-3 rounded-2xl p-4 ring-1", good ? "bg-emerald-50 text-emerald-950 ring-emerald-200" : "bg-amber-50 text-amber-950 ring-amber-200")}
      data-testid="stay-status-changed"
      data-status={change.to}
    >
      <Icon className={cn("mt-0.5 size-5 shrink-0", good ? "text-emerald-700" : "text-amber-700")} aria-hidden="true" />
      <div>
        <p className="font-bold">{t(`title.${change.to}` as never)}</p>
        <p className="mt-0.5 text-sm">{t(`text.${change.to}` as never)}</p>
      </div>
    </div>
  );
}

/**
 * "Tell me on this phone when the host answers". With web push configured (VAPID key) the device
 * is subscribed, so the answer arrives even with the site closed; without it the browser's
 * permission still lets this page raise a notification while it is open in the background.
 */
export function NotifyMeCard({ pushKey }: { pushKey: string | null }) {
  const t = useTranslations("StayApp.bookings.live");
  const [state, setState] = useState<"unsupported" | "idle" | "busy" | "on" | "denied">("unsupported");

  useEffect(() => {
    if (!canNotify()) return;
    let cancelled = false;
    (async () => {
      if (Notification.permission === "denied") return setState("denied");
      if (Notification.permission === "granted") {
        if (!pushKey) return setState("on");
        const reg = await navigator.serviceWorker.getRegistration().catch(() => undefined);
        const sub = await reg?.pushManager?.getSubscription().catch(() => null);
        if (!cancelled) setState(sub ? "on" : "idle");
        return;
      }
      if (!cancelled) setState("idle");
    })();
    return () => {
      cancelled = true;
    };
  }, [pushKey]);

  if (state === "unsupported") return null;

  const enable = async () => {
    setState("busy");
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") return setState(permission === "denied" ? "denied" : "idle");
      if (pushKey && "PushManager" in window) {
        const reg = (await navigator.serviceWorker.getRegistration()) ?? (await navigator.serviceWorker.register("/sw.js"));
        const ready = await navigator.serviceWorker.ready.catch(() => reg);
        const sub = (await ready.pushManager.getSubscription()) ?? (await ready.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: base64UrlToBytes(pushKey) }));
        const res = await fetch("/api/notifications/push/subscribe", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(sub.toJSON()) });
        if (!res.ok) throw new Error(`subscribe ${res.status}`);
      }
      setState("on");
    } catch {
      setState("idle");
    }
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white p-4 ring-1 ring-slate-200 print:hidden" data-testid="stay-notify-me" data-state={state}>
      <div className="flex items-start gap-3">
        {state === "on" ? <BellRing className="mt-0.5 size-5 shrink-0 text-emerald-700" aria-hidden="true" /> : <Bell className="mt-0.5 size-5 shrink-0 text-slate-600" aria-hidden="true" />}
        <p className="text-sm text-slate-700">{state === "on" ? t("notifyOn") : state === "denied" ? t("notifyDenied") : t("notifyHint")}</p>
      </div>
      {state === "idle" || state === "busy" ? (
        <button
          type="button"
          onClick={enable}
          disabled={state === "busy"}
          className="inline-flex min-h-11 items-center gap-2 rounded-full bg-emerald-700 px-4 text-sm font-bold text-white hover:bg-emerald-800 disabled:opacity-60"
          data-testid="stay-notify-me-enable"
        >
          <Bell className="size-4" aria-hidden="true" />
          {t("notifyMe")}
        </button>
      ) : null}
    </div>
  );
}
