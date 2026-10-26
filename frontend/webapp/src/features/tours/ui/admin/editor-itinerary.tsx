"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import { directionOf } from "../../domain/content";
import { saveItineraryAction } from "../../server/admin/actions";
import type { TourBundle } from "../../server/admin/queries";

import { Field, NativeSelect, Section, useAdminAction } from "./primitives";

type StopDraft = {
  id?: string; day: string; position: string; type: string; lat: string; lng: string; exact: boolean; startTime: string; durationMinutes: string;
  transportMode: string; included: boolean; title: string; description: string; instructions: string;
};

const STOP_TYPES = ["meeting", "activity", "transfer", "accommodation", "meal", "recommendation", "finish"];
const n = (v: string) => (v.trim() === "" ? null : Number(v));

export function ItineraryTab({ bundle }: { bundle: TourBundle }) {
  const t = useTranslations("TourAdmin.itinerary");
  const { run, pending } = useAdminAction();
  const core = bundle.core;
  const [locale, setLocale] = useState<string>(core.source_locale);
  const textOf = (stopId: string, field: string, loc: string) => {
    const r = bundle.content.find((c) => c.entity_type === "stop" && c.entity_id === stopId && c.field_key === field && c.locale === loc);
    return r?.draft_value ?? r?.published_value ?? "";
  };
  const load = (loc: string): StopDraft[] => bundle.stops.map((s) => ({
    id: s.id, day: String(s.day_number), position: String(s.position), type: s.stop_type, lat: s.latitude == null ? "" : String(s.latitude),
    lng: s.longitude == null ? "" : String(s.longitude), exact: s.location_exact, startTime: s.start_time ? String(s.start_time).slice(0, 5) : "",
    durationMinutes: s.duration_minutes == null ? "" : String(s.duration_minutes), transportMode: s.transport_mode ?? "", included: s.included,
    title: textOf(s.id, "title", loc), description: textOf(s.id, "description", loc), instructions: textOf(s.id, "instructions", loc),
  }));
  const [stops, setStops] = useState<StopDraft[]>(() => load(core.source_locale));
  const [summary, setSummary] = useState("");
  const update = (i: number, patch: Partial<StopDraft>) => setStops(stops.map((s, j) => (j === i ? { ...s, ...patch } : s)));
  const save = () => run(() => saveItineraryAction(core.id, locale, stops.map((s) => ({
    id: s.id, day: Number(s.day), position: Number(s.position), type: s.type, lat: n(s.lat), lng: n(s.lng), exact: s.exact,
    startTime: s.startTime || null, durationMinutes: n(s.durationMinutes), transportMode: s.transportMode || null, included: s.included,
    // Only text that exists or was typed is written; blank fields never create empty rows.
    text: Object.fromEntries((["title", "description", "instructions"] as const)
      .filter((f) => s[f].trim() !== "" || (s.id ? textOf(s.id, f, locale) !== "" : false))
      .map((f) => [f, s[f]])),
  })), summary || undefined));
  return (
    <Section id="itinerary" title={t("title")} description={t("description")}
      actions={<Button type="button" size="sm" disabled={pending} onClick={save}>{t("save")}</Button>}>
      <div className="flex flex-wrap items-end gap-3">
        <Field label={t("textLocale")} htmlFor="it-locale">
          <NativeSelect id="it-locale" value={locale} onChange={(e) => { setLocale(e.target.value); setStops(load(e.target.value)); }}>
            {bundle.locales.map((l) => <option key={l} value={l}>{l}{l === core.source_locale ? ` (${t("source")})` : ""}</option>)}
          </NativeSelect>
        </Field>
        <Field label={t("changeSummary")} htmlFor="it-summary" className="min-w-64 flex-1"><Input id="it-summary" value={summary} onChange={(e) => setSummary(e.target.value)} /></Field>
      </div>
      <ol className="space-y-3">
        {stops.map((s, i) => (
          <li key={s.id ?? `new-${i}`} className="space-y-2 rounded-md border p-3" aria-label={t("stop", { n: i + 1 })}>
            <div className="grid gap-2 md:grid-cols-6">
              <Field label={t("day")} htmlFor={`st-day-${i}`}><Input id={`st-day-${i}`} dir="ltr" value={s.day} onChange={(e) => update(i, { day: e.target.value })} /></Field>
              <Field label={t("position")} htmlFor={`st-pos-${i}`}><Input id={`st-pos-${i}`} dir="ltr" value={s.position} onChange={(e) => update(i, { position: e.target.value })} /></Field>
              <Field label={t("type")} htmlFor={`st-type-${i}`}>
                <NativeSelect id={`st-type-${i}`} value={s.type} onChange={(e) => update(i, { type: e.target.value })}>
                  {STOP_TYPES.map((x) => <option key={x} value={x}>{t(`stopType.${x}`)}</option>)}
                </NativeSelect>
              </Field>
              <Field label={t("lat")} htmlFor={`st-lat-${i}`}><Input id={`st-lat-${i}`} dir="ltr" value={s.lat} onChange={(e) => update(i, { lat: e.target.value })} /></Field>
              <Field label={t("lng")} htmlFor={`st-lng-${i}`}><Input id={`st-lng-${i}`} dir="ltr" value={s.lng} onChange={(e) => update(i, { lng: e.target.value })} /></Field>
              <Field label={t("startTime")} htmlFor={`st-time-${i}`}><Input id={`st-time-${i}`} dir="ltr" placeholder="HH:MM" value={s.startTime} onChange={(e) => update(i, { startTime: e.target.value })} /></Field>
            </div>
            <div className="grid gap-2 md:grid-cols-3">
              <Field label={`${t("stopTitle")} (${locale})`} htmlFor={`st-title-${i}`}><Input id={`st-title-${i}`} lang={locale} dir={directionOf(locale)} value={s.title} onChange={(e) => update(i, { title: e.target.value })} /></Field>
              <Field label={`${t("stopDescription")} (${locale})`} htmlFor={`st-desc-${i}`}><Textarea id={`st-desc-${i}`} rows={2} lang={locale} dir={directionOf(locale)} value={s.description} onChange={(e) => update(i, { description: e.target.value })} /></Field>
              <Field label={`${t("stopInstructions")} (${locale})`} htmlFor={`st-ins-${i}`}><Textarea id={`st-ins-${i}`} rows={2} lang={locale} dir={directionOf(locale)} value={s.instructions} onChange={(e) => update(i, { instructions: e.target.value })} /></Field>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <label className="flex items-center gap-1.5"><input type="checkbox" checked={s.exact} onChange={(e) => update(i, { exact: e.target.checked })} /> {t("exact")}</label>
              <label className="flex items-center gap-1.5"><input type="checkbox" checked={s.included} onChange={(e) => update(i, { included: e.target.checked })} /> {t("included")}</label>
              <Field label={t("duration")} htmlFor={`st-dur-${i}`} className="w-32"><Input id={`st-dur-${i}`} dir="ltr" value={s.durationMinutes} onChange={(e) => update(i, { durationMinutes: e.target.value })} /></Field>
              <Button type="button" size="sm" variant="ghost" onClick={() => setStops(stops.filter((_, j) => j !== i))}>{t("remove")}</Button>
            </div>
          </li>
        ))}
      </ol>
      <Button type="button" size="sm" variant="outline" onClick={() => {
        const day = stops.length ? Number(stops[stops.length - 1].day) || 1 : 1;
        const pos = stops.filter((s) => Number(s.day) === day).length + 1;
        setStops([...stops, { day: String(day), position: String(pos), type: "activity", lat: "", lng: "", exact: true, startTime: "", durationMinutes: "", transportMode: "", included: true, title: "", description: "", instructions: "" }]);
      }}>{t("add")}</Button>
      <p className="text-muted-foreground text-xs">{t("materialHint")}</p>
    </Section>
  );
}
