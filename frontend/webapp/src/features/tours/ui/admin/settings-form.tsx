"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { CALENDAR_IDS, formatIsoDate, isCalendarId, isIsoDate, parseCalendarInput, type CalendarId } from "../../domain/calendar";
import { saveSettingsAction } from "../../server/admin/actions";
import type { TourSettings } from "../../server/platform/settings";

import { CalendarDateField, CalendarSelect, Field, NativeSelect, Section, useAdminAction } from "./primitives";

const list = (s: string) => s.split(",").map((x) => x.trim()).filter(Boolean);

/**
 * Tours platform settings (M-025, M-026, M-029, Q-005, Q-011, Q-012). The
 * server validates everything again; the form shows the same rules early.
 */
export function SettingsForm({ settings }: { settings: TourSettings }) {
  const t = useTranslations("TourAdmin.settings");
  const tc = useTranslations("TourShared.calendar");
  const uiLocale = useLocale();
  const { run, pending, lastError } = useAdminAction();
  const [enabled, setEnabled] = useState(settings.enabledLocales.join(", "));
  const [defaultLocale, setDefaultLocale] = useState(settings.defaultLocale);
  const [fallback, setFallback] = useState(settings.contentFallbackOrder.join(", "));
  const [required, setRequired] = useState(settings.requiredPublishLocales.join(", "));
  const [calendars, setCalendars] = useState<Record<string, string>>(settings.defaultCalendarByLocale);
  const [newLang, setNewLang] = useState("");
  const [nums, setNums] = useState({
    holdMinutes: String(settings.holdMinutes), paymentWindowMinutes: String(settings.paymentWindowMinutes), requestToBookHours: String(settings.requestToBookHours),
    recentViewsLimit: String(settings.recentViewsLimit), recentViewsRetentionDays: String(settings.recentViewsRetentionDays), recentSearchesLimit: String(settings.recentSearchesLimit),
    trackingRetentionDays: String(settings.trackingRetentionDays), trackingStaleSeconds: String(settings.trackingStaleSeconds),
    serviceFeePercent: String(settings.serviceFeePercent), platformCommissionPercent: String(settings.platformCommissionPercent),
  });
  const [weather, setWeather] = useState({ ...settings.weather, currentTtlMinutes: String(settings.weather.currentTtlMinutes), forecastTtlMinutes: String(settings.weather.forecastTtlMinutes), forecastHorizonDays: String(settings.weather.forecastHorizonDays) });
  const [previewCal, setPreviewCal] = useState<CalendarId>("persian");
  const [previewDate, setPreviewDate] = useState("1405-01-01");

  const enabledList = list(enabled);
  const problems: string[] = [];
  if (!enabledList.includes(defaultLocale)) problems.push(t("problem.defaultNotEnabled"));
  for (const l of list(fallback)) if (l !== "source" && !enabledList.includes(l)) problems.push(t("problem.fallbackNotEnabled", { locale: l }));
  if (!list(required).includes("source")) problems.push(t("problem.sourceRequired"));
  for (const l of list(required)) if (l !== "source" && !enabledList.includes(l)) problems.push(t("problem.requiredNotEnabled", { locale: l }));
  if (!calendars["*"]) problems.push(t("problem.calendarDefault"));
  if (Number(nums.paymentWindowMinutes) < Number(nums.holdMinutes)) problems.push(t("problem.paymentWindow"));

  const save = () => run(() => saveSettingsAction({
    enabledLocales: enabledList, defaultLocale, contentFallbackOrder: list(fallback), requiredPublishLocales: list(required), defaultCalendarByLocale: calendars,
    ...Object.fromEntries(Object.entries(nums).map(([k, v]) => [k, Number(v)])),
    weather: { ...weather, currentTtlMinutes: Number(weather.currentTtlMinutes), forecastTtlMinutes: Number(weather.forecastTtlMinutes), forecastHorizonDays: Number(weather.forecastHorizonDays) },
  }));
  const num = (key: keyof typeof nums, hint?: string) => (
    <Field label={t(`field.${String(key)}`)} htmlFor={`set-${String(key)}`} hint={hint}>
      <Input id={`set-${String(key)}`} dir="ltr" inputMode="decimal" value={nums[key]} onChange={(e) => setNums({ ...nums, [key]: e.target.value })} />
    </Field>
  );

  return (
    <div className="space-y-4">
      <Section id="languages" title={t("languages")} description={t("languagesHint")}>
        <div className="grid gap-3 md:grid-cols-2">
          <Field label={t("field.enabledLocales")} htmlFor="set-enabled" hint={t("bcp47")}><Input id="set-enabled" dir="ltr" value={enabled} onChange={(e) => setEnabled(e.target.value)} /></Field>
          <Field label={t("field.defaultLocale")} htmlFor="set-default">
            <NativeSelect id="set-default" value={defaultLocale} onChange={(e) => setDefaultLocale(e.target.value)}>
              {enabledList.map((l) => <option key={l} value={l}>{l}</option>)}
              {!enabledList.includes(defaultLocale) ? <option value={defaultLocale}>{defaultLocale}</option> : null}
            </NativeSelect>
          </Field>
          <Field label={t("field.contentFallbackOrder")} htmlFor="set-fallback" hint={t("fallbackHint")}><Input id="set-fallback" dir="ltr" value={fallback} onChange={(e) => setFallback(e.target.value)} /></Field>
          <Field label={t("field.requiredPublishLocales")} htmlFor="set-required" hint={t("requiredHint")}><Input id="set-required" dir="ltr" value={required} onChange={(e) => setRequired(e.target.value)} /></Field>
        </div>
      </Section>

      <Section id="calendars" title={t("calendars")} description={t("calendarsHint")}>
        <ul className="space-y-2">
          {Object.entries(calendars).map(([lang, cal]) => (
            <li key={lang} className="flex flex-wrap items-end gap-2">
              <span className="w-16 font-mono text-sm" dir="ltr">{lang === "*" ? t("otherLanguages") : lang}</span>
              <NativeSelect aria-label={t("calendarFor", { lang })} className="w-64" value={String(cal)} onChange={(e) => setCalendars({ ...calendars, [lang]: e.target.value })}>
                {CALENDAR_IDS.map((c) => <option key={c} value={c}>{tc(c)}</option>)}
              </NativeSelect>
              {lang !== "*" ? <Button type="button" size="sm" variant="ghost" onClick={() => { const next = { ...calendars }; delete next[lang]; setCalendars(next); }}>{t("remove")}</Button> : null}
            </li>
          ))}
        </ul>
        <div className="flex items-end gap-2">
          <Field label={t("addLanguage")} htmlFor="set-newlang"><Input id="set-newlang" dir="ltr" className="w-28" value={newLang} onChange={(e) => setNewLang(e.target.value.trim().toLowerCase())} /></Field>
          <Button type="button" size="sm" variant="outline" disabled={!/^[a-z]{2,3}$/.test(newLang) || newLang in calendars} onClick={() => { setCalendars({ ...calendars, [newLang]: "gregory" }); setNewLang(""); }}>{t("add")}</Button>
        </div>
        <div className="rounded-md border p-3" data-testid="calendar-preview">
          <p className="mb-2 text-sm font-medium">{t("livePreview")}</p>
          <div className="grid gap-3 md:grid-cols-3">
            <CalendarSelect id="set-pcal" value={previewCal} onChange={setPreviewCal} />
            <CalendarDateField id="set-pdate" label={t("previewDate")} value={previewDate} onChange={setPreviewDate} calendar={previewCal} />
          </div>
          <PreviewTable value={previewDate} calendar={previewCal} calendars={calendars} uiLocale={uiLocale} />
        </div>
        <div className="bg-muted/40 rounded-md p-3 text-sm" data-testid="hijri-convention">
          <p className="font-medium">{t("hijriTitle")}</p>
          <p>{t("hijriBody", { calendar: settings.hijriConvention.calendar })}</p>
          <p className="text-muted-foreground text-xs" dir="ltr">officialOffsets: {JSON.stringify(settings.hijriConvention.officialOffsets)}</p>
          <p className="text-muted-foreground text-xs">{t("hijriReadOnly")}</p>
        </div>
      </Section>

      <Section id="checkout" title={t("checkout")}>
        <div className="grid gap-3 md:grid-cols-3">
          {num("holdMinutes")}{num("paymentWindowMinutes")}{num("requestToBookHours")}
          {num("serviceFeePercent", t("serviceFeeHint"))}{num("platformCommissionPercent", t("commissionHint"))}
        </div>
      </Section>

      <Section id="privacy" title={t("privacy")} description={t("privacyHint")}>
        <div className="grid gap-3 md:grid-cols-3">
          {num("recentViewsLimit")}{num("recentViewsRetentionDays")}{num("recentSearchesLimit")}{num("trackingRetentionDays")}{num("trackingStaleSeconds")}
        </div>
      </Section>

      <Section id="weather" title={t("weather")} description={t("weatherHint")}>
        <div className="grid gap-3 md:grid-cols-3">
          <Field label={t("field.weatherProvider")} htmlFor="set-wp">
            <NativeSelect id="set-wp" value={weather.provider} onChange={(e) => setWeather({ ...weather, provider: e.target.value })}>
              <option value="open-meteo">Open-Meteo</option><option value="fixture">{t("fixture")}</option><option value="disabled">{t("disabled")}</option>
            </NativeSelect>
          </Field>
          <Field label={t("field.currentTtlMinutes")} htmlFor="set-wc"><Input id="set-wc" dir="ltr" value={weather.currentTtlMinutes} onChange={(e) => setWeather({ ...weather, currentTtlMinutes: e.target.value })} /></Field>
          <Field label={t("field.forecastTtlMinutes")} htmlFor="set-wf"><Input id="set-wf" dir="ltr" value={weather.forecastTtlMinutes} onChange={(e) => setWeather({ ...weather, forecastTtlMinutes: e.target.value })} /></Field>
          <Field label={t("field.forecastHorizonDays")} htmlFor="set-wh"><Input id="set-wh" dir="ltr" value={weather.forecastHorizonDays} onChange={(e) => setWeather({ ...weather, forecastHorizonDays: e.target.value })} /></Field>
          <Field label={t("field.attribution")} htmlFor="set-wa" className="md:col-span-2"><Input id="set-wa" dir="ltr" value={weather.attribution} onChange={(e) => setWeather({ ...weather, attribution: e.target.value })} /></Field>
        </div>
      </Section>

      {problems.length > 0 ? (
        <ul className="text-destructive space-y-1 text-sm" role="alert" data-testid="settings-problems">{problems.map((p) => <li key={p}>{p}</li>)}</ul>
      ) : null}
      {lastError ? <p className="text-destructive text-sm" role="alert" data-testid="settings-error">{lastError}</p> : null}
      <Button type="button" disabled={pending || problems.length > 0} onClick={save} data-testid="save-settings">{t("save")}</Button>
    </div>
  );
}

/** The same canonical day in every configured language's default calendar (M-026). Uses the server's parser (domain/calendar). */
function PreviewTable({ value, calendar, calendars, uiLocale }: { value: string; calendar: CalendarId; calendars: Record<string, string>; uiLocale: string }) {
  const t = useTranslations("TourAdmin.settings");
  const tc = useTranslations("TourShared.calendar");
  const v = value.trim();
  const parsed = !v ? null : calendar === "gregory" && isIsoDate(v) ? v : parseCalendarInput(v, calendar);
  if (!parsed) return <p className="text-destructive mt-2 text-sm">{t("previewInvalid")}</p>;
  return (
    <table className="mt-2 w-full text-sm">
      <thead><tr className="text-muted-foreground"><th className="p-1 text-start">{t("language")}</th><th className="p-1 text-start">{t("defaultCalendar")}</th><th className="p-1 text-start">{t("shownAs")}</th></tr></thead>
      <tbody>
        <tr className="border-t"><td className="p-1">ISO</td><td className="p-1">—</td><td className="p-1 font-mono" dir="ltr" data-testid="preview-iso">{parsed}</td></tr>
        {Object.keys(calendars).map((lang) => {
          const cal: CalendarId = isCalendarId(calendars[lang]) ? (calendars[lang] as CalendarId) : "gregory";
          const fmtLocale = lang === "*" ? uiLocale : lang;
          let shown = "—";
          try { shown = formatIsoDate(parsed, { locale: fmtLocale, calendar: cal, style: "full" }); } catch { /* unknown locale tag */ }
          return (
            <tr key={lang} className="border-t" data-lang={lang}>
              <td className="p-1 font-mono" dir="ltr">{lang}</td><td className="p-1">{tc(cal)}</td>
              <td className="p-1" lang={fmtLocale}>{shown}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
