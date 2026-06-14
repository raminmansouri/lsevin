"use client";

import { useMemo, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { CalendarDays, Loader2, Save } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import useAction from "@/hooks/use-action";
import { Link, useRouter } from "@/i18n/navigation";
import { saveGenericAvailabilityRuleAction } from "@/features/booking-pro/admin/actions";
import { LazyAvailabilityLookupSelect } from "./lazy-availability-lookup-select";
import { RichTextPreview } from "@/features/booking/components/rich-text-preview";
import type {
  AvailabilityLookups,
  GenericAvailabilityRule,
  GenericAvailabilityTargetType,
  LookupOption,
} from "@/features/booking-pro/server/generic-availability-admin.repository";
import {
  availabilityText,
  readableGuideClass,
  readableHelpClass,
  readableInlineInfoClass,
  ruleTypeExplanationsFa,
  targetTypeExplanationsFa,
} from "./availability-admin-copy";

type Props = {
  rule?: GenericAvailabilityRule | null;
  lookups?: AvailabilityLookups;
  locale: string;
  defaultTargetType?: string | null;
  defaultTargetId?: string | null;
  defaultProviderServiceId?: string | null;
};

const TARGET_TYPES: GenericAvailabilityTargetType[] = [
  "provider",
  "provider_service",
  "service_definition",
  "staff",
  "provider_staff",
  "bookable_resource",
];

const DAYS = [1, 2, 3, 4, 5, 6, 7];

const TIMEZONE_OPTIONS = [
  { value: "Asia/Tehran", faLabel: "ایران — Asia/Tehran", enLabel: "Iran — Asia/Tehran" },
  { value: "Europe/Istanbul", faLabel: "ترکیه — Europe/Istanbul", enLabel: "Turkey — Europe/Istanbul" },
  { value: "Asia/Dubai", faLabel: "امارات / عمان — Asia/Dubai", enLabel: "UAE/Oman — Asia/Dubai" },
  { value: "Asia/Baghdad", faLabel: "عراق — Asia/Baghdad", enLabel: "Iraq — Asia/Baghdad" },
  { value: "Asia/Qatar", faLabel: "قطر — Asia/Qatar", enLabel: "Qatar — Asia/Qatar" },
  { value: "Asia/Kuwait", faLabel: "کویت — Asia/Kuwait", enLabel: "Kuwait — Asia/Kuwait" },
  { value: "UTC", faLabel: "UTC / حالت عمومی", enLabel: "UTC / Generic" },
];

function emptyRule(input?: Props): GenericAvailabilityRule {
  const targetType = (input?.defaultTargetType as GenericAvailabilityTargetType) || "provider_service";
  return {
    targetType,
    targetId: input?.defaultTargetId || "",
    serviceProviderId: null,
    providerServiceId: input?.defaultProviderServiceId || null,
    resourceId: null,
    dayOfWeek: null,
    dayOfWeeks: [1, 2, 3, 4, 5, 6, 7],
    specificDate: null,
    startsAt: "09:00",
    endsAt: "17:00",
    isAvailable: true,
    isActive: true,
    capacity: null,
    slotIntervalMinutes: 15,
    minBookingMinutes: null,
    maxBookingMinutes: null,
    priority: 100,
    timezoneId: "Asia/Tehran",
    metadata: {},
  };
}

function needsProviderBeforeTarget(type: GenericAvailabilityTargetType) {
  return type === "provider_service" || type === "provider_staff" || type === "bookable_resource";
}

export function AvailabilityRuleForm(props: Props) {
  const { rule, locale } = props;
  const t = useTranslations("AvailabilityAdmin");
  const { tr, isPersian } = availabilityText(locale, t as any);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState<GenericAvailabilityRule>(() => {
    const initial = rule || emptyRule(props);
    return {
      ...initial,
      dayOfWeeks: initial.specificDate ? [] : initial.dayOfWeeks?.length ? initial.dayOfWeeks : initial.dayOfWeek ? [initial.dayOfWeek] : [],
    };
  });

  const selectedWeekdays = form.specificDate ? [] : Array.from(new Set(form.dayOfWeeks || [])).sort((a, b) => a - b);

  const targetHelper = tr(`targetTypeHelp.${form.targetType}`);
  const targetDisabled = needsProviderBeforeTarget(form.targetType) && !form.serviceProviderId;

  const { execute } = useAction(saveGenericAvailabilityRuleAction, {
    startTransition,
    onSuccess: () => {
      toast.success(rule?.id ? tr("toasts.ruleUpdated") : tr("toasts.ruleCreated"));
      router.push("/admin/availability");
      router.refresh();
    },
    onError: (error) => toast.error(error?.detail || error?.title || tr("toasts.ruleSaveFailed")),
  });

  function applyProvider(value: string | null) {
    setForm((current) => ({
      ...current,
      serviceProviderId: value,
      providerServiceId: null,
      resourceId: null,
      targetId: needsProviderBeforeTarget(current.targetType) ? "" : current.targetId,
    }));
  }

  function applyTarget(value: string | null, selected: LookupOption | null) {
    setForm((current) => ({
      ...current,
      targetId: value || "",
      targetLabel: selected?.label || null,
      targetDescription: selected?.description || null,
      serviceProviderId: selected?.serviceProviderId || (current.targetType === "provider" ? value : current.serviceProviderId) || null,
      providerServiceId: selected?.providerServiceId || (current.targetType === "provider_service" ? value : current.providerServiceId) || null,
      providerServiceLabel: current.targetType === "provider_service" ? selected?.label || null : current.providerServiceLabel || null,
      providerServiceDescription: current.targetType === "provider_service" ? selected?.description || null : current.providerServiceDescription || null,
      resourceId: current.targetType === "bookable_resource" ? value : selected?.targetType === "bookable_resource" ? value : current.resourceId || null,
    }));
  }

  function applyProviderService(value: string | null, selected: LookupOption | null) {
    setForm((current) => ({
      ...current,
      providerServiceId: value,
      providerServiceLabel: selected?.label || null,
      providerServiceDescription: selected?.description || null,
      serviceProviderId: selected?.serviceProviderId || current.serviceProviderId || null,
      resourceId: null,
    }));
  }

  function setWeekdays(days: number[]) {
    const cleaned = Array.from(new Set(days)).filter((day) => day >= 1 && day <= 7).sort((a, b) => a - b);
    setForm((current) => ({
      ...current,
      dayOfWeeks: cleaned,
      dayOfWeek: cleaned[0] || null,
      specificDate: null,
    }));
  }

  function toggleWeekday(day: number) {
    const next = selectedWeekdays.includes(day)
      ? selectedWeekdays.filter((currentDay) => currentDay !== day)
      : [...selectedWeekdays, day];
    setWeekdays(next);
  }

  function clearSpecificDate() {
    setForm((current) => ({ ...current, specificDate: null, dayOfWeeks: current.dayOfWeeks?.length ? current.dayOfWeeks : [1, 2, 3, 4, 5, 6, 7], dayOfWeek: current.dayOfWeek || 1 }));
  }

  const targetPlaceholder = useMemo(() => {
    if (targetDisabled) return tr("placeholders.selectProviderFirst");
    return tr("placeholders.selectTarget");
  }, [targetDisabled, tr]);

  const selectedTargetExplanation = isPersian ? targetTypeExplanationsFa[form.targetType] : targetHelper;
  const selectedRuleTypeExplanation = isPersian ? ruleTypeExplanationsFa[form.isAvailable ? "available" : "blocked"] : (form.isAvailable ? "This rule opens bookable time slots." : "This rule blocks customers from booking this time window.");
  const servicePreviewTitle = form.providerServiceLabel || (form.targetType === "provider_service" ? form.targetLabel : null);
  const servicePreviewDescription = form.providerServiceDescription || (form.targetType === "provider_service" ? form.targetDescription : null);
  const guide = isPersian
    ? {
        title: "راهنمای سریع تعریف زمان رزرو",
        intro: "این فرم تعیین می‌کند مشتری در چه روزها و ساعت‌هایی امکان رزرو یک خدمت، پزشک، اتاق یا منبع مشخص را ببیند.",
        steps: [
          "برای خدمات معمولی ابتدا مرکز/Provider را انتخاب کنید، سپس خدمت همان مرکز را در قسمت هدف انتخاب کنید.",
          "اگر قانون برای همه روزهای هفته تکرار می‌شود، روزهای تکرارشونده را انتخاب کنید و تاریخ خاص را خالی بگذارید.",
          "اگر فقط یک روز خاص مثل تعطیلی، مرخصی یا ظرفیت ویژه مدنظر است، تاریخ خاص را انتخاب کنید؛ تاریخ خاص از روزهای هفته مهم‌تر است.",
          "برای باز کردن رزرو، نوع قانون را «قابل رزرو» بگذارید. برای بستن یک بازه، مثل ناهار یا روز تعطیل، آن را «مسدود» کنید.",
          "فاصله نوبت‌ها مشخص می‌کند سیستم هر چند دقیقه یک گزینه رزرو بسازد؛ برای مثال ۱۵ یعنی 09:00، 09:15، 09:30.",
        ],
        note: "نمونه: برای ویزیت پزشک از شنبه تا چهارشنبه، روزها را انتخاب کنید، ساعت شروع 09:00، پایان 17:00، فاصله نوبت 30 و ظرفیت 1 قرار دهید.",
      }
    : {
        title: "Booking availability guide",
        intro: "This form controls which dates and time slots customers can book for a provider, service, staff member, room, vehicle, or other resource.",
        steps: [
          "For normal service booking, select the provider first, then select that provider service as the target.",
          "For a repeating weekly schedule, select weekdays and leave the specific date empty.",
          "For one-off holidays, leave, or special capacity, choose a specific date; a specific date overrides weekdays.",
          "Use an available rule to open booking time. Use a blocked rule to close time such as lunch breaks or days off.",
          "Slot interval controls how often the system creates bookable choices; for example 15 creates 09:00, 09:15, 09:30.",
        ],
        note: "Example: for doctor visits from Saturday to Wednesday, select those weekdays, start 09:00, end 17:00, slot interval 30, and capacity 1.",
      };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{rule?.id ? tr("ruleForm.editTitle") : tr("ruleForm.addTitle")}</CardTitle>
        <CardDescription>{tr("ruleForm.description")}</CardDescription>
      </CardHeader>
      <CardContent>
        <div dir={isPersian ? "rtl" : "ltr"} className={readableGuideClass}>
          <div className="font-semibold text-slate-950 dark:text-amber-50">{guide.title}</div>
          <p className="mt-1">{guide.intro}</p>
          <ul className="mt-3 list-inside list-disc space-y-1">
            {guide.steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ul>
          <p className="mt-3 rounded-xl border border-amber-200 bg-white p-3 text-xs leading-6 text-slate-900 dark:border-amber-800 dark:bg-slate-950 dark:text-amber-50">{guide.note}</p>
        </div>

        <form
          className="space-y-6"
          onSubmit={(event) => {
            event.preventDefault();
            const dayOfWeeks = form.specificDate ? [] : selectedWeekdays;
            execute({ ...form, id: form.id || undefined, dayOfWeeks, dayOfWeek: dayOfWeeks[0] || null } as any);
          }}
        >
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block text-sm font-medium">
              {tr("fields.targetType")}
              <select
                value={form.targetType}
                onChange={(event) => {
                  const nextType = event.target.value as GenericAvailabilityTargetType;
                  setForm((current) => ({
                    ...current,
                    targetType: nextType,
                    targetId: "",
                    resourceId: null,
                    providerServiceId: nextType === "provider_service" ? null : current.providerServiceId,
                  }));
                }}
                className="mt-2 h-11 w-full rounded-xl border bg-background px-3 text-sm outline-none focus:border-primary"
              >
                {TARGET_TYPES.map((type) => (
                  <option key={type} value={type}>{tr(`targetTypes.${type}`)}</option>
                ))}
              </select>
              {selectedTargetExplanation ? <span className={readableHelpClass}>{selectedTargetExplanation}</span> : null}
            </label>

            <LazyAvailabilityLookupSelect
              label={tr("fields.provider")}
              value={form.serviceProviderId || null}
              locale={locale}
              lookupType="providers"
              placeholder={tr("placeholders.optionalProviderContext")}
              searchPlaceholder={tr("placeholders.searchProviders")}
              emptyText={tr("empty.noProviders")}
              disabled={isPending}
              onChange={applyProvider}
            />

            <LazyAvailabilityLookupSelect
              label={tr("fields.target")}
              value={form.targetId || null}
              locale={locale}
              lookupType="targets"
              targetType={form.targetType}
              serviceProviderId={form.serviceProviderId || null}
              providerServiceId={form.providerServiceId || null}
              placeholder={targetPlaceholder}
              searchPlaceholder={tr("placeholders.searchTargets")}
              emptyText={tr("empty.noTargets")}
              disabled={isPending || targetDisabled}
              onChange={applyTarget}
            />

            <div>
              <LazyAvailabilityLookupSelect
                label={tr("fields.providerService")}
                value={form.providerServiceId || null}
                locale={locale}
                lookupType="providerServices"
                serviceProviderId={form.serviceProviderId || null}
                placeholder={tr("placeholders.optionalServiceContext")}
                searchPlaceholder={tr("placeholders.searchServices")}
                emptyText={tr("empty.noServices")}
                requiredParentMessage={tr("placeholders.selectProviderFirst")}
                disabled={isPending}
                onChange={applyProviderService}
              />
              <div className={readableHelpClass}>
                {isPersian
                  ? "Provider Service فقط زمینه و اتصال خدمت همان مرکز را مشخص می‌کند. Target یعنی رکورد اصلی‌ای که قانون روی آن اعمال می‌شود. برای رزرو خدمت معمولی معمولاً Target را هم همان Provider Service انتخاب کنید."
                  : "Provider Service is the provider-specific service context. Target is the actual record this rule applies to. For normal service booking, choose the same provider service as the target."}
              </div>
            </div>

            <LazyAvailabilityLookupSelect
              label={tr("fields.resourceContext")}
              value={form.resourceId || null}
              locale={locale}
              lookupType="resources"
              serviceProviderId={form.serviceProviderId || null}
              providerServiceId={form.providerServiceId || null}
              placeholder={tr("placeholders.optionalResource")}
              searchPlaceholder={tr("placeholders.searchResources")}
              emptyText={tr("empty.noResources")}
              disabled={isPending}
              onChange={(value) => setForm((current) => ({ ...current, resourceId: value }))}
            />

            <label className="block text-sm font-medium">
              {tr("fields.ruleType")}
              <select
                value={form.isAvailable ? "available" : "blocked"}
                onChange={(event) => setForm((current) => ({ ...current, isAvailable: event.target.value === "available" }))}
                className="mt-2 h-11 w-full rounded-xl border bg-background px-3 text-sm outline-none focus:border-primary"
              >
                <option value="available">{tr("ruleTypes.available")}</option>
                <option value="blocked">{tr("ruleTypes.blocked")}</option>
              </select>
              <span className={readableHelpClass}>{selectedRuleTypeExplanation}</span>
            </label>
          </div>

          {servicePreviewTitle || servicePreviewDescription ? (
            <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sm leading-7 text-slate-900 dark:border-sky-900 dark:bg-slate-950 dark:text-sky-50">
              <div className="font-semibold">{isPersian ? "پیش‌نمایش خدمت انتخاب‌شده" : "Selected service preview"}</div>
              {servicePreviewTitle ? <div className="mt-1 font-medium">{servicePreviewTitle}</div> : null}
              {servicePreviewDescription ? <RichTextPreview content={servicePreviewDescription} className="mt-2 text-sm leading-7" /> : null}
            </div>
          ) : null}

          <div className="rounded-2xl border p-4">
            <div className="mb-4 flex items-start gap-2">
              <CalendarDays className="mt-0.5 h-4 w-4 text-muted-foreground" />
              <div>
                <h3 className="font-semibold">{tr("sections.schedule")}</h3>
                <p className="mt-1 text-sm text-slate-700 dark:text-slate-200">{tr("help.weekdayBulk")}</p>
              </div>
            </div>
            <div className="space-y-5">
              <div>
                <div className="mb-2 text-sm font-medium">{tr("fields.recurringWeekdays")}</div>
                <div className="mb-3 flex flex-wrap gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => setWeekdays([1, 2, 3, 4, 5, 6, 7])}>{tr("quickDays.everyDay")}</Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => setWeekdays([1, 2, 3, 4, 5])}>{tr("quickDays.weekdays")}</Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => setWeekdays([6, 7])}>{tr("quickDays.weekend")}</Button>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setWeekdays([])}>{tr("quickDays.clear")}</Button>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
                  {DAYS.map((day) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleWeekday(day)}
                      className={`rounded-xl border px-3 py-2 text-sm font-medium transition ${selectedWeekdays.includes(day) ? "border-primary bg-primary text-primary-foreground" : "bg-background hover:bg-muted"}`}
                    >
                      {tr(`days.${day}`)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="block text-sm font-medium">
                  {tr("fields.specificDate")}
                  <input
                    type="date"
                    value={form.specificDate || ""}
                    onChange={(event) => {
                      if (event.target.value) {
                        setForm((current) => ({ ...current, specificDate: event.target.value, dayOfWeek: null, dayOfWeeks: [] }));
                      } else {
                        clearSpecificDate();
                      }
                    }}
                    className="mt-2 h-11 w-full rounded-xl border bg-background px-3 text-sm outline-none focus:border-primary"
                  />
                  <span className={readableHelpClass}>{tr("help.specificDateOverridesWeekdays")}</span>
                </label>

                <div className={readableInlineInfoClass}>
                  {form.specificDate
                    ? tr("labels.specificDateMode")
                    : selectedWeekdays.length
                      ? tr("labels.weeklyMode", { count: selectedWeekdays.length })
                      : tr("labels.noWeekdaysSelected")}
                </div>

                <label className="block text-sm font-medium">
                  {tr("fields.startsAt")}
                  <input
                    type="time"
                    value={form.startsAt || ""}
                    onChange={(event) => setForm((current) => ({ ...current, startsAt: event.target.value || null }))}
                    className="mt-2 h-11 w-full rounded-xl border bg-background px-3 text-sm outline-none focus:border-primary"
                  />
                  <span className={readableHelpClass}>{isPersian ? "اولین ساعتی که مشتری می‌تواند برای این قانون رزرو کند." : "The first time a customer can book within this rule."}</span>
                </label>

                <label className="block text-sm font-medium">
                  {tr("fields.endsAt")}
                  <input
                    type="time"
                    value={form.endsAt || ""}
                    onChange={(event) => setForm((current) => ({ ...current, endsAt: event.target.value || null }))}
                    className="mt-2 h-11 w-full rounded-xl border bg-background px-3 text-sm outline-none focus:border-primary"
                  />
                  <span className={readableHelpClass}>{isPersian ? "آخرین مرز زمانی قانون است؛ سیستم نوبتی بعد از این ساعت نمی‌سازد." : "The end boundary of the rule; the system will not create slots after this time."}</span>
                </label>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <label className="block text-sm font-medium">
              {tr("fields.capacity")}
              <input type="number" min={1} value={form.capacity ?? ""} onChange={(event) => setForm((current) => ({ ...current, capacity: event.target.value ? Number(event.target.value) : null }))} placeholder={tr("placeholders.auto")} className="mt-2 h-11 w-full rounded-xl border bg-background px-3 text-sm outline-none focus:border-primary" />
              <span className={readableHelpClass}>{isPersian ? "ظرفیت همزمان این بازه؛ برای پزشک معمولاً 1، برای کلاس/اتاق می‌تواند بیشتر باشد." : "Concurrent capacity for this window; usually 1 for a doctor, higher for classes or rooms."}</span>
            </label>
            <label className="block text-sm font-medium">
              {tr("fields.slotInterval")}
              <input type="number" min={1} value={form.slotIntervalMinutes ?? ""} onChange={(event) => setForm((current) => ({ ...current, slotIntervalMinutes: event.target.value ? Number(event.target.value) : null }))} placeholder="15" className="mt-2 h-11 w-full rounded-xl border bg-background px-3 text-sm outline-none focus:border-primary" />
              <span className={readableHelpClass}>{isPersian ? "هر چند دقیقه یک نوبت ساخته شود؛ 15، 30 و 60 رایج‌ترین مقدارها هستند." : "How frequently to generate slots; 15, 30, and 60 are the common values."}</span>
            </label>
            <label className="block text-sm font-medium">
              {tr("fields.priority")}
              <input type="number" value={form.priority ?? 100} onChange={(event) => setForm((current) => ({ ...current, priority: Number(event.target.value || 100) }))} className="mt-2 h-11 w-full rounded-xl border bg-background px-3 text-sm outline-none focus:border-primary" />
              <span className={readableHelpClass}>{isPersian ? "وقتی چند قانون روی یک زمان اثر دارند، اولویت بالاتر تصمیم نهایی را مشخص می‌کند." : "When multiple rules affect the same time, higher priority decides the final result."}</span>
            </label>
            <label className="block text-sm font-medium">
              {tr("fields.minBookingMinutes")}
              <input type="number" min={1} value={form.minBookingMinutes ?? ""} onChange={(event) => setForm((current) => ({ ...current, minBookingMinutes: event.target.value ? Number(event.target.value) : null }))} className="mt-2 h-11 w-full rounded-xl border bg-background px-3 text-sm outline-none focus:border-primary" />
              <span className={readableHelpClass}>{isPersian ? "حداقل مدت قابل رزرو در این بازه؛ اگر مطمئن نیستید خالی بگذارید." : "Minimum bookable duration in this window; leave empty if unsure."}</span>
            </label>
            <label className="block text-sm font-medium">
              {tr("fields.maxBookingMinutes")}
              <input type="number" min={1} value={form.maxBookingMinutes ?? ""} onChange={(event) => setForm((current) => ({ ...current, maxBookingMinutes: event.target.value ? Number(event.target.value) : null }))} className="mt-2 h-11 w-full rounded-xl border bg-background px-3 text-sm outline-none focus:border-primary" />
              <span className={readableHelpClass}>{isPersian ? "حداکثر مدت قابل رزرو؛ برای خدمات ثابت معمولاً لازم نیست پر شود." : "Maximum bookable duration; usually not needed for fixed-duration services."}</span>
            </label>
            <label className="block text-sm font-medium">
              {tr("fields.timezone")}
              <select value={form.timezoneId || "Asia/Tehran"} onChange={(event) => setForm((current) => ({ ...current, timezoneId: event.target.value || "Asia/Tehran" }))} className="mt-2 h-11 w-full rounded-xl border bg-background px-3 text-sm outline-none focus:border-primary">
                {TIMEZONE_OPTIONS.map((item) => <option key={item.value} value={item.value}>{isPersian ? item.faLabel : item.enLabel}</option>)}
              </select>
              <span className={readableHelpClass}>{isPersian ? "منطقه زمانی مرکز؛ برای ایران معمولاً Asia/Tehran است. انتخاب اشتباه باعث می‌شود ساعت‌های رزرو جابه‌جا نمایش داده شود." : "Provider timezone; for Iran this is usually Asia/Tehran. A wrong timezone shifts displayed booking hours."}</span>
            </label>
          </div>

          <label className="flex items-center gap-3 rounded-xl border p-4 text-sm font-medium">
            <input type="checkbox" checked={form.isActive ?? true} onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.checked }))} className="h-4 w-4" />
            {tr("fields.activeRule")}
          </label>

          <div className="flex flex-wrap gap-3">
            <Button type="submit" disabled={isPending}>
              {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              {tr("actions.saveRule")}
            </Button>
            <Button type="button" asChild variant="outline">
              <Link href="/admin/availability">{tr("actions.cancel")}</Link>
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
