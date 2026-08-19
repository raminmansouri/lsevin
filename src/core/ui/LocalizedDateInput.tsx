"use client";

import { useMemo, useState } from "react";
import { normalizePortalLocale } from "@core/i18n/config";
import { assertTimeZone, dateTimeInZone, zonedLocalDateTimeToUtc } from "@core/lib/dateTime";
import { gregorianToJalali, parseJalaliDate } from "@core/lib/jalali";
import { Input } from "@core/ui/Field";
import { translatePortalText } from "@core/i18n/translate";

function gregorianDate(value?: string | null) {
  const match = String(value || "").match(/^(\d{4})-(\d{2})-(\d{2})/);
  return match ? `${match[1]}-${match[2]}-${match[3]}` : "";
}

function jalaliDisplay(value?: string | null, timeZone?: string) {
  const zoned = timeZone && value?.includes("T") ? dateTimeInZone(value, timeZone) : null;
  const date = zoned
    ? `${zoned.year}-${String(zoned.month).padStart(2, "0")}-${String(zoned.day).padStart(2, "0")}`
    : gregorianDate(value);
  if (!date) return "";
  const [gy, gm, gd] = date.split("-").map(Number);
  const result = gregorianToJalali(gy, gm, gd);
  return `${result.jy}/${String(result.jm).padStart(2, "0")}/${String(result.jd).padStart(2, "0")}`;
}

function toGregorian(value: string, persian: boolean) {
  if (!persian) return gregorianDate(value);
  const converted = parseJalaliDate(value);
  return converted ? `${converted.gy}-${String(converted.gm).padStart(2, "0")}-${String(converted.gd).padStart(2, "0")}` : "";
}

export function LocalizedDateInput({ name, value, locale, timeZone = "Asia/Tehran", dateTime = false, dateTimeStorage = "utc", required = false }: { name: string; value?: string | null; locale: string; timeZone?: string; dateTime?: boolean; dateTimeStorage?: "utc" | "local"; required?: boolean }) {
  const persian = normalizePortalLocale(locale).locale === "fa";
  const zoned = dateTime && value && dateTimeStorage === "utc" ? dateTimeInZone(value, timeZone) : null;
  const localMatch = dateTime && value && dateTimeStorage === "local" ? String(value).match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})/) : null;
  const localDate = localMatch ? `${localMatch[1]}-${localMatch[2]}-${localMatch[3]}` : null;
  const displayDate = zoned ? `${zoned.year}-${String(zoned.month).padStart(2, "0")}-${String(zoned.day).padStart(2, "0")}` : localDate || value;
  const initialDate = persian ? jalaliDisplay(displayDate) : gregorianDate(displayDate);
  const initialTime = zoned ? `${String(zoned.hour).padStart(2, "0")}:${String(zoned.minute).padStart(2, "0")}` : localMatch ? `${localMatch[4]}:${localMatch[5]}` : "";
  const [dateValue, setDateValue] = useState(initialDate);
  const [timeValue, setTimeValue] = useState(initialTime);
  const submitted = useMemo(() => {
    const date = toGregorian(dateValue, persian);
    if (!date) return "";
    if (!dateTime) return date;
    if (!/^\d{2}:\d{2}$/.test(timeValue)) return "";
    if (dateTimeStorage === "local") return `${date}T${timeValue}`;
    return zonedLocalDateTimeToUtc(`${date}T${timeValue}`, assertTimeZone(timeZone)) || "";
  }, [dateTime, dateTimeStorage, dateValue, persian, timeValue, timeZone]);

  return <div className={dateTime ? "grid grid-cols-[1fr_9rem] gap-2" : ""}>
    <input type="hidden" name={name} value={submitted} />
    <Input
      type={persian ? "text" : "date"}
      value={dateValue}
      required={required}
      inputMode={persian ? "numeric" : undefined}
      placeholder={persian ? "۱۴۰۵/۰۵/۱۷" : undefined}
      onChange={(event) => setDateValue(event.target.value)}
      aria-label={translatePortalText(locale, persian ? "Jalali date" : "Gregorian date")}
    />
    {dateTime ? <Input type="time" value={timeValue} required={required} onChange={(event) => setTimeValue(event.target.value)} aria-label={translatePortalText(locale, "Local time")} /> : null}
  </div>;
}
