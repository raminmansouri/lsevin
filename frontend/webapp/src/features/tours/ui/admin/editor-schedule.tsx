"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "@/i18n/navigation";

import { formatInstant, formatIsoDate, type CalendarId } from "../../domain/calendar";
import { addBlackoutAction, addPriceRuleAction, addScheduleRuleAction, materializeDeparturesAction, removeBlackoutAction } from "../../server/admin/actions";
import type { TourBundle } from "../../server/admin/queries";

import { CalendarDateField, CalendarSelect, EmptyState, Field, NativeSelect, ReasonAction, Section, StatusBadge, useAdminAction } from "./primitives";
import { TOURS_PLATFORM_BASE } from "./paths";

const WEEKDAYS = [1, 2, 3, 4, 5, 6, 7];

/** Schedules, blackouts and price rules typed in any of the three calendars, stored canonically (S-065, S-068, AT-32). */
export function ScheduleTab({ bundle }: { bundle: TourBundle }) {
  const t = useTranslations("TourAdmin.schedule");
  const tc = useTranslations("TourShared.calendar");
  const tds = useTranslations("TourShared.departureStatus");
  const locale = useLocale();
  const { run, pending } = useAdminAction();
  const core = bundle.core;
  const [calendar, setCalendar] = useState<CalendarId>(locale === "fa" ? "persian" : locale === "ar" ? "islamic-umalqura" : "gregory");
  const [rule, setRule] = useState({ kind: "weekly" as "once" | "weekly" | "monthly_day", weekdays: [5] as number[], monthDay: "1", localTime: "08:00", startDate: "", endDate: "", capacity: "12", optionId: "" });
  const [bo, setBo] = useState({ from: "", to: "", reason: "" });
  const [pr, setPr] = useState({ from: "", to: "", kind: "percent" as "percent" | "amount_delta", value: "-10", note: "", optionId: "" });
  const day = (iso: string) => `${formatIsoDate(iso, { locale, calendar })}`;
  const wd = (n: number) => new Intl.DateTimeFormat(locale, { weekday: "short", timeZone: "UTC" }).format(new Date(Date.UTC(2024, 0, n)));

  return (
    <div className="space-y-4">
      <div className="max-w-xs"><CalendarSelect id="sch-calendar" value={calendar} onChange={setCalendar} label={t("entryCalendar")} /></div>

      <Section id="rules" title={t("rules")} description={t("rulesHint", { tz: core.timezone })}
        actions={<Button type="button" size="sm" variant="outline" disabled={pending} onClick={() => run(() => materializeDeparturesAction(core.id), { success: t("materialized") })}>{t("materialize")}</Button>}>
        <form className="grid gap-3 md:grid-cols-4" onSubmit={(e) => {
          e.preventDefault();
          run(() => addScheduleRuleAction(core.id, {
            optionId: rule.optionId || null, calendar, kind: rule.kind, weekdays: rule.kind === "weekly" ? rule.weekdays : [],
            monthDay: rule.kind === "monthly_day" ? Number(rule.monthDay) : null, localTime: rule.localTime, startDate: rule.startDate,
            endDate: rule.endDate || null, capacity: Number(rule.capacity),
          }), { success: t("ruleAdded") });
        }}>
          <Field label={t("kind")} htmlFor="r-kind">
            <NativeSelect id="r-kind" value={rule.kind} onChange={(e) => setRule({ ...rule, kind: e.target.value as typeof rule.kind })}>
              <option value="once">{t("once")}</option><option value="weekly">{t("weekly")}</option><option value="monthly_day">{t("monthly", { calendar: tc(calendar) })}</option>
            </NativeSelect>
          </Field>
          {rule.kind === "weekly" ? (
            <fieldset className="md:col-span-3">
              <legend className="text-sm font-medium">{t("weekdays")}</legend>
              <div className="flex flex-wrap gap-3">
                {WEEKDAYS.map((n) => (
                  <label key={n} className="flex items-center gap-1 text-sm">
                    <input type="checkbox" checked={rule.weekdays.includes(n)} onChange={(e) => setRule({ ...rule, weekdays: e.target.checked ? [...rule.weekdays, n] : rule.weekdays.filter((x) => x !== n) })} /> {wd(n)}
                  </label>
                ))}
              </div>
            </fieldset>
          ) : null}
          {rule.kind === "monthly_day" ? <Field label={t("monthDay")} htmlFor="r-mday"><Input id="r-mday" dir="ltr" value={rule.monthDay} onChange={(e) => setRule({ ...rule, monthDay: e.target.value })} /></Field> : null}
          <Field label={t("localTime", { tz: core.timezone })} htmlFor="r-time"><Input id="r-time" dir="ltr" value={rule.localTime} onChange={(e) => setRule({ ...rule, localTime: e.target.value })} /></Field>
          <CalendarDateField id="r-start" label={t("startDate")} value={rule.startDate} onChange={(v) => setRule({ ...rule, startDate: v })} calendar={calendar} required />
          <CalendarDateField id="r-end" label={t("endDate")} value={rule.endDate} onChange={(v) => setRule({ ...rule, endDate: v })} calendar={calendar} />
          <Field label={t("capacity")} htmlFor="r-cap"><Input id="r-cap" dir="ltr" value={rule.capacity} onChange={(e) => setRule({ ...rule, capacity: e.target.value })} /></Field>
          <Field label={t("option")} htmlFor="r-option">
            <NativeSelect id="r-option" value={rule.optionId} onChange={(e) => setRule({ ...rule, optionId: e.target.value })}>
              <option value="">{t("allOptions")}</option>
              {bundle.options.filter((o) => o.is_active).map((o) => <option key={o.id} value={o.id}>{o.code}</option>)}
            </NativeSelect>
          </Field>
          <div className="flex items-end"><Button type="submit" disabled={pending || !rule.startDate}>{t("addRule")}</Button></div>
        </form>
        <ul className="space-y-1 text-sm">
          {bundle.rules.map((r) => (
            <li key={r.id} className="rounded border px-3 py-2">
              {t(`kindLabel.${r.kind}`)} · {tc(r.calendar)} · <span dir="ltr">{String(r.local_time).slice(0, 5)}</span> · {t("from")} {day(r.start_date)}{r.end_date ? ` ${t("to")} ${day(r.end_date)}` : ""} · {t("capacity")}: {r.capacity}
              {r.kind === "weekly" ? ` · ${(r.weekdays as number[]).map(wd).join("، ")}` : r.kind === "monthly_day" ? ` · ${t("monthDay")}: ${r.month_day}` : ""}
              {!r.is_active ? ` · ${t("inactive")}` : ""}
            </li>
          ))}
        </ul>
      </Section>

      <Section id="blackouts" title={t("blackouts")} description={t("blackoutsHint")}>
        <form className="grid gap-3 md:grid-cols-4" onSubmit={(e) => {
          e.preventDefault();
          run(() => addBlackoutAction(core.id, { from: bo.from, to: bo.to || bo.from, calendar, reason: bo.reason || undefined }), { success: t("blackoutAdded"), onSuccess: () => setBo({ from: "", to: "", reason: "" }) });
        }}>
          <CalendarDateField id="bo-from" label={t("from")} value={bo.from} onChange={(v) => setBo({ ...bo, from: v })} calendar={calendar} required />
          <CalendarDateField id="bo-to" label={t("to")} value={bo.to} onChange={(v) => setBo({ ...bo, to: v })} calendar={calendar} />
          <Field label={t("reasonLabel")} htmlFor="bo-reason"><Input id="bo-reason" value={bo.reason} onChange={(e) => setBo({ ...bo, reason: e.target.value })} /></Field>
          <div className="flex items-end"><Button type="submit" disabled={pending || !bo.from}>{t("addBlackout")}</Button></div>
        </form>
        {bundle.blackouts.length === 0 ? <EmptyState>{t("noBlackouts")}</EmptyState> : (
          <ul className="space-y-2 text-sm">
            {bundle.blackouts.map((b) => (
              <li key={b.id} className="flex flex-wrap items-center gap-2 rounded border px-3 py-2" data-blackout-from={b.date_from}>
                <span>{day(b.date_from)} – {day(b.date_to)}</span>
                <span className="text-muted-foreground font-mono text-xs" dir="ltr">{b.date_from}…{b.date_to}</span>
                <span className="text-muted-foreground text-xs">{t("enteredIn", { calendar: tc(b.entered_calendar) })}</span>
                {b.reason ? <span>· {b.reason}</span> : null}
                <ReasonAction label={t("removeBlackout")} onConfirm={(reason) => run(() => removeBlackoutAction({ blackoutId: b.id, reason }))} />
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section id="price-rules" title={t("priceRules")} description={t("priceRulesHint", { currency: core.currency_code })}>
        <form className="grid gap-3 md:grid-cols-4" onSubmit={(e) => {
          e.preventDefault();
          run(() => addPriceRuleAction(core.id, { optionId: pr.optionId || null, from: pr.from, to: pr.to || pr.from, calendar, kind: pr.kind, value: Number(pr.value), note: pr.note || undefined }), { success: t("priceRuleAdded") });
        }}>
          <CalendarDateField id="pr-from" label={t("from")} value={pr.from} onChange={(v) => setPr({ ...pr, from: v })} calendar={calendar} required />
          <CalendarDateField id="pr-to" label={t("to")} value={pr.to} onChange={(v) => setPr({ ...pr, to: v })} calendar={calendar} />
          <Field label={t("adjustment")} htmlFor="pr-kind">
            <NativeSelect id="pr-kind" value={pr.kind} onChange={(e) => setPr({ ...pr, kind: e.target.value as typeof pr.kind })}>
              <option value="percent">{t("percent")}</option><option value="amount_delta">{t("amountDelta", { currency: core.currency_code })}</option>
            </NativeSelect>
          </Field>
          <Field label={t("value")} htmlFor="pr-value"><Input id="pr-value" dir="ltr" value={pr.value} onChange={(e) => setPr({ ...pr, value: e.target.value })} /></Field>
          <Field label={t("note")} htmlFor="pr-note"><Input id="pr-note" value={pr.note} onChange={(e) => setPr({ ...pr, note: e.target.value })} /></Field>
          <div className="flex items-end"><Button type="submit" disabled={pending || !pr.from}>{t("addPriceRule")}</Button></div>
        </form>
        <ul className="space-y-1 text-sm">
          {bundle.priceRules.map((r) => (
            <li key={r.id} className="rounded border px-3 py-2">
              {day(r.date_from)} – {day(r.date_to)} · <span dir="ltr">{r.kind === "percent" ? `${r.value}%` : `${r.value} ${core.currency_code}`}</span>
              <span className="text-muted-foreground"> · {t("enteredIn", { calendar: tc(r.entered_calendar) })}</span>{r.note ? ` · ${r.note}` : ""}
            </li>
          ))}
        </ul>
      </Section>

      <Section id="departures" title={t("departures")}
        actions={<Link href={`${TOURS_PLATFORM_BASE}/departures?tour=${core.id}`} className="text-sm underline">{t("openBoard")}</Link>}>
        {bundle.departures.length === 0 ? <EmptyState>{t("noDepartures")}</EmptyState> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-muted-foreground"><th className="p-1.5 text-start">{t("when")}</th><th className="p-1.5 text-start">{t("capacity")}</th><th className="p-1.5 text-start">{t("booked")}</th><th className="p-1.5 text-start">{t("held")}</th><th className="p-1.5 text-start">{t("status")}</th></tr></thead>
              <tbody>
                {bundle.departures.map((d) => (
                  <tr key={d.id} className="border-t">
                    <td className="p-1.5">{day(d.starts_on)} <span dir="ltr">{d.local_start_time ? String(d.local_start_time).slice(0, 5) : ""}</span>
                      <div className="text-muted-foreground text-xs">{d.starts_at ? formatInstant(d.starts_at, { locale, calendar, timeZone: d.timezone ?? core.timezone, withZone: true }) : ""}</div></td>
                    <td className="p-1.5 tabular-nums">{d.capacity}</td>
                    <td className="p-1.5 tabular-nums">{d.booked_count}</td>
                    <td className="p-1.5 tabular-nums">{d.held_count}</td>
                    <td className="p-1.5"><StatusBadge status={d.status} label={tds(d.status)} />{d.is_blocked ? <span className="ms-1 text-xs text-rose-700">{t("blocked")}</span> : null}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>
    </div>
  );
}
