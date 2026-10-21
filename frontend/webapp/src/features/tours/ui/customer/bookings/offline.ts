/**
 * Offline voucher (C-040, S-040, AT-29). The voucher page stores what a
 * traveler needs at the meeting point — code, QR, date/time, meeting point and
 * instructions — on the device: in localStorage (read by the page itself) and
 * in the Cache API (read by the Tours service worker, which renders it when a
 * reload happens without network).
 */
export const OFFLINE_CACHE = "lsevin-tours-offline-v1";
export const offlineVoucherUrl = (bookingId: string) => `/__tours_offline/voucher/${bookingId}`;
const LS_KEY = (bookingId: string) => `lsevin_tours_voucher:${bookingId}`;

export type OfflineVoucher = {
  bookingId: string;
  savedAt: string;
  lang: string;
  dir: "rtl" | "ltr";
  labels: Record<string, string>;
  title: string;
  status: string;
  voucherCode: string;
  departure: string;
  timezone: string;
  meetingText: string | null;
  meetingCoords: string | null;
  attendees: string[];
  qr: { d: string; viewBox: number } | null;
};

export async function saveOfflineVoucher(v: OfflineVoucher) {
  try {
    localStorage.setItem(LS_KEY(v.bookingId), JSON.stringify(v));
  } catch {
    // storage full / disabled — the Cache API copy may still work
  }
  try {
    if ("caches" in window) {
      const cache = await caches.open(OFFLINE_CACHE);
      await cache.put(offlineVoucherUrl(v.bookingId), new Response(JSON.stringify(v), { headers: { "Content-Type": "application/json" } }));
    }
  } catch {
    // ignore
  }
}

export function readOfflineVoucher(bookingId: string): OfflineVoucher | null {
  try {
    const raw = localStorage.getItem(LS_KEY(bookingId));
    return raw ? (JSON.parse(raw) as OfflineVoucher) : null;
  } catch {
    return null;
  }
}

export function removeOfflineVoucher(bookingId: string) {
  try {
    localStorage.removeItem(LS_KEY(bookingId));
  } catch {
    // ignore
  }
  if (typeof caches !== "undefined") void caches.open(OFFLINE_CACHE).then((c) => c.delete(offlineVoucherUrl(bookingId))).catch(() => undefined);
}

/** Registers the Tours service worker for this locale's /tours scope (served by /api/tours/sw). */
export function registerToursServiceWorker(locale: string) {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
  if (location.hostname.startsWith("financial.")) return;
  void navigator.serviceWorker.register("/api/tours/sw", { scope: `/${locale}/tours/` }).catch(() => undefined);
}
