"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import type { DoctorHour } from "../../doctor-panel-types";
import { saveDoctorHoursAction } from "../../server/doctor-panel";

const WEEKDAYS = [0, 1, 2, 3, 4, 5, 6] as const;
const DEFAULT_RANGE = { startTime: "09:00", endTime: "13:00" };

type Row = DoctorHour & { key: number };

/**
 * The GP's weekly working hours (Tehran time), a few ranges per day. Saved as a
 * whole; patients will book inside these hours.
 */
export function DoctorHoursTab({
  hours,
  onSaved,
}: {
  hours: DoctorHour[];
  onSaved: (hours: DoctorHour[]) => void;
}) {
  const t = useTranslations("Consultation.doctorPanel");
  const [rows, setRows] = useState<Row[]>(() => hours.map((hour, key) => ({ ...hour, key })));
  const [nextKey, setNextKey] = useState(hours.length);
  const [isPending, startTransition] = useTransition();

  const add = (weekday: number) => {
    const dayRows = rows.filter((row) => row.weekday === weekday);
    const last = dayRows[dayRows.length - 1];
    // A second range on the same day starts where the previous one ended.
    const range = last && last.endTime < "20:00"
      ? { startTime: last.endTime, endTime: last.endTime < "17:00" ? "17:00" : "21:00" }
      : DEFAULT_RANGE;
    setRows((prev) => [...prev, { weekday, ...range, key: nextKey }]);
    setNextKey((key) => key + 1);
  };

  const update = (key: number, patch: Partial<DoctorHour>) =>
    setRows((prev) => prev.map((row) => (row.key === key ? { ...row, ...patch } : row)));

  const remove = (key: number) => setRows((prev) => prev.filter((row) => row.key !== key));

  const save = () => {
    if (rows.some((row) => row.endTime <= row.startTime)) {
      toast.error(t("errors.endBeforeStart"));
      return;
    }
    startTransition(async () => {
      try {
        const result = await saveDoctorHoursAction(
          rows.map(({ weekday, startTime, endTime }) => ({ weekday, startTime, endTime }))
        );
        if (!result.ok || !result.data) {
          toast.error(result.error === "overlap" ? t("errors.overlap") : t("errors.invalid"));
          return;
        }
        onSaved(result.data);
        setRows(result.data.map((hour, key) => ({ ...hour, key })));
        setNextKey(result.data.length);
        toast.success(t("hoursSaved"));
      } catch {
        toast.error(t("errors.loadFailed"));
      }
    });
  };

  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-600">{t("hoursHint")}</p>

      {WEEKDAYS.map((weekday) => {
        const dayRows = rows.filter((row) => row.weekday === weekday);
        return (
          <div key={weekday} className="rounded-2xl bg-white p-3 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="font-bold text-gray-900">{t(`weekdays.${weekday}`)}</p>
              <button
                type="button"
                onClick={() => add(weekday)}
                disabled={isPending}
                className="flex items-center gap-1 rounded-full bg-[#083f30]/10 px-3 py-1.5 text-xs font-medium text-[#083f30]"
              >
                <Plus className="h-3.5 w-3.5" aria-hidden />
                {t("addRange")}
              </button>
            </div>

            {dayRows.length === 0 ? (
              <p className="mt-2 text-xs text-gray-500">{t("dayOff")}</p>
            ) : (
              <div className="mt-2 space-y-2">
                {dayRows.map((row) => (
                  <div key={row.key} className="flex items-center gap-2" dir="ltr">
                    <input
                      type="time"
                      step={300}
                      value={row.startTime}
                      onChange={(event) => update(row.key, { startTime: event.target.value })}
                      aria-label={t("from")}
                      className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm"
                      disabled={isPending}
                    />
                    <span className="text-gray-400">–</span>
                    <input
                      type="time"
                      step={300}
                      value={row.endTime}
                      onChange={(event) => update(row.key, { endTime: event.target.value })}
                      aria-label={t("to")}
                      className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm"
                      disabled={isPending}
                    />
                    <button
                      type="button"
                      onClick={() => remove(row.key)}
                      disabled={isPending}
                      aria-label={t("removeRange")}
                      className="rounded-xl p-2 text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}

      <button
        type="button"
        onClick={save}
        disabled={isPending}
        className="w-full rounded-2xl bg-[#083f30] py-3 text-sm font-bold text-white disabled:opacity-60"
      >
        {t("saveHours")}
      </button>
    </div>
  );
}
