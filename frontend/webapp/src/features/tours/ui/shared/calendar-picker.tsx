"use client";

import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

import {
  addDaysIso,
  formatIsoDate,
  formatMonthTitle,
  isoToParts,
  monthGrid,
  shiftMonth,
  weekStartForLocale,
  type CalendarId,
} from "../../domain/calendar";
import { directionOf } from "../../domain/content";

import { formatNumber, intlLocale } from "./format";

export type DayInfo = {
  /** Not selectable (sold out, cutoff passed, blocked, no departure). */
  disabled?: boolean;
  /** data-state for styling/tests: "available" | "sold_out" | "cutoff" | "blocked" | "none" … */
  state?: string;
  /** Small text under the day number, e.g. the price. */
  sublabel?: ReactNode;
  /** Extra screen-reader text appended to the full date, e.g. "Sold out" or the price. */
  srLabel?: string;
};

export type CalendarPickerLabels = {
  previousMonth: string;
  nextMonth: string;
  /** Accessible name of the grid; the month title is appended. */
  grid?: string;
  selected?: string;
  rangeStart?: string;
  rangeEnd?: string;
};

type Common = {
  calendar: CalendarId;
  locale: string;
  labels: CalendarPickerLabels;
  getDay?: (iso: string) => DayInfo;
  /** ISO date used to open the picker when nothing is selected (defaults to today, UTC). */
  initialIso?: string;
  minIso?: string;
  maxIso?: string;
  className?: string;
  testId?: string;
};

type SingleProps = Common & { mode?: "single"; value: string | null; onChange: (iso: string) => void };
type RangeProps = Common & {
  mode: "range";
  value: { from: string | null; to: string | null };
  onChange: (range: { from: string | null; to: string | null }) => void;
};

const todayIso = () => new Date().toISOString().slice(0, 10);

/** 2024-01-01 is a Monday; isoWeekday 1..7 → a date with that weekday. */
const WEEKDAY_SAMPLE = (weekday: number) => `2024-01-0${weekday}`;

/**
 * Month-grid date picker for the three display calendars (C-082, C-112, C-113,
 * AT-22, AT-30, AT-34). Cells carry canonical ISO dates, so switching the
 * calendar never changes the selected underlying date. Fully keyboard operable:
 * arrows (mirrored in RTL), Home/End (week), PageUp/PageDown (month,
 * +Shift = year), Enter/Space to select.
 */
export function CalendarPicker(props: SingleProps | RangeProps) {
  const { calendar, locale, labels, getDay, minIso, maxIso, className, testId } = props;
  const rtl = directionOf(locale) === "rtl";
  const weekStart = weekStartForLocale(locale);
  const anchor =
    props.mode === "range" ? props.value.from ?? props.initialIso ?? todayIso() : props.value ?? props.initialIso ?? todayIso();

  const [focusedIso, setFocusedIso] = useState<string>(anchor);
  const [view, setView] = useState(() => {
    const p = isoToParts(anchor, calendar);
    return { calendar, year: p.year, month: p.month };
  });
  const [moveFocus, setMoveFocus] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);

  // Calendar switch: re-anchor the visible month on the same underlying date (C-112).
  if (view.calendar !== calendar) {
    const p = isoToParts(focusedIso, calendar);
    setView({ calendar, year: p.year, month: p.month });
  }

  const weeks = useMemo(() => monthGrid(view.year, view.month, calendar, weekStart), [view.year, view.month, calendar, weekStart]);
  const title = formatMonthTitle(view.year, view.month, { locale: intlLocale(locale), calendar });
  const weekdays = useMemo(() => {
    const fmtShort = new Intl.DateTimeFormat(intlLocale(locale), { weekday: "short", timeZone: "UTC" });
    const fmtLong = new Intl.DateTimeFormat(intlLocale(locale), { weekday: "long", timeZone: "UTC" });
    return Array.from({ length: 7 }, (_, i) => {
      const wd = ((weekStart - 1 + i) % 7) + 1;
      const d = new Date(`${WEEKDAY_SAMPLE(wd)}T12:00:00Z`);
      return { short: fmtShort.format(d), long: fmtLong.format(d) };
    });
  }, [locale, weekStart]);

  const inMonthIsos = useMemo(() => weeks.flat().filter((c) => c.inMonth).map((c) => c.iso), [weeks]);
  const tabbableIso = inMonthIsos.includes(focusedIso) ? focusedIso : inMonthIsos[0];

  useEffect(() => {
    if (!moveFocus) return;
    const el = gridRef.current?.querySelector<HTMLButtonElement>(`button[data-iso="${focusedIso}"]`);
    el?.focus();
    setMoveFocus(false);
  }, [moveFocus, focusedIso, view]);

  const canPrev = !minIso || inMonthIsos[0] > minIso;
  const canNext = !maxIso || inMonthIsos[inMonthIsos.length - 1] < maxIso;

  function goMonth(delta: number) {
    const next = shiftMonth(view.year, view.month, delta);
    setView({ calendar, ...next });
  }

  function moveTo(iso: string) {
    if (minIso && iso < minIso) iso = minIso;
    if (maxIso && iso > maxIso) iso = maxIso;
    const p = isoToParts(iso, calendar);
    if (p.year !== view.year || p.month !== view.month) setView({ calendar, year: p.year, month: p.month });
    setFocusedIso(iso);
    setMoveFocus(true);
  }

  function select(iso: string) {
    const info = getDay?.(iso);
    if (info?.disabled) return;
    setFocusedIso(iso);
    if (props.mode === "range") {
      const { from, to } = props.value;
      if (!from || (from && to) || iso < from) props.onChange({ from: iso, to: null });
      else props.onChange({ from, to: iso });
    } else {
      props.onChange(iso);
    }
  }

  function onKeyDown(e: KeyboardEvent<HTMLButtonElement>, iso: string) {
    const fwd = rtl ? -1 : 1;
    const p = isoToParts(iso, calendar);
    switch (e.key) {
      case "ArrowRight":
        moveTo(addDaysIso(iso, fwd));
        break;
      case "ArrowLeft":
        moveTo(addDaysIso(iso, -fwd));
        break;
      case "ArrowDown":
        moveTo(addDaysIso(iso, 7));
        break;
      case "ArrowUp":
        moveTo(addDaysIso(iso, -7));
        break;
      case "Home": {
        const row = weeks.find((w) => w.some((c) => c.iso === iso));
        if (row) moveTo(row[0].iso);
        break;
      }
      case "End": {
        const row = weeks.find((w) => w.some((c) => c.iso === iso));
        if (row) moveTo(row[6].iso);
        break;
      }
      case "PageUp":
      case "PageDown": {
        const delta = (e.key === "PageUp" ? -1 : 1) * (e.shiftKey ? 12 : 1);
        const target = shiftMonth(p.year, p.month, delta);
        // Clamp the day to the target month's length in this calendar.
        const grid = monthGrid(target.year, target.month, calendar, weekStart).flat().filter((c) => c.inMonth);
        const cell = grid.find((c) => c.day === p.day) ?? grid[grid.length - 1];
        moveTo(cell.iso);
        break;
      }
      case "Enter":
      case " ":
        select(iso);
        break;
      default:
        return;
    }
    e.preventDefault();
  }

  const selectedSet = (iso: string) => {
    if (props.mode === "range") {
      const { from, to } = props.value;
      return {
        selected: iso === from || iso === to,
        start: iso === from,
        end: iso === to,
        between: Boolean(from && to && iso > from && iso < to),
      };
    }
    return { selected: iso === props.value, start: false, end: false, between: false };
  };

  const PrevIcon = rtl ? ChevronRight : ChevronLeft;
  const NextIcon = rtl ? ChevronLeft : ChevronRight;

  return (
    <div className={cn("w-full select-none", className)} data-testid={testId} data-calendar={calendar}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => goMonth(-1)}
          disabled={!canPrev}
          data-testid="calendar-prev"
          aria-label={labels.previousMonth}
          className="flex size-11 items-center justify-center rounded-full border text-slate-700 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:outline-none disabled:opacity-30"
        >
          <PrevIcon className="size-5" aria-hidden="true" />
        </button>
        <h3 className="text-base font-bold text-slate-900" aria-live="polite" data-testid="calendar-month-title">
          {title}
        </h3>
        <button
          type="button"
          onClick={() => goMonth(1)}
          disabled={!canNext}
          data-testid="calendar-next"
          aria-label={labels.nextMonth}
          className="flex size-11 items-center justify-center rounded-full border text-slate-700 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:outline-none disabled:opacity-30"
        >
          <NextIcon className="size-5" aria-hidden="true" />
        </button>
      </div>

      <div role="grid" aria-label={labels.grid ? `${labels.grid} — ${title}` : title} ref={gridRef} className="w-full">
        <div role="row" className="grid grid-cols-7 pb-1">
          {weekdays.map((w) => (
            <div role="columnheader" key={w.long} aria-label={w.long} className="py-1 text-center text-xs font-medium text-slate-500">
              {w.short}
            </div>
          ))}
        </div>
        {weeks.map((week) => (
          <div role="row" key={week[0].iso} className="grid grid-cols-7 gap-y-1">
            {week.map((cell) => {
              if (!cell.inMonth) return <div role="gridcell" key={cell.iso} aria-hidden="true" />;
              const info = getDay?.(cell.iso) ?? {};
              const sel = selectedSet(cell.iso);
              const fullDate = formatIsoDate(cell.iso, { locale: intlLocale(locale), calendar, style: "full" });
              const sr = [fullDate, info.srLabel, sel.start && labels.rangeStart, sel.end && labels.rangeEnd, sel.selected && !sel.start && !sel.end && labels.selected]
                .filter(Boolean)
                .join(rtl ? "، " : ", ");
              return (
                <div role="gridcell" key={cell.iso} aria-selected={sel.selected || sel.between} className="flex justify-center">
                  <button
                    type="button"
                    data-iso={cell.iso}
                    data-state={info.state ?? "none"}
                    data-selected={sel.selected ? "true" : undefined}
                    tabIndex={cell.iso === tabbableIso ? 0 : -1}
                    aria-disabled={info.disabled || undefined}
                    aria-label={sr}
                    onClick={() => select(cell.iso)}
                    onKeyDown={(e) => onKeyDown(e, cell.iso)}
                    onFocus={() => setFocusedIso(cell.iso)}
                    className={cn(
                      "flex min-h-12 w-full max-w-14 flex-col items-center justify-center rounded-lg text-sm transition-colors focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-1 focus-visible:outline-none",
                      info.disabled ? "cursor-not-allowed text-slate-300" : "text-slate-900 hover:bg-emerald-50",
                      info.state === "available" && !sel.selected && "bg-emerald-50/60",
                      info.state === "sold_out" && "line-through decoration-slate-300",
                      sel.between && "rounded-none bg-emerald-100",
                      sel.selected && "bg-emerald-700 text-white hover:bg-emerald-700",
                    )}
                  >
                    <span className="font-semibold leading-5">{formatNumber(cell.day, locale)}</span>
                    {info.sublabel ? (
                      <span className={cn("text-[10px] leading-4", sel.selected ? "text-white/90" : "text-slate-500")}>{info.sublabel}</span>
                    ) : null}
                  </button>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
