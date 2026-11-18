"use client";

import { useTranslations } from "next-intl";

import { Input } from "@/components/ui/input";
import { formatBookingDate, normalizeBookingCalendar, parseBookingCalendarDate } from "@/features/booking-pro/lib/calendar";

interface Props {
  locale: string;
  value?: string | null;
  onChange: (iso: string) => void;
  disabled?: boolean;
  id?: string;
  name?: string;
}

/**
 * ISO date input plus, for Jalali locales, a free-text Jalali entry (e.g. 1405/02/10)
 * that converts on blur — the same pair the admin booking form has always used.
 */
export function BookingDateField({ locale, value, onChange, disabled, id, name }: Props) {
  const tAdmin = useTranslations("AdminGenerated");
  const calendar = normalizeBookingCalendar(undefined, locale);

  return (
    <div className="space-y-2">
      <Input id={id} name={name} type="date" value={value ?? ""} onChange={(event) => onChange(event.target.value)} disabled={disabled} />
      {calendar === "jalali" ? (
        <Input
          type="text"
          inputMode="numeric"
          placeholder={tAdmin("jalaliDateEG14050210")}
          aria-label={tAdmin("jalaliDateEG14050210")}
          disabled={disabled}
          onBlur={(event) => {
            const iso = parseBookingCalendarDate(event.target.value, "jalali", locale);
            if (iso) onChange(iso);
          }}
          onKeyDown={(event) => {
            if (event.key !== "Enter") return;
            event.preventDefault();
            const iso = parseBookingCalendarDate(event.currentTarget.value, "jalali", locale);
            if (iso) onChange(iso);
          }}
        />
      ) : null}
      {value ? (
        <p className="text-xs text-muted-foreground">
          {tAdmin("displayDate", { date: formatBookingDate(value, { locale, calendar }) })}
        </p>
      ) : null}
    </div>
  );
}
