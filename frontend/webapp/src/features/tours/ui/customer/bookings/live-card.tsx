"use client";

import { useCallback, useEffect, useState } from "react";
import { Phone, Radio, RefreshCw } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { cn } from "@/lib/utils";

import type { LiveView } from "../../../server/ops/contract";
import { Bdi } from "../../shared/bidi";
import { formatRelative } from "../../shared/format";
import { TourMap } from "../../shared/tour-map";
import { useTourDateFormat } from "../common";

/**
 * Live trip status (C-070..C-075, AT-20): "live" only within the freshness
 * window the server decided; a stale position is shown as the last known
 * position with its age, never as the current location.
 */
export function LiveCard({ live: initial, departureId, timeZone }: { live: LiveView | null; departureId: string; timeZone: string }) {
  const t = useTranslations("TourApp.voucher.live");
  const locale = useLocale();
  const fmt = useTourDateFormat();
  const [live, setLive] = useState(initial);
  const [, setTick] = useState(0);

  // Polls GET /api/tours/live/[departureId] (authorized per departure on the server).
  const refresh = useCallback(async () => {
    try {
      const res = await fetch(`/api/tours/live/${departureId}`, { cache: "no-store" });
      const json = (await res.json()) as { ok: boolean; data?: LiveView };
      if (json.ok && json.data) setLive(json.data);
    } catch {
      // keep the last view; its age keeps being shown honestly
    }
    setTick((n) => n + 1);
  }, [departureId]);
  const kind = live?.tracking.kind;
  useEffect(() => {
    if (kind !== "live" && kind !== "stale" && kind !== "no_signal") return;
    const id = window.setInterval(() => {
      if (document.visibilityState === "visible" && navigator.onLine) void refresh();
    }, 30_000);
    return () => window.clearInterval(id);
  }, [kind, refresh]);
  const onRefresh = () => void refresh();
  if (!live) {
    return (
      <section className="rounded-2xl bg-white p-4 text-sm text-slate-600 ring-1 ring-slate-200" data-testid="live-card" data-tracking="unavailable">
        <h2 className="mb-1 text-sm font-bold text-slate-900">{t("title")}</h2>
        {t("unavailable")}
      </section>
    );
  }
  const tr = live.tracking;
  const when = (iso: string) => formatRelative(iso, locale);
  const status =
    tr.kind === "live"
      ? t("live", { time: when(tr.lastAt) })
      : tr.kind === "stale"
        ? t("stale", { time: when(tr.lastAt) })
        : tr.kind === "no_signal"
          ? t("noSignal")
          : tr.kind === "ended"
            ? t("ended", { time: when(tr.endedAt) })
            : t("notStarted");
  return (
    <section className="space-y-3 rounded-2xl bg-white p-4 ring-1 ring-slate-200" data-testid="live-card" data-tracking={tr.kind}>
      <div className="flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900">
          <Radio className={cn("size-4", tr.kind === "live" ? "text-red-600" : "text-slate-400")} aria-hidden="true" />
          {t("title")}
        </h2>
        <button type="button" onClick={onRefresh} className="inline-flex min-h-11 items-center gap-1 rounded-full px-3 text-xs font-medium text-emerald-700 hover:bg-emerald-50">
          <RefreshCw className="size-3.5" aria-hidden="true" />
          {t("refresh")}
        </button>
      </div>
      <p className={cn("text-sm", tr.kind === "stale" ? "font-semibold text-amber-800" : "text-slate-700")} role="status" data-testid="live-status" suppressHydrationWarning>
        {status}
      </p>
      {live.canSeeLocation && live.lastPosition ? (
        <TourMap
          points={[{ id: "pos", lat: live.lastPosition.lat, lng: live.lastPosition.lng, label: status, kind: "position", exact: true }]}
          labels={{ region: t("title"), unavailable: t("unavailable"), approximate: "" }}
          height={180}
        />
      ) : !live.canSeeLocation ? (
        <p className="text-xs text-slate-500">{t("hidden")}</p>
      ) : null}
      {live.milestones.length > 0 ? (
        <div>
          <h3 className="text-xs font-semibold text-slate-600">{t("milestones")}</h3>
          <ul className="mt-1 space-y-1 text-sm text-slate-700">
            {live.milestones.slice(0, 6).map((m) => (
              <li key={m.id} suppressHydrationWarning>
                {t.has(`milestone.${m.kind}`) ? t(`milestone.${m.kind}`) : t("milestone.other")} · {fmt.instant(m.createdAt, timeZone, false)}
                {m.note ? (
                  <span className="block text-xs text-slate-500" dir="auto">
                    {m.note}
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {live.guideContact ? (
        <p className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-slate-500">{t("guide")}:</span>
          <Bdi>{live.guideContact.name}</Bdi>
          {live.guideContact.phone ? (
            <a href={`tel:${live.guideContact.phone}`} className="inline-flex min-h-11 items-center gap-1 font-semibold text-emerald-700">
              <Phone className="size-4" aria-hidden="true" />
              {t("call")}
            </a>
          ) : null}
        </p>
      ) : null}
    </section>
  );
}
