"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

import { isIsoDate, isoToParts, weekStartForLocale, type CalendarId } from "../../domain/calendar";
import { addBlackoutAction, addPriceRuleAction, addScheduleRuleAction, materializeDeparturesAction, removeBlackoutAction } from "../../server/admin/actions";
import type { TourBundle } from "../../server/admin/queries";

import { currencyLabel, formatPrice, MoneyInput, OptionSelect, pickLabel, useAdminDates } from "./inputs";
import { CalendarDateField, EmptyState, Field, NativeSelect, ReasonAction, Section, StatusBadge, useAdminAction } from "./primitives";
import { TOURS_PLATFORM_BASE } from "./paths";

/** ISO weekdays (1 = Monday … 7 = Sunday) in the locale's week order: Saturday first for fa/ar. */
function weekdayOrder(locale: string): number[] {
  const first = weekStartForLocale(locale);
  return Array.from({ length: 7 }, (_, i) => ((first - 1 + i) % 7) + 1);
}

/** ISO (Gregorian) date → the same day written in the Jalali calendar ("1405-08-06"). */
function isoToJalali(iso: string): string {
  const p = isoToParts(iso, "persian");
  return `${p.year}-${String(p.month).padStart(2, "0")}-${String(p.day).padStart(2, "0")}`;
}

/** The calendar a rule is stored in. "Day N of the month" is a Jalali month day; other kinds are plain dates. */
const ruleCalendar = (kind: "once" | "weekly" | "monthly_day"): CalendarId => (kind === "monthly_day" ? "persian" : "gregory");

/**
 * Schedules, blackouts and price rules (S-065, S-068, AT-32). Admins pick dates on
 * a Jalali calendar; the picker yields ISO dates, sent with calendar "gregory".
 * Monthly rules repeat on a Jalali month day, so they are stored in the Persian
 * calendar and their start/end dates are converted to Jalali before sending.
 */
export function ScheduleTab({ bundle }: { bundle: TourBundle }) {
  const t = useTranslations("TourAdmin.schedule");
  const tc = useTranslations("TourShared.calendar");
  const tds = useTranslations("TourShared.departureStatus");
  const locale = useLocale();
  const dates = useAdminDates();
  const { run, pending } = useAdminAction();
  const core = bundle.core;
  const currency = core.currency_code as string;
  const [rule, setRule] = useState({ kind: "weekly" as "once" | "weekly" | "monthly_day", weekdays: [5] as number[], monthDay: "1", localTime: "08:00", startDate: "", endDate: "", capacity: "12", optionId: "" });
  const [bo, setBo] = useState({ from: "", to: "", reason: "" });
  const [pr, setPr] = useState({ from: "", to: "", kind: "percent" as "percent" | "amount_delta", value: "-10", amount: "", sign: "-1" as "1" | "-1", note: "", optionId: "" });
  const day = (iso: string) => dates.date(iso);
  const wd = (n: number) => new Intl.DateTimeFormat(locale, { weekday: "short", timeZone: "UTC" }).format(new Date(Date.UTC(2024, 0, n)));
  const num = (n: number) => new Intl.NumberFormat(locale).format(n);
  const optionLabel = (o: { id: string; code: string }) => {
    const labels: Record<string, string> = {};
    for (const c of bundle.content) if (c.entity_type === "option" && c.entity_id === o.id && c.field_key === "label" && (c.draft_value ?? c.published_value)) labels[c.locale as string] = (c.draft_value ?? c.published_value) as string;
    return pickLabel(labels, locale, o.code);
  };
  const activeOptions = bundle.options.filter((o) => o.is_active).map((o) => ({ value: o.id as string, label: optionLabel(o), hint: o.code as string }));
  const toggleWeekday = (n: number) => setRule({ ...rule, weekdays: rule.weekdays.includes(n) ? rule.weekdays.filter((x) => x !== n) : [...rule.weekdays, n] });
  const ruleDate = (iso: string, calendar: CalendarId) => (calendar === "persian" && isIsoDate(iso) ? isoToJalali(iso) : iso);

  return (
    <div className="space-y-4">
      <Section id="rules" title={t("rules")} description={t("rulesHint", { tz: core.timezone })}
        actions={<Button type="button" size="sm" variant="outline" disabled={pending} onClick={() => run(() => materializeDeparturesAction(core.id), { success: t("materialized") })}>{t("materialize")}</Button>}>
        <form className="grid gap-3 md:grid-cols-4" onSubmit={(e) => {
          e.preventDefault();
          const calendar = ruleCalendar(rule.kind);
          run(() => addScheduleRuleAction(core.id, {
            optionId: rule.optionId || null, calendar, kind: rule.kind, weekdays: rule.kind === "weekly" ? rule.weekdays : [],
            monthDay: rule.kind === "monthly_day" ? Number(rule.monthDay) : null, localTime: rule.localTime, startDate: ruleDate(rule.startDate, calendar),
            endDate: rule.endDate ? ruleDate(rule.endDate, calendar) : null, capacity: Number(rule.capacity),
          }), { success: t("ruleAdded") });
        }}>
          <Field label={t("kind")} htmlFor="r-kind">
            <NativeSelect id="r-kind" value={rule.kind} onChange={(e) => setRule({ ...rule, kind: e.target.value as typeof rule.kind })}>
              <option value="once">{t("once")}</option><option value="weekly">{t("weekly")}</option><option value="monthly_day">{t("monthly", { calendar: tc("persian") })}</option>
            </NativeSelect>
          </Field>
          {rule.kind === "weekly" ? (
            <fieldset className="md:col-span-3">
              <legend className="mb-1.5 text-sm font-medium">{t("weekdays")}</legend>
              <div className="flex flex-wrap gap-1.5">
                {weekdayOrder(locale).map((n) => {
                  const on = rule.weekdays.includes(n);
                  return (
                    <Button key={n} type="button" size="sm" variant={on ? "default" : "outline"} aria-pressed={on} data-weekday={n}
                      className={cn("min-w-14", !on && "text-muted-foreground")} onClick={() => toggleWeekday(n)}>
                      {wd(n)}
                    </Button>
                  );
                })}
              </div>
            </fieldset>
          ) : null}
          {rule.kind === "monthly_day" ? (
            <Field label={t("monthDay")} htmlFor="r-mday">
              <NativeSelect id="r-mday" value={rule.monthDay} onChange={(e) => setRule({ ...rule, monthDay: e.target.value })}>
                {Array.from({ length: 31 }, (_, i) => i + 1).map((n) => <option key={n} value={String(n)}>{num(n)}</option>)}
              </NativeSelect>
            </Field>
          ) : null}
          <Field label={t("localTime", { tz: core.timezone })} htmlFor="r-time"><Input id="r-time" type="time" step={60} dir="ltr" value={rule.localTime} onChange={(e) => setRule({ ...rule, localTime: e.target.value.slice(0, 5) })} /></Field>
          <CalendarDateField id="r-start" label={t("startDate")} value={rule.startDate} onChange={(v) => setRule({ ...rule, startDate: v })} required />
          <CalendarDateField id="r-end" label={t("endDate")} value={rule.endDate} onChange={(v) => setRule({ ...rule, endDate: v })} />
          <Field label={t("capacity")} htmlFor="r-cap"><Input id="r-cap" dir="ltr" inputMode="numeric" value={rule.capacity} onChange={(e) => setRule({ ...rule, capacity: e.target.value })} /></Field>
          <Field label={t("option")} htmlFor="r-option">
            <OptionSelect id="r-option" value={rule.optionId} onChange={(v) => setRule({ ...rule, optionId: v })} options={activeOptions} placeholder={t("allOptions")} />
          </Field>
          <div className="flex items-end"><Button type="submit" disabled={pending || !rule.startDate || (rule.kind === "weekly" && rule.weekdays.length === 0)}>{t("addRule")}</Button></div>
        </form>
        <ul className="space-y-1 text-sm">
          {bundle.rules.map((r) => (
            <li key={r.id} className="rounded border px-3 py-2">
              {t(`kindLabel.${r.kind}`)} · {tc(r.calendar)} · <span dir="ltr">{String(r.local_time).slice(0, 5)}</span> · {t("from")} {day(r.start_date)}{r.end_date ? ` ${t("to")} ${day(r.end_date)}` : ""} · {t("capacity")}: {r.capacity}
              {r.kind === "weekly" ? ` · ${weekdayOrder(locale).filter((n) => (r.weekdays as number[]).includes(n)).map(wd).join("، ")}` : r.kind === "monthly_day" ? ` · ${t("monthDay")}: ${num(r.month_day)}` : ""}
              {!r.is_active ? ` · ${t("inactive")}` : ""}
            </li>
          ))}
        </ul>
      </Section>

      <Section id="blackouts" title={t("blackouts")} description={t("blackoutsHint")}>
        <form className="grid gap-3 md:grid-cols-4" onSubmit={(e) => {
          e.preventDefault();
          run(() => addBlackoutAction(core.id, { from: bo.from, to: bo.to || bo.from, calendar: "gregory", reason: bo.reason || undefined }), { success: t("blackoutAdded"), onSuccess: () => setBo({ from: "", to: "", reason: "" }) });
        }}>
          <CalendarDateField id="bo-from" label={t("from")} value={bo.from} onChange={(v) => setBo({ ...bo, from: v })} required />
          <CalendarDateField id="bo-to" label={t("to")} value={bo.to} onChange={(v) => setBo({ ...bo, to: v })} />
          <Field label={t("reasonLabel")} htmlFor="bo-reason"><Input id="bo-reason" value={bo.reason} onChange={(e) => setBo({ ...bo, reason: e.target.value })} /></Field>
          <div className="flex items-end"><Button type="submit" disabled={pending || !bo.from}>{t("addBlackout")}</Button></div>
        </form>
        {bundle.blackouts.length === 0 ? <EmptyState>{t("noBlackouts")}</EmptyState> : (
          <ul className="space-y-2 text-sm">
            {bundle.blackouts.map((b) => (
              <li key={b.id} className="flex flex-wrap items-center gap-2 rounded border px-3 py-2" data-blackout-from={b.date_from}>
                <span>{day(b.date_from)} – {day(b.date_to)}</span>
                {b.reason ? <span>· {b.reason}</span> : null}
                <ReasonAction label={t("removeBlackout")} onConfirm={(reason) => run(() => removeBlackoutAction({ blackoutId: b.id, reason }))} />
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section id="price-rules" title={t("priceRules")} description={t("priceRulesHint", { currency: currencyLabel(currency, locale) })}>
        <form className="grid gap-3 md:grid-cols-4" onSubmit={(e) => {
          e.preventDefault();
          const value = pr.kind === "percent" ? Number(pr.value) : Number(pr.sign) * Number(pr.amount || 0);
          run(() => addPriceRuleAction(core.id, { optionId: pr.optionId || null, from: pr.from, to: pr.to || pr.from, calendar: "gregory", kind: pr.kind, value, note: pr.note || undefined }), { success: t("priceRuleAdded") });
        }}>
          <CalendarDateField id="pr-from" label={t("from")} value={pr.from} onChange={(v) => setPr({ ...pr, from: v })} required />
          <CalendarDateField id="pr-to" label={t("to")} value={pr.to} onChange={(v) => setPr({ ...pr, to: v })} />
          <Field label={t("adjustment")} htmlFor="pr-kind">
            <NativeSelect id="pr-kind" value={pr.kind} onChange={(e) => setPr({ ...pr, kind: e.target.value as typeof pr.kind })}>
              <option value="percent">{t("percent")}</option><option value="amount_delta">{t("amountDelta", { currency: currencyLabel(currency, locale) })}</option>
            </NativeSelect>
          </Field>
          {pr.kind === "percent" ? (
            <Field label={t("value")} htmlFor="pr-value"><Input id="pr-value" dir="ltr" inputMode="decimal" value={pr.value} onChange={(e) => setPr({ ...pr, value: e.target.value })} /></Field>
          ) : (
            <div className="grid grid-cols-[auto_1fr] items-end gap-2">
              <Field label={t("direction")} htmlFor="pr-sign">
                <NativeSelect id="pr-sign" value={pr.sign} onChange={(e) => setPr({ ...pr, sign: e.target.value as typeof pr.sign })}>
                  <option value="1">{t("increase")}</option><option value="-1">{t("decrease")}</option>
                </NativeSelect>
              </Field>
              <Field label={t("value")} htmlFor="pr-value"><MoneyInput id="pr-value" value={pr.amount} currency={currency} onChange={(v) => setPr({ ...pr, amount: v })} /></Field>
            </div>
          )}
          <Field label={t("note")} htmlFor="pr-note"><Input id="pr-note" value={pr.note} onChange={(e) => setPr({ ...pr, note: e.target.value })} /></Field>
          <div className="flex items-end"><Button type="submit" disabled={pending || !pr.from || (pr.kind === "amount_delta" && !Number(pr.amount))}>{t("addPriceRule")}</Button></div>
        </form>
        <ul className="space-y-1 text-sm">
          {bundle.priceRules.map((r) => (
            <li key={r.id} className="rounded border px-3 py-2">
              {day(r.date_from)} – {day(r.date_to)} · <span dir={r.kind === "percent" ? "ltr" : undefined}>{r.kind === "percent" ? `${r.value}%` : formatPrice(r.value, currency, locale)}</span>
              {r.note ? ` · ${r.note}` : ""}
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
                      <div className="text-muted-foreground text-xs">{d.starts_at ? dates.instant(d.starts_at, d.timezone ?? core.timezone, true) : ""}</div></td>
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
