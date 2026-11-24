"use client";

import { useState, useTransition } from "react";
import { UsersRound } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import DatePicker from "@/components/form/date-picker";
import type { AccountLinkRequestRow } from "@/features/patients/link-request-types";
import { PATIENT_IDENTIFIER_TYPES, PATIENT_RELATIONSHIP_TYPES } from "@/features/patients/schemas";
import { submitAccountLinkRequestAction } from "@/features/patients/server/customer-link-request-actions";
import { useRouter } from "@/i18n/navigation";
import type { TranslationType } from "@/types/next";

import { Choice, Field, inputClass } from "./questionnaire/ui";

const FAMILY_RELATIONSHIP_TYPES = PATIENT_RELATIONSHIP_TYPES.filter((type) => type !== "self");

/**
 * Linking a family member's existing record. Your own record no longer goes
 * through here (start-record-form.tsx creates it directly, with no ID). A
 * family link still asks for an ID document and is reviewed by the team,
 * because it grants access to someone else's medical information -- see
 * 0060's migration header for why that review gate exists.
 */
export function LinkFamilySection({ requests }: { requests: AccountLinkRequestRow[] }) {
  const t = useTranslations("MobileProfile.myHealthRecord") as TranslationType;
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [relationshipType, setRelationshipType] = useState<(typeof FAMILY_RELATIONSHIP_TYPES)[number] | undefined>("child");
  const [identifierType, setIdentifierType] = useState<(typeof PATIENT_IDENTIFIER_TYPES)[number]>("ir_national_id");
  const [identifierValue, setIdentifierValue] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [birthDate, setBirthDate] = useState("");

  const familyRequests = requests.filter((request) => request.relationshipType !== "self");

  const reset = () => {
    setOpen(false);
    setIdentifierValue("");
    setFirstName("");
    setLastName("");
    setBirthDate("");
  };

  const canSubmit = Boolean(relationshipType && identifierValue.trim() && firstName.trim() && lastName.trim());

  const submit = () => {
    if (!canSubmit || !relationshipType) return;
    startTransition(async () => {
      const result = await submitAccountLinkRequestAction({
        relationshipType,
        identifierType,
        identifierValue: identifierValue.trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        birthDate: birthDate || undefined,
      });
      if (result.ok) {
        toast.success(t("linkRequest.submitted"));
        reset();
        router.refresh();
        return;
      }
      toast.error(result.error || t("linkRequest.errorGeneric"));
    });
  };

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#f6f1e6] text-[#0f5a45]">
            <UsersRound size={18} />
          </span>
          <div>
            <p className="text-base font-bold text-[#0e1a16]">{t("intake.family.title")}</p>
            <p className="mt-0.5 text-sm leading-6 text-[#6b6150]">{t("intake.family.body")}</p>
          </div>
        </div>
        {!open && (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="h-11 shrink-0 rounded-full px-5 text-sm font-bold text-[#0f5a45] ring-1 ring-[#c9a55a] hover:bg-[#faf6ee]"
          >
            {t("intake.family.cta")}
          </button>
        )}
      </div>

      {familyRequests.length > 0 && (
        <ul className="mt-4 space-y-2">
          {familyRequests.map((request) => (
            <li key={request.id} className="flex items-center justify-between gap-3 rounded-2xl bg-[#faf6ee] px-4 py-3 text-sm">
              <span className="text-[#0e1a16]">
                {request.firstName} {request.lastName} · {t(`relationshipTypes.${request.relationshipType}`)}
              </span>
              <span className="rounded-full bg-white px-2.5 py-0.5 text-xs font-semibold text-[#6b6150] ring-1 ring-[#e7dcc4]">
                {t(`linkRequest.statuses.${request.requestStatus}`)}
              </span>
            </li>
          ))}
        </ul>
      )}

      {open && (
        <div className="mt-5 space-y-4 rounded-[22px] bg-[#f6f1e6] p-4 sm:p-5">
          <Field label={t("linkRequest.relationship")}>
            <Choice
              value={relationshipType}
              onChange={setRelationshipType}
              options={FAMILY_RELATIONSHIP_TYPES.map((type) => ({ value: type, label: t(`relationshipTypes.${type}`) }))}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t("linkRequest.firstName")}>
              <input className={inputClass} value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            </Field>
            <Field label={t("linkRequest.lastName")}>
              <input className={inputClass} value={lastName} onChange={(e) => setLastName(e.target.value)} />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t("linkRequest.identifierType")}>
              <select
                className={inputClass}
                value={identifierType}
                onChange={(e) => setIdentifierType(e.target.value as typeof identifierType)}
              >
                {PATIENT_IDENTIFIER_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {t(`linkRequest.identifierTypes.${type}`)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={t("intake.family.idNumber")} hint={t("intake.family.idHint")}>
              <input className={inputClass} dir="ltr" value={identifierValue} onChange={(e) => setIdentifierValue(e.target.value)} />
            </Field>
          </div>
          <Field label={t("linkRequest.birthDate")}>
            <DatePicker value={birthDate || undefined} onChange={setBirthDate} disableFuture enableMonthYearSelect placeholder={t("intake.pickDate")} />
          </Field>
          <p className="text-xs leading-5 text-[#8a806d]">{t("linkRequest.reviewNotice")}</p>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={reset} className="rounded-full px-4 py-2 text-sm font-semibold text-[#6b6150]">
              {t("linkRequest.cancel")}
            </button>
            <button
              type="button"
              onClick={submit}
              disabled={isPending || !canSubmit}
              className="rounded-full bg-[#083f30] px-6 py-2.5 text-sm font-bold text-white disabled:opacity-50"
            >
              {t("linkRequest.submit")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
