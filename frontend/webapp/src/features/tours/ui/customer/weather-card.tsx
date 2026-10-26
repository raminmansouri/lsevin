"use client";

import { Cloud, CloudDrizzle, CloudFog, CloudLightning, CloudRain, CloudSun, Snowflake, Sun, ThermometerSun, Wind } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { cn } from "@/lib/utils";

import type { WeatherView } from "../../server/ops/contract";
import { formatNumber, formatRelative } from "../shared/format";

import { useTourDateFormat } from "./common";

const ICONS: Record<string, typeof Sun> = {
  clear: Sun,
  partly_cloudy: CloudSun,
  cloudy: Cloud,
  fog: CloudFog,
  drizzle: CloudDrizzle,
  rain: CloudRain,
  snow: Snowflake,
  thunderstorm: CloudLightning,
};

/**
 * Weather from the platform weather service (C-063..C-066, AT-05): always with
 * its time and source; stale data is labelled, a date beyond the forecast range
 * shows no numbers, and nothing is ever filled in when the service is down.
 * Temperatures are °C, wind km/h (metric for all enabled locales).
 */
export function WeatherCard({ view, date, compact, className }: { view: WeatherView; date: string | null; compact?: boolean; className?: string }) {
  const t = useTranslations("TourApp.weather");
  const locale = useLocale();
  const n = (v: number) => formatNumber(Math.round(v), locale);
  const fmt = useTourDateFormat();

  if (view.status === "unavailable") {
    return (
      <div className={cn("rounded-2xl bg-white p-4 text-sm text-slate-600 ring-1 ring-slate-200", className)} data-testid="weather-card" data-weather-status="unavailable">
        <p className="font-semibold text-slate-800">{t("title")}</p>
        <p className="mt-1">{t("unavailable")}</p>
        <p className="text-xs text-slate-500">{t(`reasons.${view.reason}`)}</p>
      </div>
    );
  }

  const cond = view.current?.condition ?? view.forecast?.condition ?? null;
  const Icon = cond ? ICONS[cond] ?? ThermometerSun : ThermometerSun;
  return (
    <div
      className={cn("rounded-2xl bg-white p-4 ring-1 ring-slate-200", className)}
      data-testid="weather-card"
      data-weather-status="ok"
      data-weather-mode={view.mode.kind}
      data-weather-freshness={view.freshness}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-800">
            {t("title")}
            {view.location.label ? <span className="font-normal text-slate-500"> · {view.location.label}</span> : null}
          </p>
          {view.mode.kind === "current" && view.current ? (
            <p className="text-xs text-slate-500">{t("current")}</p>
          ) : view.mode.kind === "forecast" && date ? (
            <p className="text-xs text-slate-500">
              <span suppressHydrationWarning>{t("forecastFor", { date: fmt.date(date) })}</span>
            </p>
          ) : null}
        </div>
        <Icon className="size-8 shrink-0 text-amber-500" aria-hidden="true" />
      </div>

      {view.mode.kind === "current" && view.current ? (
        <div className="mt-2" data-testid="weather-current">
          <p className="text-3xl font-bold text-slate-900">
            <bdi>{n(view.current.temperatureC)}°C</bdi>
          </p>
          <p className="text-sm text-slate-700">{t(`conditions.${view.current.condition}`)}</p>
          <Details precip={view.current.precipitationProbability} wind={view.current.windKph} compact={compact} />
        </div>
      ) : view.mode.kind === "forecast" && view.forecast ? (
        <div className="mt-2" data-testid="weather-forecast">
          <p className="text-2xl font-bold text-slate-900">
            <bdi>{t("range", { min: n(view.forecast.minC), max: n(view.forecast.maxC) })}</bdi>
          </p>
          <p className="text-sm text-slate-700">{t(`conditions.${view.forecast.condition}`)}</p>
          <Details precip={view.forecast.precipitationProbability} wind={view.forecast.windKph} compact={compact} />
        </div>
      ) : view.mode.kind === "climate" ? (
        <div className="mt-2" data-testid="weather-climate">
          <p className="text-sm font-semibold text-slate-800">{t("climate")}</p>
          {date ? <p className="text-sm text-slate-600" suppressHydrationWarning>{t("climateNote", { date: fmt.date(date) })}</p> : null}
        </div>
      ) : view.mode.kind === "past" ? (
        <p className="mt-2 text-sm text-slate-600">{t("past")}</p>
      ) : (
        <p className="mt-2 text-sm text-slate-600">{t("unavailable")}</p>
      )}

      {view.mode.kind === "current" || view.mode.kind === "forecast" ? (
        <div className="mt-3 space-y-0.5 text-[11px] text-slate-500">
          {view.freshness === "stale" ? (
            <p className="font-semibold text-amber-700" data-testid="weather-stale">
              {t("stale")}
            </p>
          ) : null}
          <p data-testid="weather-updated">
            <time dateTime={view.fetchedAt} suppressHydrationWarning>
              {t("updated", { time: formatRelative(view.fetchedAt, locale) })}
            </time>
          </p>
          <p>{t("source", { source: view.attribution })}</p>
        </div>
      ) : null}
    </div>
  );
}

function Details({ precip, wind, compact }: { precip: number | null; wind: number | null; compact?: boolean }) {
  const t = useTranslations("TourApp.weather");
  const locale = useLocale();
  if (compact || (precip == null && wind == null)) return null;
  return (
    <ul className="mt-1 flex flex-wrap gap-x-4 text-xs text-slate-600">
      {precip != null ? <li>{t("precipitation", { value: formatNumber(precip, locale) })}</li> : null}
      {wind != null ? (
        <li className="inline-flex items-center gap-1">
          <Wind className="size-3" aria-hidden="true" />
          {t("wind", { value: formatNumber(Math.round(wind), locale) })}
        </li>
      ) : null}
    </ul>
  );
}
