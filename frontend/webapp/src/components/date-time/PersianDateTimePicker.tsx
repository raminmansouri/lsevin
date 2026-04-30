"use client";

import React, { useMemo, useState } from "react";
import { useTranslations } from "next-intl";

const PERSIAN_MONTHS = [
  "فروردین",
  "اردیبهشت",
  "خرداد",
  "تیر",
  "مرداد",
  "شهریور",
  "مهر",
  "آبان",
  "آذر",
  "دی",
  "بهمن",
  "اسفند",
];

const PERSIAN_WEEKDAYS = ["ش", "ی", "د", "س", "چ", "پ", "ج"];
const PERSIAN_DIGITS = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];

type PickerMode = "date" | "datetime";

export interface PersianDateTimePickerProps {
  value?: string | null;
  onChange: (value: string) => void;
  mode?: PickerMode;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  id?: string;
  name?: string;
}

interface GregorianDateParts {
  gy: number;
  gm: number;
  gd: number;
}

interface JalaliDateParts {
  jy: number;
  jm: number;
  jd: number;
}

function div(a: number, b: number) {
  return ~~(a / b);
}

function g2d(gy: number, gm: number, gd: number) {
  let d = div((gy + div(gm - 8, 6) + 100100) * 1461, 4) + div(153 * ((gm + 9) % 12) + 2, 5) + gd - 34840408;
  d = d - div(div(gy + 100100 + div(gm - 8, 6), 100) * 3, 4) + 752;
  return d;
}

function d2g(jdn: number): GregorianDateParts {
  let j = 4 * jdn + 139361631;
  j = j + div(div(4 * jdn + 183187720, 146097) * 3, 4) * 4 - 3908;
  const i = div((j % 1461), 4) * 5 + 308;
  const gd = div((i % 153), 5) + 1;
  const gm = (div(i, 153) % 12) + 1;
  const gy = div(j, 1461) - 100100 + div(8 - gm, 6);
  return { gy, gm, gd };
}

function jalCal(jy: number) {
  const breaks = [-61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210, 1635, 2060, 2097, 2192, 2262, 2324, 2394, 2456, 3178];
  const gy = jy + 621;
  let leapJ = -14;
  let jp = breaks[0];
  let jump = 0;

  if (jy < jp || jy >= breaks[breaks.length - 1]) {
    throw new Error(`Invalid Jalali year ${jy}`);
  }

  for (let i = 1; i < breaks.length; i += 1) {
    const jm = breaks[i];
    jump = jm - jp;
    if (jy < jm) break;
    leapJ += div(jump, 33) * 8 + div((jump % 33), 4);
    jp = jm;
  }

  let n = jy - jp;
  leapJ += div(n, 33) * 8 + div(((n % 33) + 3), 4);
  if (jump % 33 === 4 && jump - n === 4) leapJ += 1;

  const leapG = div(gy, 4) - div((div(gy, 100) + 1) * 3, 4) - 150;
  const march = 20 + leapJ - leapG;

  if (jump - n < 6) n = n - jump + div(jump + 4, 33) * 33;
  let leap = (((n + 1) % 33) - 1) % 4;
  if (leap === -1) leap = 4;

  return { leap, gy, march };
}

function j2d(jy: number, jm: number, jd: number) {
  const r = jalCal(jy);
  return g2d(r.gy, 3, r.march) + (jm - 1) * 31 - div(jm, 7) * (jm - 7) + jd - 1;
}

function d2j(jdn: number): JalaliDateParts {
  const gy = d2g(jdn).gy;
  let jy = gy - 621;
  const r = jalCal(jy);
  const jdn1f = g2d(gy, 3, r.march);
  let k = jdn - jdn1f;

  if (k >= 0) {
    if (k <= 185) {
      return { jy, jm: 1 + div(k, 31), jd: (k % 31) + 1 };
    }
    k -= 186;
  } else {
    jy -= 1;
    k += 179;
    if (r.leap === 1) k += 1;
  }

  return { jy, jm: 7 + div(k, 30), jd: (k % 30) + 1 };
}

export function toJalali(gy: number, gm: number, gd: number): JalaliDateParts {
  return d2j(g2d(gy, gm, gd));
}

export function toGregorian(jy: number, jm: number, jd: number): GregorianDateParts {
  return d2g(j2d(jy, jm, jd));
}

export function isLeapJalaliYear(jy: number) {
  return jalCal(jy).leap === 0;
}

export function getJalaliMonthLength(jy: number, jm: number) {
  if (jm <= 6) return 31;
  if (jm <= 11) return 30;
  return isLeapJalaliYear(jy) ? 30 : 29;
}

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function formatGregorianDate(parts: GregorianDateParts) {
  return `${parts.gy}-${pad(parts.gm)}-${pad(parts.gd)}`;
}

function toPersianDigits(value: string | number) {
  return String(value).replace(/\d/g, (digit) => PERSIAN_DIGITS[Number(digit)]);
}

function parseDateValue(value?: string | null): { date?: GregorianDateParts; time: string } {
  if (!value) return { time: "09:00" };

  const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})(?:[T\s](\d{2}:\d{2}))?/);
  if (!match) return { time: "09:00" };

  return {
    date: {
      gy: Number(match[1]),
      gm: Number(match[2]),
      gd: Number(match[3]),
    },
    time: match[4] ?? "09:00",
  };
}

function todayJalali() {
  const now = new Date();
  return toJalali(now.getFullYear(), now.getMonth() + 1, now.getDate());
}

function getInitialView(value?: string | null) {
  const parsed = parseDateValue(value);
  if (parsed.date) return toJalali(parsed.date.gy, parsed.date.gm, parsed.date.gd);
  return todayJalali();
}

function buildCalendarCells(jy: number, jm: number) {
  const firstGregorian = toGregorian(jy, jm, 1);
  const firstWeekday = new Date(firstGregorian.gy, firstGregorian.gm - 1, firstGregorian.gd).getDay();
  const offset = (firstWeekday + 1) % 7;
  const days = getJalaliMonthLength(jy, jm);
  return [
    ...Array.from({ length: offset }, () => null),
    ...Array.from({ length: days }, (_, index) => index + 1),
  ];
}

export function PersianDateTimePicker({
  value,
  onChange,
  mode = "date",
  disabled,
  placeholder,
  className,
  inputClassName,
  id,
  name,
}: PersianDateTimePickerProps) {
  const t = useTranslations("FormBuilder.datePicker");
  const resolvedPlaceholder = placeholder ?? (mode === "datetime" ? t("placeholderDateTime") : t("placeholderDate"));
  const parsed = useMemo(() => parseDateValue(value), [value]);
  const selectedJalali = useMemo(() => {
    if (!parsed.date) return undefined;
    return toJalali(parsed.date.gy, parsed.date.gm, parsed.date.gd);
  }, [parsed.date]);
  const initialView = useMemo(() => getInitialView(value), [value]);
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<JalaliDateParts>(initialView);
  const [time, setTime] = useState(parsed.time);

  const cells = useMemo(() => buildCalendarCells(view.jy, view.jm), [view.jm, view.jy]);
  const displayValue = selectedJalali
    ? `${toPersianDigits(selectedJalali.jd)} ${PERSIAN_MONTHS[selectedJalali.jm - 1]} ${toPersianDigits(selectedJalali.jy)}${mode === "datetime" && parsed.time ? ` - ${toPersianDigits(parsed.time)}` : ""}`
    : "";

  function emit(jy: number, jm: number, jd: number, nextTime = time) {
    const gregorian = toGregorian(jy, jm, jd);
    const dateValue = formatGregorianDate(gregorian);
    onChange(mode === "datetime" ? `${dateValue}T${nextTime}` : dateValue);
  }

  function moveMonth(direction: -1 | 1) {
    setView((current) => {
      const nextMonth = current.jm + direction;
      if (nextMonth < 1) return { jy: current.jy - 1, jm: 12, jd: 1 };
      if (nextMonth > 12) return { jy: current.jy + 1, jm: 1, jd: 1 };
      return { ...current, jm: nextMonth, jd: 1 };
    });
  }

  return (
    <div className={`relative ${className ?? ""}`}>
      <input type="hidden" name={name} value={value ?? ""} />
      <button
        id={id}
        type="button"
        disabled={disabled}
        onClick={() => {
          setView(getInitialView(value));
          setTime(parseDateValue(value).time);
          setIsOpen((current) => !current);
        }}
        className={
          inputClassName ??
          "flex h-12 w-full items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 text-left text-sm outline-none transition hover:border-[#155e75] disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
        }
      >
        <span className={displayValue ? "text-slate-900" : "text-slate-400"}>{displayValue || resolvedPlaceholder}</span>
        <span className="text-lg leading-none text-slate-400">▾</span>
      </button>

      {isOpen ? (
        <div className="absolute z-50 mt-2 w-[320px] rounded-3xl border border-slate-200 bg-white p-4 shadow-2xl" dir="rtl">
          <div className="mb-3 flex items-center justify-between gap-3">
            <button type="button" onClick={() => moveMonth(1)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50">{t("next")}</button>
            <div className="text-center font-bold text-slate-900">
              {PERSIAN_MONTHS[view.jm - 1]} {toPersianDigits(view.jy)}
            </div>
            <button type="button" onClick={() => moveMonth(-1)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50">{t("previous")}</button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-slate-500">
            {PERSIAN_WEEKDAYS.map((day) => (
              <div key={day} className="py-2">{day}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {cells.map((day, index) => {
              const selected = day && selectedJalali?.jy === view.jy && selectedJalali?.jm === view.jm && selectedJalali?.jd === day;
              return day ? (
                <button
                  key={`${view.jy}-${view.jm}-${day}`}
                  type="button"
                  onClick={() => {
                    emit(view.jy, view.jm, day);
                    if (mode === "date") setIsOpen(false);
                  }}
                  className={`h-10 rounded-xl text-sm transition ${selected ? "bg-[#0f182b] font-bold text-white" : "text-slate-700 hover:bg-slate-100"}`}
                >
                  {toPersianDigits(day)}
                </button>
              ) : (
                <div key={`empty-${index}`} className="h-10" />
              );
            })}
          </div>

          {mode === "datetime" ? (
            <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-4">
              <label className="text-sm font-semibold text-slate-700">{t("time")}</label>
              <input
                type="time"
                value={time}
                onChange={(event) => {
                  const nextTime = event.target.value || "09:00";
                  setTime(nextTime);
                  if (selectedJalali) emit(selectedJalali.jy, selectedJalali.jm, selectedJalali.jd, nextTime);
                }}
                className="h-10 flex-1 rounded-xl border border-slate-200 px-3 text-left outline-none focus:border-[#155e75]"
                dir="ltr"
              />
              <button type="button" onClick={() => setIsOpen(false)} className="rounded-xl bg-[#0f182b] px-4 py-2 text-sm font-semibold text-white">{t("confirm")}</button>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
