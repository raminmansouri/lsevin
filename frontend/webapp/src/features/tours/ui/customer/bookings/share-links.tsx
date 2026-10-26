"use client";

import { useState, useTransition } from "react";
import { Copy, Link2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";

import { createShareLinkAction, revokeShareLinkAction } from "../../../server/actions/customer";
import type { ShareLink } from "../../../server/actions/customer/state";
import { ToursErrorAlert, type ToursActionError } from "../../shared/error-alert";
import { useTourDateFormat } from "../common";

/** Share-safe itinerary links with expiry and revocation (C-109, S-047). */
export function ShareLinks({ bookingId, initial }: { bookingId: string; initial: ShareLink[] }) {
  const t = useTranslations("TourApp.voucher.share");
  const locale = useLocale();
  const fmt = useTourDateFormat();
  const [links, setLinks] = useState(initial);
  const [days, setDays] = useState(7);
  const [error, setError] = useState<ToursActionError | null>(null);
  const [pending, start] = useTransition();
  const url = (token: string) => `${window.location.origin}/${locale}/tours/share/${token}`;
  const tz = "UTC";
  return (
    <section className="space-y-3 rounded-2xl bg-white p-4 ring-1 ring-slate-200" data-testid="share-links" aria-labelledby="share-title">
      <h2 id="share-title" className="flex items-center gap-2 text-sm font-bold text-slate-900">
        <Link2 className="size-4 text-emerald-700" aria-hidden="true" />
        {t("title")}
      </h2>
      <p className="text-xs text-slate-500">{t("body")}</p>
      <div className="flex flex-wrap items-end gap-2">
        <label className="text-sm">
          <span className="block text-xs text-slate-600">{t("days")}</span>
          <select value={days} onChange={(e) => setDays(Number(e.target.value))} className="min-h-11 rounded-xl border border-slate-300 px-3">
            {[1, 3, 7, 14, 30].map((d) => (
              <option key={d} value={d}>
                {t("daysValue", { count: d })}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          disabled={pending}
          data-testid="create-share-link"
          onClick={() =>
            start(async () => {
              setError(null);
              const res = await createShareLinkAction(bookingId, days).catch(() => null);
              if (!res?.ok) {
                setError(res && !res.ok ? res.error : { kind: "infrastructure", code: "service_unavailable" });
                return;
              }
              setLinks((l) => [res.data, ...l]);
            })
          }
          className="min-h-11 rounded-xl bg-emerald-700 px-4 text-sm font-semibold text-white disabled:opacity-60"
        >
          {t("create")}
        </button>
      </div>
      <ToursErrorAlert error={error} />
      {links.length > 0 ? (
        <ul className="space-y-2">
          {links.map((l) => {
            const revoked = Boolean(l.revokedAt);
            return (
              <li key={l.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-50 px-3 py-2 text-xs" data-testid="share-link" data-token={l.token}>
                <span suppressHydrationWarning className={revoked ? "text-slate-400 line-through" : "text-slate-700"}>
                  {revoked ? t("revoked") : t("expires", { time: fmt.instant(l.expiresAt, tz) })}
                </span>
                {!revoked ? (
                  <span className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => void navigator.clipboard.writeText(url(l.token)).then(() => toast.success(t("copied")), () => undefined)}
                      className="inline-flex min-h-11 items-center gap-1 rounded-lg px-2 font-medium text-emerald-700 hover:bg-white"
                    >
                      <Copy className="size-3.5" aria-hidden="true" />
                      {t("copy")}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        start(async () => {
                          const res = await revokeShareLinkAction(l.id).catch(() => null);
                          if (res?.ok) setLinks((x) => x.map((y) => (y.id === l.id ? { ...y, revokedAt: new Date().toISOString() } : y)));
                          else setError(res && !res.ok ? res.error : { kind: "infrastructure", code: "service_unavailable" });
                        })
                      }
                      className="min-h-11 rounded-lg px-2 font-medium text-red-700 hover:bg-white"
                      data-testid="revoke-share-link"
                    >
                      {t("revoke")}
                    </button>
                  </span>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : null}
    </section>
  );
}
