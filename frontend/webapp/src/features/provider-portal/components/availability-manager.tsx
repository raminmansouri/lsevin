"use client";

import { useTranslations } from "next-intl";
import { useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Clock } from "lucide-react";
import { useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { saveOperatingHoursAction } from "@/features/provider-portal/actions";
import { saveOperatingHoursSchema } from "@/features/provider-portal/schemas";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useRouter } from "@/i18n/navigation";

import { tCommon, tLabel } from "../lib/i18n";

import type { OperatingHourRow, ProviderWorkspace } from "../types";

const dayKeys = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
const dayNames = [
  "دوشنبه",
  "سه‌شنبه",
  "چهارشنبه",
  "پنجشنبه",
  "جمعه",
  "شنبه",
  "یکشنبه",
];

type FormValues = z.infer<typeof saveOperatingHoursSchema>;

export function AvailabilityManager({
  workspace,
  hours,
}: {
  workspace: ProviderWorkspace;
  hours: OperatingHourRow[];
}) {
  const router = useRouter();
  const t = useTranslations("ProviderPortal");
  const [isPending, startTransition] = useTransition();
  const canManage = workspace.permissions.manageAvailability;

  const form = useForm<FormValues>({
    resolver: zodResolver(saveOperatingHoursSchema),
    defaultValues: {
      providerId: workspace.provider.id,
      hours: hours.map((hour) => ({
        dayOfWeek: hour.dayOfWeek,
        opensAt: hour.opensAt || "09:00",
        closesAt: hour.closesAt || "18:00",
        isClosed: hour.isClosed,
        slotIntervalMinutes: hour.slotIntervalMinutes || 15,
      })),
    },
  });

  const fields = useFieldArray({ control: form.control, name: "hours" });

  const onSubmit = (values: FormValues) => {
    startTransition(async () => {
      const response = await saveOperatingHoursAction(values);
      if (!response.ok) {
        toast.error(
          response.error ||
            tCommon(
              t,
              "availabilityCouldNotBeSaved",
              "ذخیره زمان کاری انجام نشد.",
            ),
        );
        return;
      }
      toast.success(
        tCommon(t, "operatingHoursSaved", "ساعات کاری ذخیره شد."),
      );
      router.refresh();
    });
  };

  return (
    <Card className="rounded-3xl border-slate-200 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          {tCommon(t, "operatingHours", "ساعات کاری")}
        </CardTitle>
        <CardDescription>
          {tCommon(
            t,
            "operatingHoursDescription",
            "این ساعت‌ها تنظیم پیش‌فرض مرکز هستند. اگر برای پزشک/کارشناس زمان جداگانه تعریف شود، زمان اختصاصی او روی این تنظیمات اعمال می‌شود.",
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div dir="rtl" className="mb-5 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm leading-7 text-slate-900 shadow-sm dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-50">
          <div className="font-semibold text-slate-950 dark:text-amber-50">راهنمای تعریف ساعات کاری مرکز</div>
          <p className="mt-1">برای هر روز، ساعت شروع، ساعت پایان و فاصله نوبت را مشخص کنید. اگر مرکز در یک روز تعطیل است، گزینه تعطیل را روشن کنید.</p>
          <p className="mt-2 text-xs text-slate-800 dark:text-amber-50">مثال: شروع 09:00، پایان 17:00 و فاصله نوبت 30 یعنی سیستم در طول روز هر 30 دقیقه یک زمان رزرو می‌سازد.</p>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <input type="hidden" {...form.register("providerId")} />
          {fields.fields.map((field, index) => (
            <div
              key={field.id}
              className="grid gap-3 rounded-2xl border border-slate-200 p-4 md:grid-cols-[140px_1fr_1fr_1fr_120px] md:items-end"
            >
              <input
                type="hidden"
                {...form.register(`hours.${index}.dayOfWeek`)}
              />
              <div>
                <p className="font-medium text-slate-900">
                  {tCommon(
                    t,
                    `days.${dayKeys[index]}`,
                    dayNames[index],
                  )}
                </p>
                <p className="text-xs text-slate-500">
                  {tCommon(t, "dayNumber", "روز {number}", {
                    number: index + 1,
                  })}
                </p>
              </div>

              <label className="space-y-2">
                <span className="text-xs font-medium text-slate-600">
                  {tLabel(t, "شروع")}
                </span>
                <Input
                  type="time"
                  {...form.register(`hours.${index}.opensAt`)}
                  disabled={
                    !canManage ||
                    isPending ||
                    form.watch(`hours.${index}.isClosed`)
                  }
                />
              </label>

              <label className="space-y-2">
                <span className="text-xs font-medium text-slate-600">
                  {tLabel(t, "پایان")}
                </span>
                <Input
                  type="time"
                  {...form.register(`hours.${index}.closesAt`)}
                  disabled={
                    !canManage ||
                    isPending ||
                    form.watch(`hours.${index}.isClosed`)
                  }
                />
              </label>

              <label className="space-y-2">
                <span className="text-xs font-medium text-slate-600">
                  {tLabel(t, "فاصله نوبت")}
                </span>
                <Input
                  type="number"
                  {...form.register(`hours.${index}.slotIntervalMinutes`)}
                  disabled={!canManage || isPending}
                />
              </label>

              <label className="flex items-center gap-2 pb-3 text-sm">
                <input
                  type="checkbox"
                  {...form.register(`hours.${index}.isClosed`)}
                  disabled={!canManage || isPending}
                  className="h-4 w-4 rounded border-slate-300"
                />
                {tLabel(t, "تعطیل")}
              </label>
            </div>
          ))}

          <div className="flex justify-end border-t pt-5">
            <Button type="submit" disabled={!canManage || isPending}>
              {isPending
                ? tCommon(t, "saving", "در حال ذخیره...")
                : tCommon(t, "saveHours", "ذخیره ساعات")}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
