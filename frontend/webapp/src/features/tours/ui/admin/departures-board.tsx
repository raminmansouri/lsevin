"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Link } from "@/i18n/navigation";

import { CALENDAR_IDS, formatInstant, formatIsoDate, type CalendarId } from "../../domain/calendar";
import { directionOf } from "../../domain/content";
import { cancelDepartureAction, delayDepartureAction, disableTrackingAction, overrideCapacityAction, setDepartureBlockedAction } from "../../server/admin/actions";

import { CalendarDateField, EmptyState, Field, NativeSelect, ReasonAction, StatusBadge, useAdminAction, useErrorText } from "./primitives";
import { TOURS_PLATFORM_BASE } from "./paths";

type Row = {
  id: string; tour_id: string; slug: string; title: string | null; starts_on: string; local_start_time: string | null; starts_at: string | null; timezone: string;
  capacity: number; booked_count: number; held_count: number; status: string; is_blocked: boolean; delay_minutes: number; status_reason: string | null;
  provider_name: string; waitlist: number; checked_in: number; assignments: { role: string; name: string; status: string }[]; tracking_active: boolean;
};

const CANCEL_REASONS = ["weather", "insufficient_participants", "safety", "operator_unavailable", "force_majeure", "admin_decision"];

/** Departures across all providers (M-013, M-014) with audited admin overrides (M-015, M-019). */
export function DeparturesBoard({ filters, board, error, providers, locales }: {
  filters: Record<string, string>; board: { rows: Row[]; total: number; page: number; range: { from: string | null; to: string | null } } | null;
  error: { kind: string; code: string } | null; providers: { id: string; name: string }[]; locales: string[];
}) {
  const t = useTranslations("TourAdmin.departures");
  const tc = useTranslations("TourShared.calendar");
  const tds = useTranslations("TourShared.departureStatus");
  const locale = useLocale();
  const errorText = useErrorText();
  const [calendar, setCalendar] = useState<CalendarId>((CALENDAR_IDS as readonly string[]).includes(filters.calendar) ? (filters.calendar as CalendarId) : locale === "fa" ? "persian" : "gregory");
  const [from, setFrom] = useState(filters.from ?? "");
  const [to, setTo] = useState(filters.to ?? "");
  const [open, setOpen] = useState<string | null>(null);
  return (
    <div className="space-y-4">
      <form method="get" className="grid gap-3 rounded-lg border p-4 md:grid-cols-3 xl:grid-cols-6" aria-label={t("filters")}>
        {filters.tour ? <input type="hidden" name="tour" value={filters.tour} /> : null}
        <Field label={tc("label")} htmlFor="d-cal">
          <NativeSelect id="d-cal" name="calendar" value={calendar} onChange={(e) => setCalendar(e.target.value as CalendarId)}>
            {CALENDAR_IDS.map((c) => <option key={c} value={c}>{tc(c)}</option>)}
          </NativeSelect>
        </Field>
        <CalendarDateField id="d-from" label={t("from")} value={from} onChange={setFrom} calendar={calendar} />
        <input type="hidden" name="from" value={from} />
        <CalendarDateField id="d-to" label={t("to")} value={to} onChange={setTo} calendar={calendar} />
        <input type="hidden" name="to" value={to} />
        <Field label={t("provider")} htmlFor="d-provider">
          <NativeSelect id="d-provider" name="provider" defaultValue={filters.provider ?? ""}>
            <option value="">{t("all")}</option>{providers.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </NativeSelect>
        </Field>
        <Field label={t("status")} htmlFor="d-status">
          <NativeSelect id="d-status" name="status" defaultValue={filters.status ?? ""}>
            <option value="">{t("all")}</option>
            {["scheduled", "delayed", "in_progress", "completed", "cancelled"].map((s) => <option key={s} value={s}>{tds(s)}</option>)}
            <option value="blocked">{t("blocked")}</option>
          </NativeSelect>
        </Field>
        <div className="flex items-end gap-2"><Button type="submit">{t("apply")}</Button></div>
      </form>
      {error ? <p role="alert" className="text-destructive text-sm">{errorText(error)}</p> : null}
      {board && board.rows.length === 0 ? <EmptyState>{t("empty")}</EmptyState> : null}
      {board && board.rows.length > 0 ? (
        <div className="space-y-2">
          {board.rows.map((d) => (
            <div key={d.id} className="rounded-lg border p-3" data-departure-id={d.id} data-status={d.status}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="space-y-0.5">
                  <Link href={`${TOURS_PLATFORM_BASE}/tours/${d.tour_id}?tab=schedule`} className="font-medium hover:underline">{d.title ?? d.slug}</Link>
                  <div className="text-sm">
                    {formatIsoDate(d.starts_on, { locale, calendar, style: "full" })} <span dir="ltr">{d.local_start_time ? d.local_start_time.slice(0, 5) : ""}</span>
                    <span className="text-muted-foreground"> · {d.timezone}</span>
                    {d.starts_at ? <span className="text-muted-foreground text-xs"> ({formatInstant(d.starts_at, { locale, calendar, timeZone: d.timezone, withZone: true })})</span> : null}
                  </div>
                  <div className="text-muted-foreground text-xs">{d.provider_name}</div>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <StatusBadge status={d.status} label={tds(d.status)} />
                  {d.is_blocked ? <StatusBadge status="cancelled" label={t("blocked")} /> : null}
                  {d.delay_minutes ? <span className="text-amber-700">+{d.delay_minutes}′</span> : null}
                  {d.tracking_active ? <StatusBadge status="pending" label={t("trackingLive")} /> : null}
                </div>
              </div>
              <dl className="mt-2 grid grid-cols-3 gap-2 text-sm sm:grid-cols-6" data-testid="departure-counts">
                <div><dt className="text-muted-foreground text-xs">{t("capacity")}</dt><dd className="tabular-nums" data-k="capacity">{d.capacity}</dd></div>
                <div><dt className="text-muted-foreground text-xs">{t("booked")}</dt><dd className="tabular-nums" data-k="booked">{d.booked_count}</dd></div>
                <div><dt className="text-muted-foreground text-xs">{t("held")}</dt><dd className="tabular-nums" data-k="held">{d.held_count}</dd></div>
                <div><dt className="text-muted-foreground text-xs">{t("waitlist")}</dt><dd className="tabular-nums">{d.waitlist}</dd></div>
                <div><dt className="text-muted-foreground text-xs">{t("checkedIn")}</dt><dd className="tabular-nums">{d.checked_in}</dd></div>
                <div><dt className="text-muted-foreground text-xs">{t("assigned")}</dt><dd className="text-xs">{d.assignments.map((a) => `${a.name} (${a.role})`).join(", ") || "—"}</dd></div>
              </dl>
              <div className="mt-2 flex flex-wrap gap-2">
                <Link href={`${TOURS_PLATFORM_BASE}/bookings?departure=${d.id}`} className="inline-flex h-8 items-center text-sm underline">{t("bookings")}</Link>
                {d.status !== "cancelled" && d.status !== "completed" ? (
                  <Button type="button" size="sm" variant={open === d.id ? "secondary" : "outline"} onClick={() => setOpen(open === d.id ? null : d.id)} data-testid="manage-departure">
                    {t("manage")}
                  </Button>
                ) : null}
              </div>
              {open === d.id ? <DepartureActions row={d} locales={locales} reasons={CANCEL_REASONS} /> : null}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function NoticeEditor({ locales, value, onChange, idPrefix }: { locales: string[]; value: { sourceLocale: string; texts: Record<string, { title: string; body: string }> }; onChange: (v: typeof value) => void; idPrefix: string }) {
  const t = useTranslations("TourAdmin.departures");
  return (
    <fieldset className="space-y-2 rounded-md border p-2">
      <legend className="px-1 text-sm font-medium">{t("notice")}</legend>
      <Field label={t("noticeSource")} htmlFor={`${idPrefix}-src`}>
        <NativeSelect id={`${idPrefix}-src`} value={value.sourceLocale} onChange={(e) => onChange({ ...value, sourceLocale: e.target.value })}>
          {locales.map((l) => <option key={l} value={l}>{l}</option>)}
        </NativeSelect>
      </Field>
      <div className="grid gap-2 md:grid-cols-2">
        {locales.slice(0, 4).map((l) => (
          <div key={l} className="space-y-1">
            <Input aria-label={t("noticeTitle", { locale: l })} placeholder={`${t("noticeTitlePh")} (${l})`} lang={l} dir={directionOf(l)} value={value.texts[l]?.title ?? ""}
              onChange={(e) => onChange({ ...value, texts: { ...value.texts, [l]: { title: e.target.value, body: value.texts[l]?.body ?? "" } } })} />
            <Textarea aria-label={t("noticeBody", { locale: l })} rows={2} placeholder={`${t("noticeBodyPh")} (${l})`} lang={l} dir={directionOf(l)} value={value.texts[l]?.body ?? ""}
              onChange={(e) => onChange({ ...value, texts: { ...value.texts, [l]: { title: value.texts[l]?.title ?? "", body: e.target.value } } })} />
          </div>
        ))}
      </div>
      <p className="text-muted-foreground text-xs">{t("noticeHint")}</p>
    </fieldset>
  );
}

function DepartureActions({ row, locales, reasons }: { row: Row; locales: string[]; reasons: string[] }) {
  const t = useTranslations("TourAdmin.departures");
  const { run, pending } = useAdminAction();
  const [capacity, setCapacity] = useState(String(row.capacity));
  const [minutes, setMinutes] = useState("30");
  const [reasonCode, setReasonCode] = useState(reasons[0]);
  const [notice, setNotice] = useState({ sourceLocale: locales[0] ?? "fa-IR", texts: {} as Record<string, { title: string; body: string }> });
  return (
    <div className="bg-muted/30 mt-3 space-y-3 rounded-md border p-3" data-testid="departure-actions">
      <div className="flex flex-wrap items-start gap-2">
        <ReasonAction label={row.is_blocked ? t("unblock") : t("block")} testId="toggle-block"
          onConfirm={(reason) => run(() => setDepartureBlockedAction({ departureId: row.id, blocked: !row.is_blocked, reason }))} />
        <ReasonAction label={t("overrideCapacity")} testId="override-capacity"
          onConfirm={(reason) => run(() => overrideCapacityAction({ departureId: row.id, capacity, reason }))}>
          <Field label={t("newCapacity", { min: row.booked_count + row.held_count })} htmlFor={`cap-${row.id}`}><Input id={`cap-${row.id}`} dir="ltr" value={capacity} onChange={(e) => setCapacity(e.target.value)} /></Field>
        </ReasonAction>
        {row.tracking_active ? (
          <ReasonAction label={t("disableTracking")} variant="destructive" testId="disable-tracking"
            onConfirm={(reason) => run(() => disableTrackingAction({ departureId: row.id, reason }))} />
        ) : null}
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        <ReasonAction label={t("delay")} testId="delay"
          onConfirm={(reason) => run(() => delayDepartureAction({ departureId: row.id, minutes, reason, notice }), { success: t("delayed") })}>
          <Field label={t("delayMinutes")} htmlFor={`dl-${row.id}`}><Input id={`dl-${row.id}`} dir="ltr" value={minutes} onChange={(e) => setMinutes(e.target.value)} /></Field>
          <NoticeEditor locales={locales} value={notice} onChange={setNotice} idPrefix={`dln-${row.id}`} />
        </ReasonAction>
        <ReasonAction label={t("cancel")} variant="destructive" testId="cancel-departure"
          onConfirm={(reason) => run(() => cancelDepartureAction({ departureId: row.id, reasonCode, reason, notice }), { success: t("cancelled") })}>
          <p className="text-destructive text-sm">{t("cancelWarning", { booked: row.booked_count, held: row.held_count })}</p>
          <Field label={t("reasonCode")} htmlFor={`rc-${row.id}`}>
            <NativeSelect id={`rc-${row.id}`} value={reasonCode} onChange={(e) => setReasonCode(e.target.value)}>
              {reasons.map((r) => <option key={r} value={r}>{t(`reasons.${r}`)}</option>)}
            </NativeSelect>
          </Field>
          <NoticeEditor locales={locales} value={notice} onChange={setNotice} idPrefix={`cn-${row.id}`} />
        </ReasonAction>
      </div>
      {pending ? <p className="text-muted-foreground text-xs">{t("working")}</p> : null}
    </div>
  );
}
