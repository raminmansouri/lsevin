"use client";

import { useTranslations } from "next-intl";
import { useMemo, useState, useTransition } from "react";
import { CalendarOff, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { toast } from "sonner";

import DatePicker from "@/components/form/date-picker";
import {
  getBlockedHoursDayAction,
  saveBlockedHoursAction,
} from "@/features/provider-portal/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useRouter } from "@/i18n/navigation";

import { tCommon, tLabel } from "../lib/i18n";

import type { BlockedHoursDay, ProviderWorkspace } from "../types";

const dayKeys = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];
const dayNames = [
  "دوشنبه",
  "سه‌شنبه",
  "چهارشنبه",
  "پنجشنبه",
  "جمعه",
  "شنبه",
  "یکشنبه",
];

function shiftIsoDate(date: string, days: number) {
  const base = new Date(`${date}T00:00:00Z`);
  if (Number.isNaN(base.getTime())) return date;
  base.setUTCDate(base.getUTCDate() + days);
  return base.toISOString().slice(0, 10);
}

function blockedKeysOf(day: BlockedHoursDay) {
  return new Set(
    day.slots.filter((slot) => slot.isBlocked).map((slot) => slot.startsAt),
  );
}

export function BlockedHoursManager({
  workspace,
  day: initialDay,
}: {
  workspace: ProviderWorkspace;
  day: BlockedHoursDay;
}) {
  const router = useRouter();
  const t = useTranslations("ProviderPortal");
  const [isLoading, startLoading] = useTransition();
  const [isSaving, startSaving] = useTransition();
  const canManage = workspace.permissions.manageAvailability;

  // The page seeds today only; after that this card owns the shown date, so a
  // refresh of the surrounding page never drags the provider back to today.
  const [day, setDay] = useState(initialDay);
  const [blocked, setBlocked] = useState(() => blockedKeysOf(initialDay));

  const savedKeys = useMemo(() => blockedKeysOf(day), [day]);
  const isDirty = useMemo(() => {
    if (savedKeys.size !== blocked.size) return true;
    for (const key of savedKeys) if (!blocked.has(key)) return true;
    return false;
  }, [savedKeys, blocked]);

  const openSlots = day.slots.filter((slot) => !slot.isLocked);
  const isBusy = isLoading || isSaving;

  // Locked hours cannot be toggled one by one, so the bulk buttons must leave
  // them exactly as they are instead of silently dropping their rows on save.
  const withLockedKept = (next: Set<string>, previous: Set<string>) => {
    for (const slot of day.slots) {
      if (slot.isLocked && previous.has(slot.startsAt)) next.add(slot.startsAt);
    }
    return next;
  };

  const loadDate = (date: string) => {
    if (!date || date === day.date) return;
    startLoading(async () => {
      const response = await getBlockedHoursDayAction({
        providerId: workspace.provider.id,
        date,
      });
      if (!response.ok || !response.data) {
        toast.error(
          response.error ||
            tCommon(
              t,
              "blockedHoursCouldNotBeLoaded",
              "ساعات این روز بارگیری نشد.",
            ),
        );
        return;
      }
      setDay(response.data);
      setBlocked(blockedKeysOf(response.data));
    });
  };

  const toggleSlot = (startsAt: string) => {
    setBlocked((previous) => {
      const next = new Set(previous);
      if (next.has(startsAt)) next.delete(startsAt);
      else next.add(startsAt);
      return next;
    });
  };

  const onSubmit = () => {
    startSaving(async () => {
      const response = await saveBlockedHoursAction({
        providerId: workspace.provider.id,
        date: day.date,
        blockedSlots: day.slots
          .filter((slot) => blocked.has(slot.startsAt))
          .map((slot) => ({ startsAt: slot.startsAt, endsAt: slot.endsAt })),
      });
      if (!response.ok) {
        toast.error(
          response.error ||
            tCommon(
              t,
              "blockedHoursCouldNotBeSaved",
              "ذخیره ساعات خاموش انجام نشد.",
            ),
        );
        return;
      }
      const refreshed = await getBlockedHoursDayAction({
        providerId: workspace.provider.id,
        date: day.date,
      });
      if (refreshed.ok && refreshed.data) {
        setDay(refreshed.data);
        setBlocked(blockedKeysOf(refreshed.data));
      }
      toast.success(
        tCommon(t, "blockedHoursSaved", "ساعات خاموش این روز ذخیره شد."),
      );
      router.refresh();
    });
  };

  return (
    <Card className="rounded-3xl border-slate-200 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarOff className="h-5 w-5" />
          {tCommon(t, "blockedHours", "خاموش کردن ساعت‌های یک روز")}
        </CardTitle>
        <CardDescription>
          {tCommon(
            t,
            "blockedHoursDescription",
            "هر ساعتی که اینجا خاموش شود، برای همان تاریخ از تقویم رزرو مشتریان حذف می‌شود. ساعات کاری هفتگی دست‌نخورده باقی می‌ماند.",
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div
          dir="rtl"
          className="mb-5 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm leading-7 text-slate-900 shadow-sm dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-50"
        >
          <div className="font-semibold text-slate-950 dark:text-amber-50">
            راهنمای خاموش کردن ساعت‌ها
          </div>
          <p className="mt-1">
            اگر نوبتی خارج از اپلیکیشن (تلفنی یا حضوری) گرفته‌اید، تاریخ آن را
            انتخاب کنید و ساعت مربوطه را خاموش کنید تا مشتری دیگری نتواند همان
            ساعت را رزرو کند و تداخل پیش نیاید.
          </p>
          <p className="mt-2 text-xs text-slate-800 dark:text-amber-50">
            مثال: اگر روز ۱۴ ماه ساعت ۱۵ بیمار حضوری دارید، ساعت ۱۵:۰۰ تا ۱۶:۰۰
            را خاموش کنید. برای برگرداندن آن ساعت کافی است دوباره روشنش کنید.
          </p>
        </div>

        <div className="mb-5 grid gap-3 rounded-2xl border border-slate-200 p-4 md:grid-cols-[1fr_auto] md:items-end">
          <div className="space-y-2">
            <span className="text-xs font-medium text-slate-600">
              {tLabel(t, "تاریخ")}
            </span>
            <DatePicker
              value={day.date}
              onChange={loadDate}
              disabled={isBusy}
              placeholder={tLabel(t, "تاریخ")}
            />
            <p className="text-xs text-slate-500">
              {tCommon(t, `days.${dayKeys[day.dayOfWeek - 1]}`, dayNames[day.dayOfWeek - 1])}
              {day.isClosed
                ? ` · ${tCommon(t, "closedThisDay", "در این روز تعطیل است")}`
                : ` · ${day.opensAt} - ${day.closesAt}`}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              disabled={isBusy}
              onClick={() => loadDate(shiftIsoDate(day.date, -1))}
              aria-label={tCommon(t, "previousDay", "روز قبل")}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={isBusy}
              onClick={() => loadDate(new Date().toISOString().slice(0, 10))}
            >
              {tCommon(t, "today", "امروز")}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              disabled={isBusy}
              onClick={() => loadDate(shiftIsoDate(day.date, 1))}
              aria-label={tCommon(t, "nextDay", "روز بعد")}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 p-8 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            {tCommon(t, "loading", "در حال بارگیری...")}
          </div>
        ) : day.slots.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 p-8 text-center text-sm text-slate-500">
            {day.isClosed
              ? tCommon(
                  t,
                  "noOperatingHoursThisDay",
                  "برای این روز ساعت کاری تعریف نشده است، بنابراین زمانی برای خاموش کردن وجود ندارد.",
                )
              : tCommon(
                  t,
                  "noHoursToBlock",
                  "برای این روز ساعتی برای خاموش کردن وجود ندارد.",
                )}
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {day.slots.map((slot) => {
              const isBlocked = blocked.has(slot.startsAt);
              const disabled = !canManage || isBusy || slot.isLocked;
              return (
                <label
                  key={slot.startsAt}
                  className={[
                    "flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition",
                    slot.isLocked
                      ? "cursor-not-allowed border-slate-200 bg-slate-100"
                      : isBlocked
                        ? "border-rose-200 bg-rose-50"
                        : "border-slate-200 bg-white hover:border-slate-300",
                  ].join(" ")}
                >
                  <input
                    type="checkbox"
                    checked={slot.isLocked || isBlocked}
                    disabled={disabled}
                    onChange={() => toggleSlot(slot.startsAt)}
                    className="mt-1 h-4 w-4 rounded border-slate-300"
                  />
                  <span className="min-w-0 flex-1 space-y-1">
                    <span className="block font-medium text-slate-900">
                      {slot.startsAt} - {slot.endsAt}
                    </span>
                    <span className="flex flex-wrap gap-1">
                      {slot.isLocked ? (
                        <Badge variant="secondary">
                          {tCommon(
                            t,
                            "blockedByAdmin",
                            "بسته شده در پنل مدیریت",
                          )}
                        </Badge>
                      ) : isBlocked ? (
                        <Badge variant="destructive">
                          {tCommon(t, "hourSwitchedOff", "خاموش")}
                        </Badge>
                      ) : (
                        <Badge variant="outline">
                          {tCommon(t, "hourOpen", "باز")}
                        </Badge>
                      )}
                      {slot.bookedCount > 0 ? (
                        <Badge variant="outline">
                          {slot.bookedCount}{" "}
                          {tCommon(t, "inAppBookings", "رزرو در اپلیکیشن")}
                        </Badge>
                      ) : null}
                    </span>
                  </span>
                </label>
              );
            })}
          </div>
        )}

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t pt-5">
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={!canManage || isBusy || openSlots.length === 0}
              onClick={() =>
                setBlocked((previous) =>
                  withLockedKept(
                    new Set(openSlots.map((slot) => slot.startsAt)),
                    previous,
                  ),
                )
              }
            >
              {tCommon(t, "switchOffAllHours", "خاموش کردن همه ساعات")}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={!canManage || isBusy || blocked.size === 0}
              onClick={() =>
                setBlocked((previous) => withLockedKept(new Set(), previous))
              }
            >
              {tCommon(t, "switchOnAllHours", "روشن کردن همه ساعات")}
            </Button>
          </div>
          <Button
            type="button"
            onClick={onSubmit}
            disabled={!canManage || isBusy || !isDirty}
          >
            {isSaving
              ? tCommon(t, "saving", "در حال ذخیره...")
              : tCommon(t, "saveBlockedHours", "ذخیره ساعات این روز")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
