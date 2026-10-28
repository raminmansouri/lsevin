"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SUPPORTED_LOCALE_HEADERS } from "@/config/locales";

import { CALENDAR_IDS, formatIsoDate, isCalendarId, isIsoDate, type CalendarId } from "../../domain/calendar";
import { saveSettingsAction } from "../../server/admin/actions";
import type { TourSettings } from "../../server/platform/settings";

import { localeName, OptionMultiSelect, OptionSelect, useLanguageOptions, useLocaleOptions, type Option } from "./inputs";
import { CalendarDateField, Field, NativeSelect, Section, useAdminAction } from "./primitives";

/** 1 Farvardin 1405 — a day that reads differently in every calendar. */
const PREVIEW_DEFAULT = "2026-03-21";

/**
 * Tours platform settings (M-025, M-026, M-029, Q-005, Q-011, Q-012). The
 * server validates everything again; the form shows the same rules early.
 */
export function SettingsForm({ settings }: { settings: TourSettings }) {
  const t = useTranslations("TourAdmin.settings");
  const tcommon = useTranslations("TourAdmin.common");
  const tc = useTranslations("TourShared.calendar");
  const uiLocale = useLocale();
  const { run, pending, lastError } = useAdminAction();
  const [enabled, setEnabled] = useState<string[]>(settings.enabledLocales);
  const [defaultLocale, setDefaultLocale] = useState(settings.defaultLocale);
  const [fallback, setFallback] = useState<string[]>(settings.contentFallbackOrder);
  const [required, setRequired] = useState<string[]>(settings.requiredPublishLocales);
  const [calendars, setCalendars] = useState<Record<string, string>>(settings.defaultCalendarByLocale);
  const [newLang, setNewLang] = useState("");
  const [nums, setNums] = useState({
    holdMinutes: String(settings.holdMinutes), paymentWindowMinutes: String(settings.paymentWindowMinutes), requestToBookHours: String(settings.requestToBookHours),
    recentViewsLimit: String(settings.recentViewsLimit), recentViewsRetentionDays: String(settings.recentViewsRetentionDays), recentSearchesLimit: String(settings.recentSearchesLimit),
    trackingRetentionDays: String(settings.trackingRetentionDays), trackingStaleSeconds: String(settings.trackingStaleSeconds),
    serviceFeePercent: String(settings.serviceFeePercent), platformCommissionPercent: String(settings.platformCommissionPercent),
  });
  const [weather, setWeather] = useState({ ...settings.weather, currentTtlMinutes: String(settings.weather.currentTtlMinutes), forecastTtlMinutes: String(settings.weather.forecastTtlMinutes), forecastHorizonDays: String(settings.weather.forecastHorizonDays) });
  const [previewDate, setPreviewDate] = useState(PREVIEW_DEFAULT);

  // Every language the platform supports, plus anything already configured.
  const allTags = useMemo(() => Array.from(new Set([...(SUPPORTED_LOCALE_HEADERS as string[]), ...settings.enabledLocales])), [settings.enabledLocales]);
  const localeOptions = useLocaleOptions(allTags);
  const enabledOptions = localeOptions.filter((o) => enabled.includes(o.value));
  const withSource: Option[] = [{ value: "source", label: tcommon("sourceLanguage"), hint: "source" }, ...enabledOptions];
  // Keep a configured value visible even if it is no longer enabled, so the problem list can point at it.
  const keep = (values: string[], opts: Option[]) => [...opts, ...values.filter((v) => !opts.some((o) => o.value === v)).map((v) => ({ value: v, label: localeName(v, uiLocale), hint: v }))];
  const languageOptions = useLanguageOptions().filter((o) => !(o.value in calendars));
  const langName = (tag: string) => (tag === "source" ? tcommon("sourceLanguage") : localeName(tag, uiLocale));

  const problems: string[] = [];
  if (!enabled.includes(defaultLocale)) problems.push(t("problem.defaultNotEnabled"));
  for (const l of fallback) if (l !== "source" && !enabled.includes(l)) problems.push(t("problem.fallbackNotEnabled", { locale: langName(l) }));
  if (!required.includes("source")) problems.push(t("problem.sourceRequired"));
  for (const l of required) if (l !== "source" && !enabled.includes(l)) problems.push(t("problem.requiredNotEnabled", { locale: langName(l) }));
  if (!calendars["*"]) problems.push(t("problem.calendarDefault"));
  if (Number(nums.paymentWindowMinutes) < Number(nums.holdMinutes)) problems.push(t("problem.paymentWindow"));

  const save = () => run(() => saveSettingsAction({
    enabledLocales: enabled, defaultLocale, contentFallbackOrder: fallback, requiredPublishLocales: required, defaultCalendarByLocale: calendars,
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
          <Field label={t("field.enabledLocales")} htmlFor="set-enabled">
            <OptionMultiSelect id="set-enabled" testId="set-enabled" values={enabled} onChange={setEnabled} options={localeOptions} />
          </Field>
          <Field label={t("field.defaultLocale")} htmlFor="set-default">
            <NativeSelect id="set-default" value={defaultLocale} onChange={(e) => setDefaultLocale(e.target.value)}>
              {enabledOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              {!enabled.includes(defaultLocale) ? <option value={defaultLocale}>{langName(defaultLocale)}</option> : null}
            </NativeSelect>
          </Field>
          <Field label={t("field.contentFallbackOrder")} htmlFor="set-fallback" hint={<>{t("fallbackHint")} {t("fallbackOrderHint")}</>}>
            <OptionMultiSelect id="set-fallback" testId="set-fallback" values={fallback} onChange={setFallback} options={keep(fallback, withSource)} />
          </Field>
          <Field label={t("field.requiredPublishLocales")} htmlFor="set-required" hint={t("requiredHint")}>
            <OptionMultiSelect id="set-required" testId="set-required" values={required} onChange={setRequired} options={keep(required, withSource)} />
          </Field>
        </div>
      </Section>

      <Section id="calendars" title={t("calendars")} description={t("calendarsHint")}>
        <ul className="space-y-2">
          {Object.entries(calendars).map(([lang, cal]) => {
            const name = lang === "*" ? t("otherLanguages") : localeName(lang, uiLocale);
            return (
              <li key={lang} className="flex flex-wrap items-end gap-2" data-lang={lang}>
                <span className="w-32 text-sm">{name}</span>
                <NativeSelect aria-label={t("calendarFor", { lang: name })} className="w-64" value={String(cal)} onChange={(e) => setCalendars({ ...calendars, [lang]: e.target.value })}>
                  {CALENDAR_IDS.map((c) => <option key={c} value={c}>{tc(c)}</option>)}
                </NativeSelect>
                {lang !== "*" ? <Button type="button" size="sm" variant="ghost" onClick={() => { const next = { ...calendars }; delete next[lang]; setCalendars(next); }}>{t("remove")}</Button> : null}
              </li>
            );
          })}
        </ul>
        <div className="flex items-end gap-2">
          <Field label={t("addLanguage")} htmlFor="set-newlang" className="w-64">
            <OptionSelect id="set-newlang" testId="set-newlang" value={newLang} onChange={setNewLang} options={languageOptions} />
          </Field>
          <Button type="button" size="sm" variant="outline" disabled={!/^[a-z]{2,3}$/.test(newLang) || newLang in calendars} onClick={() => { setCalendars({ ...calendars, [newLang]: "gregory" }); setNewLang(""); }}>{t("add")}</Button>
        </div>
        <div className="rounded-md border p-3" data-testid="calendar-preview">
          <p className="mb-2 text-sm font-medium">{t("livePreview")}</p>
          <div className="grid gap-3 md:grid-cols-3">
            <CalendarDateField id="set-pdate" label={t("previewDate")} value={previewDate} onChange={setPreviewDate} />
          </div>
          <PreviewTable value={previewDate} calendars={calendars} uiLocale={uiLocale} />
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
          <Field label={t("field.currentTtlMinutes")} htmlFor="set-wc"><Input id="set-wc" dir="ltr" inputMode="numeric" value={weather.currentTtlMinutes} onChange={(e) => setWeather({ ...weather, currentTtlMinutes: e.target.value })} /></Field>
          <Field label={t("field.forecastTtlMinutes")} htmlFor="set-wf"><Input id="set-wf" dir="ltr" inputMode="numeric" value={weather.forecastTtlMinutes} onChange={(e) => setWeather({ ...weather, forecastTtlMinutes: e.target.value })} /></Field>
          <Field label={t("field.forecastHorizonDays")} htmlFor="set-wh"><Input id="set-wh" dir="ltr" inputMode="numeric" value={weather.forecastHorizonDays} onChange={(e) => setWeather({ ...weather, forecastHorizonDays: e.target.value })} /></Field>
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

/** The same canonical day in every configured language's default calendar (M-026). The date is picked on a Jalali calendar and kept as ISO. */
function PreviewTable({ value, calendars, uiLocale }: { value: string; calendars: Record<string, string>; uiLocale: string }) {
  const t = useTranslations("TourAdmin.settings");
  const tc = useTranslations("TourShared.calendar");
  const v = value.trim();
  const parsed = isIsoDate(v) ? v : null;
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
              <td className="p-1">{lang === "*" ? t("otherLanguages") : localeName(lang, uiLocale)}</td><td className="p-1">{tc(cal)}</td>
              <td className="p-1" lang={fmtLocale}>{shown}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
