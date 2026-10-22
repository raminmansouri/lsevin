"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { ChevronLeft, Clock, Loader2, User } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";

import { ImageWithFallback } from "@/components/ui/image-with-fallback";
import { resolveHomeMediaUrl } from "@/features/home/components/home-media";
import MultiMediaPickerInput from "@/features/media-picker-addon/components/MultiMediaPickerInput";
import { useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

import type { BookingOptions } from "../patient-booking-types";
import { createVideoSessionAction, getBookingOptionsAction } from "../server/patient-booking";
import {
  formatSessionDate,
  formatSessionTime,
  sessionDayKey,
} from "./doctor-panel/panel-format";

type Gender = "male" | "female" | "other";

/**
 * The patient picks a free time with the GP and describes their problem. The
 * request is saved unpaid and holds the time while the patient pays.
 */
export function VideoBookingPage({ doctorId }: { doctorId: string }) {
  const t = useTranslations("Consultation.booking");
  const locale = useLocale();
  const router = useRouter();
  const [options, setOptions] = useState<BookingOptions | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [day, setDay] = useState<string | null>(null);
  const [slot, setSlot] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState<Gender | null>(null);
  const [note, setNote] = useState("");
  const [files, setFiles] = useState<string[]>([]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [isPending, startTransition] = useTransition();

  const load = useCallback(() => {
    getBookingOptionsAction(doctorId)
      .then((result) => {
        if (result.ok && result.data) {
          setOptions(result.data);
          setName((prev) => prev || result.data!.patientName);
          setError(null);
        } else {
          setError(t(`errors.${result.error ?? "loadFailed"}`));
        }
      })
      .catch(() => setError(t("errors.loadFailed")));
  }, [doctorId, t]);

  useEffect(load, [load]);

  // Free times grouped under their Tehran day.
  const days = useMemo(() => {
    const groups: Array<{ key: string; label: string; slots: string[] }> = [];
    for (const iso of options?.slots ?? []) {
      const key = sessionDayKey(iso);
      let group = groups.find((g) => g.key === key);
      if (!group) {
        group = { key, label: formatSessionDate(locale, iso), slots: [] };
        groups.push(group);
      }
      group.slots.push(iso);
    }
    return groups;
  }, [options, locale]);

  const activeDay = days.find((d) => d.key === day) ?? days[0] ?? null;

  const submit = () => {
    if (!options || !slot) {
      toast.error(t("errors.pickTime"));
      return;
    }
    startTransition(async () => {
      try {
        const result = await createVideoSessionAction({
          doctorId,
          scheduledAt: slot,
          patientName: name,
          patientAge: age,
          patientGender: gender,
          patientNote: note,
          attachmentMediaIds: files,
        });
        if (result.ok && result.data) {
          router.replace(`/n/app/mobile/consultation/sessions/${result.data.id}`);
          return;
        }
        setFieldErrors(result.fieldErrors ?? {});
        toast.error(t(`errors.${result.error ?? "loadFailed"}`));
        if (result.error === "slotTaken") {
          setSlot(null);
          load();
        }
      } catch {
        toast.error(t("errors.loadFailed"));
      }
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      <div className="sticky top-0 z-40 border-b border-gray-100 bg-white">
        <div className="flex items-center gap-3 px-5 pt-3 pb-4">
          <button
            type="button"
            onClick={() => router.back()}
            aria-label={t("back")}
            className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-gray-100"
          >
            <ChevronLeft size={24} className="text-gray-700 rtl:rotate-180" />
          </button>
          <h1 className="min-w-0 flex-1 truncate text-xl font-bold text-gray-900">{t("title")}</h1>
        </div>
      </div>

      {error && <p className="px-5 py-16 text-center text-sm text-gray-600">{error}</p>}

      {!error && !options && (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-[#083f30]" aria-hidden />
        </div>
      )}

      {options && (
        <div className="space-y-4 px-5 pt-4">
          <DoctorSummary options={options} />

          <section className="rounded-2xl bg-white p-4 shadow-sm">
            <h2 className="font-bold text-gray-900">{t("pickTime")}</h2>
            {days.length === 0 ? (
              <p className="mt-2 text-sm text-gray-600">{t("noSlots")}</p>
            ) : (
              <>
                <div className="-mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1">
                  {days.map((d) => (
                    <button
                      key={d.key}
                      type="button"
                      onClick={() => {
                        setDay(d.key);
                        setSlot(null);
                      }}
                      className={cn(
                        "shrink-0 rounded-xl border px-3 py-2 text-xs font-medium",
                        activeDay?.key === d.key
                          ? "border-[#083f30] bg-[#083f30] text-white"
                          : "border-gray-200 bg-white text-gray-700"
                      )}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
                <div className="mt-3 grid grid-cols-4 gap-2">
                  {activeDay?.slots.map((iso) => (
                    <button
                      key={iso}
                      type="button"
                      onClick={() => setSlot(iso)}
                      dir="ltr"
                      className={cn(
                        "rounded-xl border py-2 text-sm font-medium",
                        slot === iso
                          ? "border-[#083f30] bg-[#083f30] text-white"
                          : "border-gray-200 bg-white text-gray-800"
                      )}
                    >
                      {formatSessionTime(locale, iso)}
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-xs text-gray-500">{t("tehranTime")}</p>
              </>
            )}
          </section>

          <section className="space-y-3 rounded-2xl bg-white p-4 shadow-sm">
            <h2 className="font-bold text-gray-900">{t("aboutYou")}</h2>
            <Field label={t("name")} error={fieldErrors.patientName && t("errors.name")}>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[#083f30]"
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label={t("age")} error={fieldErrors.patientAge && t("errors.age")}>
                <input
                  value={age}
                  onChange={(event) => setAge(event.target.value)}
                  inputMode="numeric"
                  dir="ltr"
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[#083f30]"
                />
              </Field>
              <Field label={t("gender")}>
                <div className="flex gap-1">
                  {(["female", "male"] as const).map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setGender(gender === value ? null : value)}
                      className={cn(
                        "flex-1 rounded-xl border py-2.5 text-sm",
                        gender === value
                          ? "border-[#083f30] bg-[#083f30] text-white"
                          : "border-gray-200 text-gray-700"
                      )}
                    >
                      {t(`genders.${value}`)}
                    </button>
                  ))}
                </div>
              </Field>
            </div>
            <Field
              label={t("note")}
              hint={t("noteHint")}
              error={fieldErrors.patientNote && t("errors.note")}
            >
              <textarea
                value={note}
                onChange={(event) => setNote(event.target.value)}
                rows={5}
                maxLength={4000}
                className="w-full rounded-xl border border-gray-200 p-3 text-sm outline-none focus:border-[#083f30]"
              />
            </Field>
            <Field label={t("files")} hint={t("filesHint")}>
              <MultiMediaPickerInput
                name="consultation-files"
                mediaType="all"
                placeholder={t("addFiles")}
                onItemsChange={(items) => setFiles(items.map((item) => item.id).slice(0, 10))}
              />
            </Field>
          </section>
        </div>
      )}

      {options && days.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-50 border-t border-gray-100 bg-white px-5 py-3">
          <button
            type="button"
            onClick={submit}
            disabled={isPending || !slot}
            className="w-full rounded-2xl bg-[#083f30] py-3.5 text-sm font-bold text-white disabled:bg-gray-300"
          >
            {isPending ? (
              <Loader2 className="mx-auto h-5 w-5 animate-spin" aria-hidden />
            ) : slot ? (
              t("submit", { time: `${formatSessionDate(locale, slot)} ${formatSessionTime(locale, slot)}` })
            ) : (
              t("pickTimeFirst")
            )}
          </button>
        </div>
      )}
    </div>
  );
}

function DoctorSummary({ options }: { options: BookingOptions }) {
  const t = useTranslations("Consultation.booking");
  const imageUrl = resolveHomeMediaUrl(options.doctor.imageUrl);
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-[#083f30] p-4 text-white">
      <div className="size-14 shrink-0 overflow-hidden rounded-2xl bg-white/10">
        {imageUrl ? (
          <ImageWithFallback
            width={112}
            height={112}
            src={imageUrl}
            alt={options.doctor.name}
            className="h-full w-full object-cover"
            fallbackIcon={<User className="h-6 w-6 text-white/60" />}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <User className="h-6 w-6 text-white/60" aria-hidden />
          </div>
        )}
      </div>
      <div className="min-w-0">
        <p className="truncate font-bold">{options.doctor.name}</p>
        <p className="text-xs text-[#eacb7f]">{t("generalPractitioner")}</p>
        <p className="mt-1 flex items-center gap-1 text-xs text-white/80">
          <Clock className="h-3.5 w-3.5" aria-hidden />
          {t("offer", { minutes: options.durationMinutes, price: options.priceLabel })}
        </p>
      </div>
    </div>
  );
}

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string | false;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <p className="text-sm font-medium text-gray-800">{label}</p>
      {hint && <p className="text-xs text-gray-500">{hint}</p>}
      {children}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
