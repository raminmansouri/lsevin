"use client";

import { Clock, Flag, MapPin, Navigation, Route } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { cn } from "@/lib/utils";

import type { TourDetail } from "../../../server/platform/catalog";
import { formatClock, formatNumber } from "../../shared/format";
import { LocalizedText } from "../../shared/localized-text";
import { TourMap, type MapPoint } from "../../shared/tour-map";
import { TourImage } from "../common";

type Stop = TourDetail["itinerary"][number];

export function useDurationText() {
  const t = useTranslations("TourApp.card");
  return (minutes: number) => {
    if (minutes >= 60) {
      const h = Math.floor(minutes / 60);
      const m = minutes % 60;
      return m ? `${t("hours", { count: h })} ${t("minutes", { count: m })}` : t("hours", { count: h });
    }
    return t("minutes", { count: minutes });
  };
}

function stopKind(type: string): MapPoint["kind"] {
  return type === "meeting" || type === "pickup" ? "meeting" : type === "finish" ? "finish" : "stop";
}

/** Directions deep link — only for points whose exact location is disclosed (C-043, C-054). */
export function directionsHref(lat: number, lng: number) {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}

/**
 * Day-by-day itinerary (C-050..C-054, 4-tour_page_2.png, AT-04): day badges,
 * stop cards in the saved order, local times, stay duration, transport — and
 * travel time/distance only when the operator provided them; otherwise they are
 * labelled as not provided. The ordered list doubles as the text alternative of
 * the map.
 */
export function Itinerary({ stops, timezone }: { stops: Stop[]; timezone: string }) {
  const t = useTranslations("TourApp.detail.itinerary");
  const tt = useTranslations("TourApp.detail.transport");
  const locale = useLocale();
  const duration = useDurationText();
  if (stops.length === 0) return <p className="text-sm text-slate-600">{t("empty")}</p>;

  const days = [...new Set(stops.map((s) => s.day))].sort((a, b) => a - b);
  const ordered = [...stops].sort((a, b) => a.day - b.day || a.position - b.position);
  const typeLabel = (type: string) => (t.has(`types.${type}`) ? t(`types.${type}`) : t("types.stop"));
  const modeLabel = (mode: string | null) => (mode && tt.has(mode) ? tt(mode) : tt("other"));

  const points: MapPoint[] = ordered
    .filter((s) => s.lat != null && s.lng != null)
    .map((s, i) => ({
      id: s.id,
      lat: s.lat!,
      lng: s.lng!,
      label: s.title?.value ?? typeLabel(s.type),
      kind: stopKind(s.type),
      order: i + 1,
      exact: s.exact,
      legFromPrev: s.travelMinutesFromPrev != null || s.distanceKmFromPrev != null,
    }));
  const globalIndex = new Map(ordered.map((s, i) => [s.id, i + 1]));

  return (
    <div className="space-y-5">
      <p className="text-xs text-slate-500">
        {t("summary", { days: days.length, stops: ordered.length })} · {t("timesLocal", { zone: timezone })}
      </p>
      <TourMap
        points={points}
        labels={{ region: t("mapRegion"), unavailable: t("mapUnavailable"), approximate: t("approximate"), routeNote: t("routeNote") }}
      />
      <div aria-label={t("textAlternative")} role="region" data-testid="itinerary">
        {days.map((day) => (
          <section key={day} aria-labelledby={`day-${day}`} className="relative" data-testid="itinerary-day" data-day={day}>
            <h3 id={`day-${day}`} className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-900">
              <span className="flex size-9 items-center justify-center rounded-full bg-emerald-700 text-sm text-white" aria-hidden="true">
                {formatNumber(day, locale)}
              </span>
              {t("day", { day: formatNumber(day, locale) })}
            </h3>
            <ol className="ms-4 space-y-3 border-s-2 border-dashed border-emerald-200 ps-5 pb-4">
              {ordered
                .filter((s) => s.day === day)
                .map((s) => {
                  const counter = globalIndex.get(s.id) ?? 0;
                  const order = s.lat != null ? points.findIndex((p) => p.id === s.id) + 1 : null;
                  return (
                    <li key={s.id} className="relative" data-testid="itinerary-stop" data-stop-type={s.type} data-order={counter}>
                      <span
                        className={cn(
                          "absolute -start-[34px] top-3 flex size-6 items-center justify-center rounded-full text-[11px] font-bold text-white ring-4 ring-slate-50",
                          s.type === "meeting" ? "bg-emerald-700" : s.type === "finish" ? "bg-red-700" : "bg-blue-900",
                        )}
                        aria-hidden="true"
                      >
                        {order ? formatNumber(order, locale) : "•"}
                      </span>
                      <article className="flex gap-3 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-slate-200">
                        <div className="min-w-0 flex-1 space-y-1">
                          <p className="flex flex-wrap items-center gap-2 text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
                            {s.type === "meeting" ? <MapPin className="size-3.5 text-emerald-700" aria-hidden="true" /> : s.type === "finish" ? <Flag className="size-3.5 text-red-700" aria-hidden="true" /> : null}
                            {typeLabel(s.type)}
                            {!s.exact && s.lat != null ? <span className="font-normal normal-case">({t("approximate")})</span> : null}
                          </p>
                          <h4 className="text-[15px] font-bold text-slate-900" data-testid="stop-title">
                            <LocalizedText text={s.title} placeholder={typeLabel(s.type)} />
                          </h4>
                          {s.description ? <LocalizedText text={s.description} as="p" className="text-sm leading-6 text-slate-600" /> : null}
                          <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
                            {s.startTime ? (
                              <li className="inline-flex items-center gap-1">
                                <Clock className="size-3.5" aria-hidden="true" />
                                {t("startsAt", { time: formatClock(s.startTime, locale) })}
                              </li>
                            ) : null}
                            {s.durationMinutes ? <li>{t("stayFor", { duration: duration(s.durationMinutes) })}</li> : null}
                            {counter > 1 ? (
                              s.travelMinutesFromPrev != null ? (
                                <li className="inline-flex items-center gap-1">
                                  <Route className="size-3.5" aria-hidden="true" />
                                  {t("travelFromPrev", { duration: duration(s.travelMinutesFromPrev), mode: modeLabel(s.transportMode) })}
                                </li>
                              ) : (
                                <li className="text-slate-400" data-testid="travel-not-provided">
                                  {t("travelUnknown")}
                                </li>
                              )
                            ) : null}
                            {counter > 1 && s.distanceKmFromPrev != null ? <li>{t("distanceFromPrev", { km: formatNumber(s.distanceKmFromPrev, locale, { maximumFractionDigits: 1 }) })}</li> : null}
                          </ul>
                          {!s.included ? <p className="text-xs font-semibold text-orange-700">{t("notIncluded")}</p> : null}
                          {s.instructions ? (
                            <details className="text-sm text-slate-700">
                              <summary className="min-h-11 cursor-pointer content-center font-medium text-emerald-800">{t("instructions")}</summary>
                              <LocalizedText text={s.instructions} as="p" className="leading-6" />
                            </details>
                          ) : null}
                          {s.exact && s.lat != null && s.lng != null ? (
                            <a
                              href={directionsHref(s.lat, s.lng)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex min-h-11 items-center gap-1 text-sm font-medium text-emerald-700 underline-offset-2 hover:underline"
                            >
                              <Navigation className="size-4" aria-hidden="true" />
                              {t("openDirections")}
                            </a>
                          ) : null}
                        </div>
                        {s.imageUrl ? <TourImage src={s.imageUrl} alt={s.title?.value ?? ""} className="size-20 shrink-0 rounded-xl" /> : null}
                      </article>
                    </li>
                  );
                })}
            </ol>
          </section>
        ))}
      </div>
    </div>
  );
}
