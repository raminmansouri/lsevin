"use client";

import { useMemo, useState, useTransition } from "react";
import { CalendarDays, Loader2, Save } from "lucide-react";
import { toast } from "sonner";

import useAction from "@/hooks/use-action";
import type { BookingCalendarSettings } from "@/features/booking-pro/server/booking-calendar-settings.repository";
import { saveBookingCalendarSettingsAction } from "@/features/booking-pro/admin/actions";

type Props = {
  settings: BookingCalendarSettings[];
};

const SCOPE_TYPES = [
  { value: "global", label: "Global default" },
  { value: "provider_type", label: "Provider type" },
  { value: "provider", label: "Provider" },
  { value: "service_definition", label: "Service definition" },
  { value: "provider_service", label: "Provider service" },
] as const;

const WEEK_DAYS = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

function emptyForm(): BookingCalendarSettings {
  return {
    scopeType: "global",
    scopeId: null,
    defaultCalendar: "gregorian",
    enabledCalendars: ["gregorian", "jalali"],
    timezoneId: "UTC",
    weekStartsOn: 6,
    isActive: true,
  };
}

export function BookingCalendarSettingsForm({ settings }: Props) {
  const [form, setForm] = useState<BookingCalendarSettings>(() => settings[0] || emptyForm());
  const [isPending, startTransition] = useTransition();

  const selectedKey = useMemo(() => `${form.scopeType}:${form.scopeId || ""}`, [form.scopeId, form.scopeType]);

  const { execute } = useAction(saveBookingCalendarSettingsAction, {
    startTransition,
    onSuccess: () => toast.success("Booking calendar settings saved."),
    onError: (error) => toast.error(error?.detail || error?.title || "Settings could not be saved."),
  });

  function selectExisting(key: string) {
    const existing = settings.find((item) => `${item.scopeType}:${item.scopeId || ""}` === key);
    setForm(existing || emptyForm());
  }

  function toggleCalendar(calendar: "gregorian" | "jalali") {
    setForm((current) => {
      const enabled = new Set(current.enabledCalendars);
      if (enabled.has(calendar)) enabled.delete(calendar);
      else enabled.add(calendar);

      const enabledCalendars = Array.from(enabled) as Array<"gregorian" | "jalali">;
      return {
        ...current,
        enabledCalendars: enabledCalendars.length ? enabledCalendars : [calendar],
        defaultCalendar: enabledCalendars.includes(current.defaultCalendar) ? current.defaultCalendar : calendar,
      };
    });
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
              <CalendarDays size={16} /> Booking calendar
            </div>
            <h1 className="text-2xl font-bold text-slate-950">Calendar & date settings</h1>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">
              Store all booking dates as Gregorian PostgreSQL dates, while allowing the user/admin UI to display and input either Gregorian or Jalali dates.
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">Edit existing setting</span>
            <select
              value={selectedKey}
              onChange={(event) => selectExisting(event.target.value)}
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-slate-900"
            >
              {settings.map((item) => (
                <option key={`${item.scopeType}:${item.scopeId || ""}`} value={`${item.scopeType}:${item.scopeId || ""}`}>
                  {item.scopeType} {item.scopeId ? `• ${item.scopeId}` : ""}
                </option>
              ))}
              <option value="global:">Create / edit global default</option>
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">Scope</span>
            <select
              value={form.scopeType}
              onChange={(event) => setForm((current) => ({ ...current, scopeType: event.target.value as BookingCalendarSettings["scopeType"], scopeId: event.target.value === "global" ? null : current.scopeId }))}
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-slate-900"
            >
              {SCOPE_TYPES.map((item) => (
                <option key={item.value} value={item.value}>{item.label}</option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">Scope ID</span>
            <input
              value={form.scopeId || ""}
              disabled={form.scopeType === "global"}
              onChange={(event) => setForm((current) => ({ ...current, scopeId: event.target.value }))}
              placeholder="UUID for provider/service/provider type, empty for global"
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-slate-900 disabled:bg-slate-50 disabled:text-slate-400"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">Default calendar</span>
            <select
              value={form.defaultCalendar}
              onChange={(event) => setForm((current) => ({ ...current, defaultCalendar: event.target.value as "gregorian" | "jalali" }))}
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-slate-900"
            >
              <option value="gregorian">Gregorian</option>
              <option value="jalali">Jalali / Persian</option>
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">Timezone</span>
            <input
              value={form.timezoneId}
              onChange={(event) => setForm((current) => ({ ...current, timezoneId: event.target.value }))}
              placeholder="Asia/Tehran, Europe/Istanbul, UTC"
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-slate-900"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">Week starts on</span>
            <select
              value={form.weekStartsOn}
              onChange={(event) => setForm((current) => ({ ...current, weekStartsOn: Number(event.target.value) }))}
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-slate-900"
            >
              {WEEK_DAYS.map((item) => (
                <option key={item.value} value={item.value}>{item.label}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="mb-3 text-sm font-semibold text-slate-700">Enabled calendars</p>
          <div className="flex flex-wrap gap-3">
            {(["gregorian", "jalali"] as const).map((calendar) => (
              <button
                key={calendar}
                type="button"
                onClick={() => toggleCalendar(calendar)}
                className={`rounded-xl px-4 py-2 text-sm font-semibold ${form.enabledCalendars.includes(calendar) ? "bg-slate-950 text-white" : "bg-white text-slate-700 ring-1 ring-slate-200"}`}
              >
                {calendar === "gregorian" ? "Gregorian" : "Jalali / Persian"}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between gap-4">
          <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.checked }))}
              className="h-4 w-4 rounded border-slate-300"
            />
            Active
          </label>

          <button
            type="button"
            disabled={isPending}
            onClick={() => execute({
              scopeType: form.scopeType,
              scopeId: form.scopeType === "global" ? null : form.scopeId,
              defaultCalendar: form.defaultCalendar,
              enabledCalendars: form.enabledCalendars,
              timezoneId: form.timezoneId,
              weekStartsOn: form.weekStartsOn,
              isActive: form.isActive,
            })}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Save settings
          </button>
        </div>
      </div>
    </div>
  );
}
