"use client";

import { useState, useTransition } from "react";
import { ArrowLeft } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import DatePicker from "@/components/form/date-picker";
import { SEX_AT_BIRTH } from "@/features/patients/intake-schemas";
import { startMyHealthRecordAction } from "@/features/patients/server/customer-intake-actions";
import { useRouter } from "@/i18n/navigation";
import type { TranslationType } from "@/types/next";

import { Choice, Field, inputClass } from "./questionnaire/ui";

/**
 * First visit: create the account's own health record from name, birth date
 * and sex only -- no ID number, no review -- then go straight into the
 * questionnaire.
 */
export function StartRecordForm({ defaultFirstName, defaultLastName }: { defaultFirstName: string; defaultLastName: string }) {
  const t = useTranslations("MobileProfile.myHealthRecord.intake") as TranslationType;
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [firstName, setFirstName] = useState(defaultFirstName);
  const [lastName, setLastName] = useState(defaultLastName);
  const [birthDate, setBirthDate] = useState("");
  const [sexAtBirth, setSexAtBirth] = useState<(typeof SEX_AT_BIRTH)[number] | undefined>();

  const submit = () => {
    if (!firstName.trim() || !lastName.trim()) {
      toast.error(t("errors.nameRequired"));
      return;
    }
    startTransition(async () => {
      const result = await startMyHealthRecordAction({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        birthDate: birthDate || undefined,
        sexAtBirth,
      });
      if (!result.ok || !result.data) {
        toast.error(result.error || t("errors.generic"));
        return;
      }
      router.push(`/account/my-health-record/questionnaire?patient=${result.data.patientId}&step=about`);
    });
  };

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t("about.firstName")}>
          <input className={inputClass} value={firstName} onChange={(e) => setFirstName(e.target.value)} />
        </Field>
        <Field label={t("about.lastName")}>
          <input className={inputClass} value={lastName} onChange={(e) => setLastName(e.target.value)} />
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t("about.birthDate")}>
          <DatePicker value={birthDate || undefined} onChange={setBirthDate} disableFuture enableMonthYearSelect placeholder={t("pickDate")} />
        </Field>
        <Field label={t("about.sex")}>
          <Choice
            value={sexAtBirth}
            onChange={setSexAtBirth}
            columns={3}
            options={SEX_AT_BIRTH.map((value) => ({ value, label: t(`about.sexes.${value}`) }))}
          />
        </Field>
      </div>
      <button
        type="button"
        disabled={isPending}
        onClick={submit}
        className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#083f30] px-7 text-sm font-bold text-white transition hover:bg-[#0f5a45] disabled:opacity-60 sm:w-auto"
      >
        {isPending ? t("nav.saving") : t("start.submit")}
        <ArrowLeft size={16} className="ltr:rotate-180" />
      </button>
      <p className="text-xs leading-5 text-[#8a806d]">{t("start.notice")}</p>
    </div>
  );
}
