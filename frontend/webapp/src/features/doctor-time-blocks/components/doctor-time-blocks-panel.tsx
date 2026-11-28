"use client";

import { AlertTriangle, CalendarX, ChevronLeft, ChevronRight, Loader2, Search, Trash2, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

import { addDaysIso } from "../lib/ranges";
import {
  blockRangeAction,
  deleteBlockGroupAction,
  loadDoctorAction,
  loadDoctorDayAction,
  searchDoctorsAction,
  toggleSlotAction,
} from "../server/actions";
import type { ActionResult, BlockGroup, ConflictingBooking, DayView, DoctorOption, DoctorServiceOption, GridSlot } from "../types";
import { timeBlocksCopy, type TimeBlocksCopy } from "./doctor-time-blocks-copy";

type Props = {
  locale: string;
  today: string;
  initialDoctor: DoctorOption | null;
};

type Notice = { tone: "info" | "error" | "success"; text: string } | null;

function errorText(copy: TimeBlocksCopy, error: string) {
  if (error === "invalid_input") return copy.errInvalid;
  if (error === "past") return copy.errPast;
  return copy.errUnexpected;
}

function useDateLabel(locale: string) {
  return useCallback(
    (iso: string | null) => {
      if (!iso) return "";
      const isFa = locale.toLowerCase().startsWith("fa");
      return new Intl.DateTimeFormat(isFa ? "fa-IR-u-ca-persian" : locale, {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        timeZone: "UTC",
      }).format(new Date(`${iso}T12:00:00Z`));
    },
    [locale]
  );
}

function weekdayName(locale: string, isoWeekday: number) {
  // 2024-01-01 was a Monday (ISO weekday 1).
  const date = new Date(Date.UTC(2024, 0, isoWeekday));
  const isFa = locale.toLowerCase().startsWith("fa");
  return new Intl.DateTimeFormat(isFa ? "fa-IR" : locale, { weekday: "long", timeZone: "UTC" }).format(date);
}

export function DoctorTimeBlocksPanel({ locale, today, initialDoctor }: Props) {
  const copy = timeBlocksCopy(locale);
  const dateLabel = useDateLabel(locale);
  const isFa = locale.toLowerCase().startsWith("fa");

  const [doctor, setDoctor] = useState<DoctorOption | null>(initialDoctor);
  const [services, setServices] = useState<DoctorServiceOption[]>([]);
  const [serviceKey, setServiceKey] = useState<string>("");
  const [groups, setGroups] = useState<BlockGroup[]>([]);
  const [date, setDate] = useState(today);
  const [day, setDay] = useState<DayView | null>(null);
  const [loadingDoctor, setLoadingDoctor] = useState(false);
  const [loadingDay, setLoadingDay] = useState(false);
  const [busySlot, setBusySlot] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice>(null);
  const [conflicts, setConflicts] = useState<ConflictingBooking[]>([]);

  const service = useMemo(() => services.find((s) => `${s.providerId}:${s.serviceId}` === serviceKey) ?? null, [services, serviceKey]);

  const reloadDoctor = useCallback(
    async (staffId: string) => {
      const result = await loadDoctorAction({ staffId, locale });
      if (!result.ok) {
        setNotice({ tone: "error", text: errorText(copy, result.error) });
        return null;
      }
      setGroups(result.data.groups);
      return result.data;
    },
    [copy, locale]
  );

  // A new doctor: load their services and upcoming blocks.
  useEffect(() => {
    if (!doctor) return;
    let cancelled = false;
    setLoadingDoctor(true);
    setDay(null);
    setConflicts([]);
    setNotice(null);
    reloadDoctor(doctor.id).then((data) => {
      if (cancelled) return;
      setLoadingDoctor(false);
      const list = data?.services ?? [];
      setServices(list);
      setServiceKey(list[0] ? `${list[0].providerId}:${list[0].serviceId}` : "");
    });
    return () => {
      cancelled = true;
    };
  }, [doctor, reloadDoctor]);

  const reloadDay = useCallback(async () => {
    if (!doctor || !service) {
      setDay(null);
      return;
    }
    setLoadingDay(true);
    const result = await loadDoctorDayAction({ staffId: doctor.id, providerId: service.providerId, serviceId: service.serviceId, date });
    setLoadingDay(false);
    if (!result.ok) {
      setNotice({ tone: "error", text: errorText(copy, result.error) });
      return null;
    }
    setDay(result.data);
    return result.data;
  }, [copy, date, doctor, service]);

  useEffect(() => {
    void reloadDay();
  }, [reloadDay]);

  async function onSlot(slot: GridSlot) {
    if (!doctor || !service) return;
    const key = `${slot.time}-${slot.endTime}`;
    setBusySlot(key);
    setNotice(null);
    const block = slot.state !== "blocked";
    const result = await toggleSlotAction({
      staffId: doctor.id,
      providerId: service.providerId,
      serviceId: service.serviceId,
      date,
      start: slot.time,
      end: slot.endTime,
      block,
    });
    if (!result.ok) {
      setBusySlot(null);
      setNotice({ tone: "error", text: errorText(copy, result.error) });
      return;
    }
    setConflicts(result.data.conflicts);
    const [fresh] = await Promise.all([reloadDay(), reloadDoctor(doctor.id)]);
    setBusySlot(null);
    if (!block) {
      const after = fresh?.slots.find((s) => s.time === slot.time && s.endTime === slot.endTime);
      if (result.data.recurringBlock) setNotice({ tone: "info", text: copy.recurringNotice });
      else if (after?.state === "blocked") setNotice({ tone: "info", text: copy.stillBlocked });
    }
  }

  async function onDeleteGroup(group: BlockGroup) {
    if (!doctor) return;
    const result = await deleteBlockGroupAction({ staffId: doctor.id, ruleIds: group.ruleIds });
    if (!result.ok) {
      setNotice({ tone: "error", text: errorText(copy, result.error) });
      return;
    }
    await Promise.all([reloadDay(), reloadDoctor(doctor.id)]);
  }

  return (
    <div className="space-y-5" dir={isFa ? "rtl" : "ltr"}>
      <section className="rounded-xl border bg-card p-4 shadow-sm">
        {doctor ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs text-muted-foreground">{copy.searchLabel}</p>
              <p className="text-base font-semibold">{doctor.name}</p>
              {doctor.title ? <p className="text-sm text-muted-foreground">{doctor.title}</p> : null}
            </div>
            <Button variant="outline" size="sm" onClick={() => setDoctor(null)}>
              {copy.changeDoctor}
            </Button>
          </div>
        ) : (
          <DoctorSearch copy={copy} locale={locale} onPick={setDoctor} />
        )}
      </section>

      {notice ? <NoticeBox notice={notice} onClose={() => setNotice(null)} /> : null}
      {conflicts.length > 0 ? <ConflictsBox copy={copy} conflicts={conflicts} dateLabel={dateLabel} onClose={() => setConflicts([])} /> : null}

      {doctor && loadingDoctor ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> {copy.loading}
        </p>
      ) : null}

      {doctor && !loadingDoctor ? (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
          <section className="space-y-4 rounded-xl border bg-card p-4 shadow-sm">
            {services.length === 0 ? (
              <p className="text-sm text-muted-foreground">{copy.noServices}</p>
            ) : (
              <>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="space-y-1 text-sm">
                    <span className="font-medium">{copy.serviceLabel}</span>
                    <select
                      className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                      value={serviceKey}
                      onChange={(event) => setServiceKey(event.target.value)}
                    >
                      {services.map((s) => (
                        <option key={`${s.providerId}:${s.serviceId}`} value={`${s.providerId}:${s.serviceId}`}>
                          {s.providerName} — {s.serviceName} ({s.durationMinutes}′)
                        </option>
                      ))}
                    </select>
                    <span className="block text-xs text-muted-foreground">{copy.serviceHelp}</span>
                  </label>
                  <div className="space-y-1 text-sm">
                    <span className="font-medium">{copy.dayLabel}</span>
                    <div className="flex items-center gap-1">
                      <Button variant="outline" size="icon" aria-label={copy.prevDay} disabled={date <= today} onClick={() => setDate(addDaysIso(date, -1))}>
                        {isFa ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                      </Button>
                      <Input type="date" value={date} min={today} onChange={(event) => event.target.value && setDate(event.target.value)} className="h-10" />
                      <Button variant="outline" size="icon" aria-label={copy.nextDay} onClick={() => setDate(addDaysIso(date, 1))}>
                        {isFa ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </Button>
                      {date !== today ? (
                        <Button variant="ghost" size="sm" onClick={() => setDate(today)}>
                          {copy.today}
                        </Button>
                      ) : null}
                    </div>
                    <span className="block text-xs text-muted-foreground">{dateLabel(date)}</span>
                  </div>
                </div>

                <div>
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <h2 className="text-sm font-semibold">{copy.slotsTitle}</h2>
                    <Legend copy={copy} />
                  </div>
                  <p className="mb-3 text-xs text-muted-foreground">{copy.slotsHelp}</p>
                  {day?.blocks.some((b) => b.recurring) ? <p className="mb-3 text-xs text-amber-700 dark:text-amber-300">{copy.weeklyNotice}</p> : null}
                  {loadingDay && !day ? (
                    <p className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" /> {copy.loading}
                    </p>
                  ) : day && day.slots.length === 0 ? (
                    <p className="text-sm text-muted-foreground">{copy.noSlots}</p>
                  ) : (
                    <div className={cn("grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-4", loadingDay && "opacity-60")}>
                      {day?.slots.map((slot) => {
                        const key = `${slot.time}-${slot.endTime}`;
                        return (
                          <SlotButton key={key} slot={slot} copy={copy} busy={busySlot === key} disabled={busySlot !== null} onClick={() => onSlot(slot)} />
                        );
                      })}
                    </div>
                  )}
                </div>
              </>
            )}
          </section>

          <div className="space-y-5">
            <RangeForm
              copy={copy}
              today={today}
              defaultDate={date}
              onSubmit={async (values) => {
                setNotice(null);
                const result = await blockRangeAction({ staffId: doctor.id, ...values });
                if (!result.ok) {
                  setNotice({ tone: "error", text: errorText(copy, result.error) });
                  return false;
                }
                setConflicts(result.data.conflicts);
                setNotice({ tone: "success", text: copy.rangeDone(result.data.days) });
                await Promise.all([reloadDay(), reloadDoctor(doctor.id)]);
                return true;
              }}
            />
            <UpcomingBlocks copy={copy} groups={groups} dateLabel={dateLabel} locale={locale} onDelete={onDeleteGroup} />
          </div>
        </div>
      ) : null}
    </div>
  );
}

function DoctorSearch({ copy, locale, onPick }: { copy: TimeBlocksCopy; locale: string; onPick: (doctor: DoctorOption) => void }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<DoctorOption[] | null>(null);
  const [pending, startTransition] = useTransition();
  const latest = useRef(0);

  useEffect(() => {
    const ticket = ++latest.current;
    const handle = setTimeout(() => {
      startTransition(async () => {
        const result: ActionResult<DoctorOption[]> = await searchDoctorsAction({ q, locale });
        if (ticket !== latest.current) return;
        setResults(result.ok ? result.data : []);
      });
    }, 250);
    return () => clearTimeout(handle);
  }, [q, locale]);

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium" htmlFor="doctor-search">
        {copy.searchLabel}
      </label>
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground ltr:left-3 rtl:right-3" />
        <Input id="doctor-search" value={q} onChange={(event) => setQ(event.target.value)} placeholder={copy.searchPlaceholder} className="ltr:pl-9 rtl:pr-9" autoFocus />
        {pending ? <Loader2 className="absolute top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground ltr:right-3 rtl:left-3" /> : null}
      </div>
      {results && results.length === 0 && !pending ? <p className="text-sm text-muted-foreground">{copy.noDoctors}</p> : null}
      {results && results.length > 0 ? (
        <ul className="max-h-72 divide-y overflow-auto rounded-md border">
          {results.map((d) => (
            <li key={d.id}>
              <button type="button" className="w-full px-3 py-2 text-start hover:bg-muted focus:bg-muted focus:outline-none" onClick={() => onPick(d)}>
                <span className="block text-sm font-medium">{d.name}</span>
                {d.title ? <span className="block text-xs text-muted-foreground">{d.title}</span> : null}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

const SLOT_STYLES: Record<string, string> = {
  free: "border-emerald-300 bg-emerald-50 text-emerald-900 hover:bg-emerald-100 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-100",
  booked: "border-sky-300 bg-sky-50 text-sky-900 hover:bg-sky-100 dark:border-sky-500/40 dark:bg-sky-500/10 dark:text-sky-100",
  blocked: "border-rose-300 bg-rose-50 text-rose-900 line-through decoration-rose-400 hover:bg-rose-100 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-100",
};

function SlotButton({ slot, copy, busy, disabled, onClick }: { slot: GridSlot; copy: TimeBlocksCopy; busy: boolean; disabled: boolean; onClick: () => void }) {
  const label = slot.state === "blocked" ? (slot.hasBooking ? copy.blockedBooked : copy.blocked) : slot.state === "booked" ? copy.booked : copy.free;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={slot.state === "blocked"}
      className={cn(
        "flex flex-col items-center rounded-lg border px-2 py-2 text-sm transition disabled:cursor-wait disabled:opacity-70",
        SLOT_STYLES[slot.state]
      )}
    >
      <span dir="ltr" className="font-semibold tabular-nums">
        {busy ? <Loader2 className="inline h-4 w-4 animate-spin" /> : `${slot.time}–${slot.endTime}`}
      </span>
      <span className="text-[11px] no-underline">{label}</span>
    </button>
  );
}

function Legend({ copy }: { copy: TimeBlocksCopy }) {
  const item = (cls: string, text: string) => (
    <span className="flex items-center gap-1">
      <span className={cn("inline-block h-3 w-3 rounded-sm border", cls)} />
      {text}
    </span>
  );
  return (
    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
      {item("border-emerald-300 bg-emerald-50", copy.free)}
      {item("border-sky-300 bg-sky-50", copy.booked)}
      {item("border-rose-300 bg-rose-50", copy.blocked)}
    </div>
  );
}

function RangeForm({
  copy,
  today,
  defaultDate,
  onSubmit,
}: {
  copy: TimeBlocksCopy;
  today: string;
  defaultDate: string;
  onSubmit: (values: { fromDate: string; toDate: string; wholeDay: boolean; startsAt: string | null; endsAt: string | null; reason: string | null }) => Promise<boolean>;
}) {
  const [fromDate, setFromDate] = useState(defaultDate);
  const [toDate, setToDate] = useState(defaultDate);
  const [wholeDay, setWholeDay] = useState(false);
  const [startsAt, setStartsAt] = useState("09:00");
  const [endsAt, setEndsAt] = useState("12:00");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setFromDate(defaultDate);
    setToDate((current) => (current < defaultDate ? defaultDate : current));
  }, [defaultDate]);

  const valid = fromDate && toDate && fromDate <= toDate && (wholeDay || (startsAt && endsAt && startsAt < endsAt));

  return (
    <form
      className="space-y-3 rounded-xl border bg-card p-4 shadow-sm"
      onSubmit={async (event) => {
        event.preventDefault();
        if (!valid) return;
        setSaving(true);
        const ok = await onSubmit({ fromDate, toDate, wholeDay, startsAt: wholeDay ? null : startsAt, endsAt: wholeDay ? null : endsAt, reason: reason.trim() || null });
        setSaving(false);
        if (ok) setReason("");
      }}
    >
      <h2 className="flex items-center gap-2 text-sm font-semibold">
        <CalendarX className="h-4 w-4" /> {copy.rangeTitle}
      </h2>
      <div className="grid grid-cols-2 gap-2">
        <label className="space-y-1 text-xs">
          <span>{copy.fromDate}</span>
          <Input
            type="date"
            min={today}
            value={fromDate}
            onChange={(event) => {
              const value = event.target.value;
              setFromDate(value);
              if (value && toDate < value) setToDate(value);
            }}
          />
        </label>
        <label className="space-y-1 text-xs">
          <span>{copy.toDate}</span>
          <Input type="date" min={fromDate || today} value={toDate} onChange={(event) => setToDate(event.target.value)} />
        </label>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={wholeDay} onChange={(event) => setWholeDay(event.target.checked)} className="h-4 w-4" />
        {copy.wholeDay}
      </label>
      {!wholeDay ? (
        <div className="grid grid-cols-2 gap-2">
          <label className="space-y-1 text-xs">
            <span>{copy.fromTime}</span>
            <Input type="time" step={300} value={startsAt} onChange={(event) => setStartsAt(event.target.value)} dir="ltr" />
          </label>
          <label className="space-y-1 text-xs">
            <span>{copy.toTime}</span>
            <Input type="time" step={300} value={endsAt} onChange={(event) => setEndsAt(event.target.value)} dir="ltr" />
          </label>
        </div>
      ) : null}
      <label className="block space-y-1 text-xs">
        <span>{copy.reason}</span>
        <Input value={reason} maxLength={300} onChange={(event) => setReason(event.target.value)} placeholder={copy.reasonPlaceholder} />
      </label>
      <Button type="submit" className="w-full" disabled={!valid || saving}>
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarX className="h-4 w-4" />}
        {copy.blockRange}
      </Button>
    </form>
  );
}

function UpcomingBlocks({
  copy,
  groups,
  dateLabel,
  locale,
  onDelete,
}: {
  copy: TimeBlocksCopy;
  groups: BlockGroup[];
  dateLabel: (iso: string | null) => string;
  locale: string;
  onDelete: (group: BlockGroup) => Promise<void>;
}) {
  const [confirming, setConfirming] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  return (
    <section className="space-y-3 rounded-xl border bg-card p-4 shadow-sm">
      <h2 className="text-sm font-semibold">{copy.upcomingTitle}</h2>
      {groups.length === 0 ? <p className="text-sm text-muted-foreground">{copy.noUpcoming}</p> : null}
      <ul className="space-y-2">
        {groups.map((group) => {
          const when =
            group.dayOfWeek != null
              ? copy.everyWeekday(weekdayName(locale, group.dayOfWeek))
              : group.fromDate === group.toDate
                ? dateLabel(group.fromDate)
                : `${dateLabel(group.fromDate)} → ${dateLabel(group.toDate)} (${copy.days(group.days)})`;
          const time = group.mixedTimes ? copy.mixedTimes : group.startsAt ? `${group.startsAt}–${group.endsAt}` : copy.wholeDay;
          return (
            <li key={group.key} className="flex items-start justify-between gap-2 rounded-lg border p-3">
              <div className="min-w-0 space-y-0.5 text-sm">
                <p className="font-medium">{when}</p>
                <p className="text-xs text-muted-foreground" dir="auto">
                  {time}
                  {group.reason ? ` · ${group.reason}` : ""}
                  {!group.createdHere ? ` · ${copy.notCreatedHere}` : ""}
                </p>
              </div>
              {confirming === group.key ? (
                <div className="flex shrink-0 items-center gap-1">
                  <Button
                    size="sm"
                    variant="destructive"
                    disabled={deleting === group.key}
                    onClick={async () => {
                      setDeleting(group.key);
                      await onDelete(group);
                      setDeleting(null);
                      setConfirming(null);
                    }}
                  >
                    {deleting === group.key ? <Loader2 className="h-4 w-4 animate-spin" /> : copy.confirmRemove}
                  </Button>
                  <Button size="icon" variant="ghost" aria-label="cancel" onClick={() => setConfirming(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <Button size="sm" variant="ghost" className="shrink-0" onClick={() => setConfirming(group.key)}>
                  <Trash2 className="h-4 w-4" /> {copy.remove}
                </Button>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function NoticeBox({ notice, onClose }: { notice: NonNullable<Notice>; onClose: () => void }) {
  const tone =
    notice.tone === "error"
      ? "border-rose-300 bg-rose-50 text-rose-900 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-100"
      : notice.tone === "success"
        ? "border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-100"
        : "border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100";
  return (
    <div role="status" className={cn("flex items-start justify-between gap-2 rounded-lg border p-3 text-sm", tone)}>
      <span>{notice.text}</span>
      <button type="button" onClick={onClose} aria-label="close">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

function ConflictsBox({
  copy,
  conflicts,
  dateLabel,
  onClose,
}: {
  copy: TimeBlocksCopy;
  conflicts: ConflictingBooking[];
  dateLabel: (iso: string | null) => string;
  onClose: () => void;
}) {
  return (
    <div role="alert" className="space-y-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">
      <div className="flex items-start justify-between gap-2">
        <p className="flex items-center gap-2 font-semibold">
          <AlertTriangle className="h-4 w-4" /> {copy.conflictsTitle}
        </p>
        <button type="button" onClick={onClose} aria-label="close">
          <X className="h-4 w-4" />
        </button>
      </div>
      <p>{copy.conflictsBody}</p>
      <ul className="list-inside list-disc space-y-1">
        {conflicts.map((c) => (
          <li key={c.id}>
            {dateLabel(c.date)}{" "}
            <span dir="ltr" className="tabular-nums">
              {c.timeFrom}
              {c.timeTo ? `–${c.timeTo}` : ""}
            </span>
            {c.customerName ? ` · ${c.customerName}` : ""}
            {c.confirmationCode ? ` · ${c.confirmationCode}` : ""}
          </li>
        ))}
      </ul>
    </div>
  );
}
