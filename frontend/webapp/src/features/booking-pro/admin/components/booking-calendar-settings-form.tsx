"use client";

import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState, useTransition } from "react";
import { CalendarDays, Loader2, Save } from "lucide-react";
import { toast } from "sonner";

import useAction from "@/hooks/use-action";
import type { BookingCalendarSettings } from "@/features/booking-pro/server/booking-calendar-settings.repository";
import { saveBookingCalendarSettingsAction } from "@/features/booking-pro/admin/actions";
import { isPersianLocale, readableGuideClass, readableHelpClass, readableInlineInfoClass } from "./availability-admin-copy";

type Props = {
  settings: BookingCalendarSettings[];
};

const SCOPE_TYPES = [
  { value: "global", faLabel: "پیش‌فرض کل سیستم", enLabel: "Global default" },
  { value: "provider_type", faLabel: "نوع مرکز / ارائه‌دهنده", enLabel: "Provider type" },
  { value: "provider", faLabel: "یک مرکز مشخص", enLabel: "Provider" },
  { value: "service_definition", faLabel: "تعریف کلی خدمت", enLabel: "Service definition" },
  { value: "provider_service", faLabel: "خدمت یک مرکز مشخص", enLabel: "Provider service" },
] as const;

const TIMEZONE_OPTIONS = [
  { value: "Asia/Tehran", faLabel: "ایران — Asia/Tehran", enLabel: "Iran — Asia/Tehran" },
  { value: "Europe/Istanbul", faLabel: "ترکیه — Europe/Istanbul", enLabel: "Turkey — Europe/Istanbul" },
  { value: "Asia/Dubai", faLabel: "امارات / عمان — Asia/Dubai", enLabel: "UAE/Oman — Asia/Dubai" },
  { value: "Asia/Baghdad", faLabel: "عراق — Asia/Baghdad", enLabel: "Iraq — Asia/Baghdad" },
  { value: "Asia/Qatar", faLabel: "قطر — Asia/Qatar", enLabel: "Qatar — Asia/Qatar" },
  { value: "Asia/Kuwait", faLabel: "کویت — Asia/Kuwait", enLabel: "Kuwait — Asia/Kuwait" },
  { value: "UTC", faLabel: "UTC / حالت عمومی", enLabel: "UTC / Generic" },
];

// Every IANA timezone in the world (built into the runtime; falls back to the
// curated list on older engines). Computed once at module load.
const ALL_TIMEZONES: string[] = (() => {
  try {
    const supported = (Intl as unknown as { supportedValuesOf?: (key: string) => string[] }).supportedValuesOf?.(
      "timeZone",
    );
    if (Array.isArray(supported) && supported.length) return supported;
  } catch {
    /* older runtime — fall back below */
  }
  return TIMEZONE_OPTIONS.map((tz) => tz.value);
})();

// e.g. "Asia/Tehran (GMT+3:30)" — current UTC offset as a readability hint.
function formatTimezoneLabel(tz: string): string {
  try {
    const parts = new Intl.DateTimeFormat("en-US", { timeZone: tz, timeZoneName: "shortOffset" }).formatToParts(
      new Date(),
    );
    const offset = parts.find((part) => part.type === "timeZoneName")?.value;
    return offset ? `${tz} (${offset})` : tz;
  } catch {
    return tz;
  }
}

// Grouped by region (segment before the first "/") for easier scanning. Labels
// are precomputed here so the select doesn't format hundreds of zones per render.
const TIMEZONE_GROUPS: { region: string; options: { value: string; label: string }[] }[] = (() => {
  const byRegion = new Map<string, { value: string; label: string }[]>();
  for (const tz of ALL_TIMEZONES) {
    const region = tz.includes("/") ? tz.split("/")[0] : "Other";
    if (!byRegion.has(region)) byRegion.set(region, []);
    byRegion.get(region)!.push({ value: tz, label: formatTimezoneLabel(tz) });
  }
  return [...byRegion.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([region, options]) => ({ region, options: options.sort((a, b) => a.value.localeCompare(b.value)) }));
})();

const WEEK_DAYS = [
  { value: 0, faLabel: "یکشنبه", enLabel: "Sunday" },
  { value: 1, faLabel: "دوشنبه", enLabel: "Monday" },
  { value: 2, faLabel: "سه‌شنبه", enLabel: "Tuesday" },
  { value: 3, faLabel: "چهارشنبه", enLabel: "Wednesday" },
  { value: 4, faLabel: "پنجشنبه", enLabel: "Thursday" },
  { value: 5, faLabel: "جمعه", enLabel: "Friday" },
  { value: 6, faLabel: "شنبه", enLabel: "Saturday" },
];

const scopeHelpFa: Record<string, string> = {
  global: "پایه کل سیستم است. اگر برای نوع مرکز، مرکز یا خدمت قانون جداگانه نداشته باشید، این تنظیم استفاده می‌شود.",
  provider_type: "برای همه مراکز از یک نوع خاص مثل کلینیک، هتل یا باشگاه استفاده می‌شود.",
  provider: "فقط برای یک مرکز مشخص اعمال می‌شود و از تنظیمات عمومی دقیق‌تر است.",
  service_definition: "برای یک خدمت کلی در کل سیستم است. معمولاً فقط برای استانداردسازی نوع تاریخ خدمت استفاده شود.",
  provider_service: "دقیق‌ترین حالت است و فقط روی یک خدمت در یک مرکز مشخص اثر می‌گذارد.",
};

function emptyForm(): BookingCalendarSettings {
  return {
    scopeType: "global",
    scopeId: null,
    defaultCalendar: "jalali",
    enabledCalendars: ["gregorian", "jalali"],
    timezoneId: "Asia/Tehran",
    weekStartsOn: 6,
    isActive: true,
  };
}

export function BookingCalendarSettingsForm({ settings }: Props) {
  const tAdmin = useTranslations("AdminGenerated");
  const locale = useLocale();
  const isPersian = isPersianLocale(locale);
  const [form, setForm] = useState<BookingCalendarSettings>(() => settings[0] || emptyForm());
  const [isPending, startTransition] = useTransition();

  const selectedKey = useMemo(() => `${form.scopeType}:${form.scopeId || ""}`, [form.scopeId, form.scopeType]);
  const selectedScopeHelp = isPersian
    ? scopeHelpFa[form.scopeType]
    : "The selected scope decides where this calendar/date behavior applies. More specific scopes override broader scopes.";
  const selectedCalendarHelp = isPersian
    ? form.defaultCalendar === "jalali"
      ? "کاربر و ادمین تاریخ را به شمسی می‌بینند و وارد می‌کنند، اما دیتابیس همچنان تاریخ استاندارد Gregorian/PostgreSQL ذخیره می‌کند."
      : "کاربر و ادمین تاریخ را میلادی می‌بینند و وارد می‌کنند. برای بازار ایران معمولاً شمسی مناسب‌تر است."
    : "The default calendar controls the main date input/display calendar. PostgreSQL dates remain Gregorian internally.";
  const activeHelp = isPersian
    ? form.isActive
      ? "این تنظیم فعال است و در حل‌کردن تقویم رزرو استفاده می‌شود."
      : "این تنظیم ذخیره می‌شود اما فعلاً در رزرو اعمال نخواهد شد."
    : form.isActive
      ? "This setting is active and will be used by booking calendar resolution."
      : "This setting is saved but will not be applied until activated.";

  const { execute } = useAction(saveBookingCalendarSettingsAction, {
    startTransition,
    onSuccess: () => toast.success(isPersian ? "تنظیمات تقویم رزرو ذخیره شد." : tAdmin("bookingCalendarSettingsSaved")),
    onError: (error) => toast.error(error?.detail || error?.title || (isPersian ? "ذخیره تنظیمات انجام نشد." : "Settings could not be saved.")),
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
    <div className="space-y-6" dir={isPersian ? "rtl" : "ltr"}>
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-slate-600 dark:text-slate-300">
              <CalendarDays size={16} /> {isPersian ? "تقویم رزرو" : "Booking calendar"}
            </div>
            <h1 className="text-2xl font-bold text-slate-950 dark:text-slate-50">{isPersian ? "تنظیمات تاریخ و تقویم رزرو" : tAdmin("calendarDateSettings")}</h1>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-700 dark:text-slate-200">
              {isPersian
                ? "تاریخ‌ها در دیتابیس به‌صورت استاندارد PostgreSQL/Gregorian ذخیره می‌شوند، اما می‌توانید تعیین کنید ادمین و کاربر تاریخ را شمسی، میلادی یا هر دو ببینند."
                : "Store all booking dates as Gregorian PostgreSQL dates, while allowing the user/admin UI to display and input either Gregorian or Jalali dates."}
            </p>
          </div>
        </div>

        <div className={readableGuideClass}>
          <div className="font-semibold text-slate-950 dark:text-amber-50">{isPersian ? "راهنمای انتخاب تنظیمات تقویم" : "Calendar setting guide"}</div>
          <p className="mt-1">
            {isPersian
              ? "برای ایران معمولاً تقویم پیش‌فرض را شمسی، منطقه زمانی را Asia/Tehran و شروع هفته را شنبه قرار دهید. Scope مشخص می‌کند این تنظیم برای کل سیستم، یک نوع مرکز، یک مرکز یا یک خدمت خاص اعمال شود."
              : "For Iran, the usual setup is Jalali default calendar, Asia/Tehran timezone, and Saturday as the week start. Scope controls where the setting applies."}
          </p>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-800 dark:text-slate-100">{isPersian ? "ویرایش تنظیم موجود" : tAdmin("editExistingSetting")}</span>
            <select
              value={selectedKey}
              onChange={(event) => selectExisting(event.target.value)}
              className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none focus:border-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50"
            >
              {settings.map((item) => (
                <option key={`${item.scopeType}:${item.scopeId || ""}`} value={`${item.scopeType}:${item.scopeId || ""}`}>
                  {item.scopeType} {item.scopeId ? `• ${item.scopeId}` : ""}
                </option>
              ))}
              <option value="global:">{isPersian ? "ایجاد / ویرایش پیش‌فرض کل سیستم" : tAdmin("createEditGlobalDefault")}</option>
            </select>
            <span className={readableHelpClass}>{isPersian ? "از اینجا می‌توانید تنظیمات قبلی را انتخاب کنید یا پیش‌فرض کل سیستم را بسازید." : "Select an existing setting or create the global default."}</span>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-800 dark:text-slate-100">{isPersian ? "محدوده اثرگذاری" : tAdmin("scope")}</span>
            <select
              value={form.scopeType}
              onChange={(event) => setForm((current) => ({ ...current, scopeType: event.target.value as BookingCalendarSettings["scopeType"], scopeId: event.target.value === "global" ? null : current.scopeId }))}
              className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none focus:border-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50"
            >
              {SCOPE_TYPES.map((item) => (
                <option key={item.value} value={item.value}>{isPersian ? item.faLabel : item.enLabel}</option>
              ))}
            </select>
            <span className={readableHelpClass}>{selectedScopeHelp}</span>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-800 dark:text-slate-100">{isPersian ? "شناسه محدوده" : tAdmin("scopeID")}</span>
            <input
              value={form.scopeId || ""}
              disabled={form.scopeType === "global"}
              onChange={(event) => setForm((current) => ({ ...current, scopeId: event.target.value }))}
              placeholder={isPersian ? "UUID مرکز، خدمت یا نوع مرکز؛ برای Global خالی بماند" : tAdmin("uUIDForProviderServiceProviderTypeEmptyForGlobal")}
              className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none focus:border-slate-900 disabled:bg-slate-100 disabled:text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50 dark:disabled:bg-slate-800"
            />
            <span className={readableHelpClass}>{isPersian ? "اگر محدوده Global است خالی می‌ماند؛ برای بقیه حالت‌ها UUID همان رکورد را وارد کنید." : "Leave empty for global; otherwise enter the UUID of the selected scope record."}</span>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-800 dark:text-slate-100">{isPersian ? "تقویم پیش‌فرض" : tAdmin("defaultCalendar")}</span>
            <select
              value={form.defaultCalendar}
              onChange={(event) => setForm((current) => ({ ...current, defaultCalendar: event.target.value as "gregorian" | "jalali" }))}
              className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none focus:border-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50"
            >
              <option value="gregorian">{isPersian ? "میلادی / Gregorian" : tAdmin("gregorian")}</option>
              <option value="jalali">{isPersian ? "شمسی / Jalali" : tAdmin("jalaliPersian")}</option>
            </select>
            <span className={readableHelpClass}>{selectedCalendarHelp}</span>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-800 dark:text-slate-100">{isPersian ? "منطقه زمانی" : tAdmin("timezone")}</span>
            <select
              value={form.timezoneId || "Asia/Tehran"}
              onChange={(event) => setForm((current) => ({ ...current, timezoneId: event.target.value }))}
              className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none focus:border-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50"
            >
              <optgroup label={isPersian ? "متداول" : "Common"}>
                {TIMEZONE_OPTIONS.map((item) => <option key={item.value} value={item.value}>{isPersian ? item.faLabel : item.enLabel}</option>)}
              </optgroup>
              {TIMEZONE_GROUPS.map((group) => (
                <optgroup key={group.region} label={group.region}>
                  {group.options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </optgroup>
              ))}
            </select>
            <span className={readableHelpClass}>{isPersian ? "برای مرکزهای ایران معمولاً Asia/Tehran بگذارید تا ساعت‌های رزرو با ساعت محلی درست محاسبه شود." : "Use the provider timezone so booking slots are calculated in local time."}</span>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-800 dark:text-slate-100">{isPersian ? "شروع هفته" : tAdmin("weekStartsOn")}</span>
            <select
              value={form.weekStartsOn}
              onChange={(event) => setForm((current) => ({ ...current, weekStartsOn: Number(event.target.value) }))}
              className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none focus:border-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50"
            >
              {WEEK_DAYS.map((item) => (
                <option key={item.value} value={item.value}>{isPersian ? item.faLabel : item.enLabel}</option>
              ))}
            </select>
            <span className={readableHelpClass}>{isPersian ? "برای ایران معمولاً شنبه انتخاب می‌شود؛ این گزینه ترتیب نمایش هفته در تقویم را مشخص می‌کند." : "Controls how the week is displayed in the calendar UI."}</span>
          </label>
        </div>

        <div className="mt-5 rounded-2xl border border-slate-300 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900">
          <p className="mb-3 text-sm font-semibold text-slate-800 dark:text-slate-100">{isPersian ? "تقویم‌های فعال" : tAdmin("enabledCalendars")}</p>
          <div className="flex flex-wrap gap-3">
            {(["gregorian", "jalali"] as const).map((calendar) => (
              <button
                key={calendar}
                type="button"
                onClick={() => toggleCalendar(calendar)}
                className={`rounded-xl px-4 py-2 text-sm font-semibold ${form.enabledCalendars.includes(calendar) ? "bg-slate-950 text-white dark:bg-slate-100 dark:text-slate-950" : "bg-white text-slate-800 ring-1 ring-slate-300 dark:bg-slate-950 dark:text-slate-100 dark:ring-slate-700"}`}
              >
                {calendar === "gregorian" ? (isPersian ? "میلادی" : "Gregorian") : (isPersian ? "شمسی" : "Jalali / Persian")}
              </button>
            ))}
          </div>
          <div className={`mt-3 ${readableInlineInfoClass}`}>
            {isPersian
              ? "تقویم فعال یعنی کاربر/ادمین اجازه دارد آن نوع تاریخ را ببیند یا انتخاب کند. تقویم پیش‌فرض باید داخل همین گزینه‌های فعال باشد."
              : "Enabled calendars are available for user/admin display and input. The default calendar must be one of the enabled calendars."}
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-4 border-t pt-5 md:flex-row md:items-center md:justify-between">
          <label className="flex items-start gap-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.checked }))}
              className="mt-1 h-4 w-4 rounded border-slate-300"
            />
            <span>
              {isPersian ? "فعال باشد" : "Active"}
              <span className={readableHelpClass}>{activeHelp}</span>
            </span>
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
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-slate-100 dark:text-slate-950 dark:hover:bg-white"
          >
            {isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {isPersian ? "ذخیره تنظیمات" : "Save settings"}
          </button>
        </div>
      </div>
    </div>
  );
}
