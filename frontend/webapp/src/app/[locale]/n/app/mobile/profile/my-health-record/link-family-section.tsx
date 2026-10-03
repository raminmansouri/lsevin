"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import DatePicker from "@/components/form/date-picker";
import { useRouter } from "@/i18n/navigation";
import { PATIENT_IDENTIFIER_TYPES, PATIENT_RELATIONSHIP_TYPES } from "@/features/patients/schemas";
import type { AccountLinkRequestRow } from "@/features/patients/link-request-types";
import { submitAccountLinkRequestAction } from "@/features/patients/server/customer-link-request-actions";
import type { TranslationType } from "@/types/next";

const FAMILY_RELATIONSHIP_TYPES = PATIENT_RELATIONSHIP_TYPES.filter((type) => type !== "self");

type Mode = "self" | "family" | null;

/**
 * "MobileProfile" is the only namespace this route's client bundle ships
 * (src/i18n/client-messages.ts), same reasoning as my-sharing/
 * share-case-section -- every label here is self-contained under
 * MobileProfile.myHealthRecord.linkRequest.*, reusing relationshipTypes
 * from the same namespace's existing entry rather than a third copy.
 *
 * Two distinct entry points, not one generic "request access" form: "self"
 * (completing your own record for the first time) and "family" (asking to
 * connect someone else's) are different enough in both meaning and
 * consequence that collapsing them into one form with a relationship
 * dropdown read as the same confusing "request" either way. "self" is now
 * approved + auto-provisioned immediately when no existing verified
 * identity matches (customer-link-request-actions.ts); "family" (and a
 * "self" that DOES match an existing record) still goes through admin
 * review exactly as before -- see 0060's migration header for why that
 * review gate exists and stays in place for every case it actually
 * protects.
 */
export function LinkFamilySection({ requests }: { requests: AccountLinkRequestRow[] }) {
  const t = useTranslations("MobileProfile.myHealthRecord") as TranslationType;
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [mode, setMode] = useState<Mode>(null);
  const [relationshipType, setRelationshipType] = useState<(typeof FAMILY_RELATIONSHIP_TYPES)[number]>("parent");
  const [identifierType, setIdentifierType] = useState<(typeof PATIENT_IDENTIFIER_TYPES)[number]>("ir_national_id");
  const [identifierValue, setIdentifierValue] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [birthDate, setBirthDate] = useState("");

  const reset = () => {
    setMode(null);
    setIdentifierValue("");
    setFirstName("");
    setLastName("");
    setBirthDate("");
  };

  const submit = () => {
    if (!mode || !identifierValue.trim() || !firstName.trim() || !lastName.trim()) return;
    startTransition(async () => {
      const result = await submitAccountLinkRequestAction({
        relationshipType: mode === "self" ? "self" : relationshipType,
        identifierType,
        identifierValue: identifierValue.trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        birthDate: birthDate || undefined,
      });
      if (result.ok) {
        toast.success(mode === "self" && result.data?.requestStatus === "approved" ? t("linkRequest.selfConnected") : t("linkRequest.submitted"));
        reset();
        router.refresh();
        return;
      }
      toast.error(result.error || t("linkRequest.errorGeneric"));
    });
  };

  return (
    <div className="rounded-2xl bg-white p-4">
      <p className="text-sm font-medium text-gray-900">{t("linkRequest.title")}</p>
      <p className="mt-1 text-xs text-gray-400">{t("linkRequest.subtitle")}</p>

      {requests.length > 0 && (
        <div className="mt-3 space-y-2 border-t border-gray-100 pt-3">
          {requests.map((request) => (
            <div key={request.id} className="flex items-center justify-between text-sm">
              <span className="text-gray-800">
                {request.firstName} {request.lastName} — {t(`relationshipTypes.${request.relationshipType}`)}
              </span>
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                {t(`linkRequest.statuses.${request.requestStatus}`)}
              </span>
            </div>
          ))}
        </div>
      )}

      {!mode && (
        <div className="mt-3 grid grid-cols-1 gap-2">
          <button
            type="button"
            onClick={() => setMode("self")}
            className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-start"
          >
            <span className="block text-sm font-medium text-blue-700">{t("linkRequest.selfCta")}</span>
            <span className="block text-xs text-blue-600/80">{t("linkRequest.selfCtaHint")}</span>
          </button>
          <button
            type="button"
            onClick={() => setMode("family")}
            className="rounded-xl border border-gray-200 p-3 text-start"
          >
            <span className="block text-sm font-medium text-gray-800">{t("linkRequest.familyCta")}</span>
            <span className="block text-xs text-gray-500">{t("linkRequest.familyCtaHint")}</span>
          </button>
        </div>
      )}

      {mode && (
        <div className="mt-3 space-y-3 rounded-xl bg-gray-50 p-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-gray-600">
              {mode === "self" ? t("linkRequest.selfCta") : t("linkRequest.familyCta")}
            </p>
            <button type="button" onClick={reset} className="text-xs font-medium text-blue-600">
              {t("linkRequest.cancel")}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-gray-500">{t("linkRequest.firstName")}</label>
              <input
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500">{t("linkRequest.lastName")}</label>
              <input
                value={lastName}
                onChange={(event) => setLastName(event.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm"
              />
            </div>
          </div>

          {mode === "family" && (
            <div>
              <label className="text-xs text-gray-500">{t("linkRequest.relationship")}</label>
              <select
                value={relationshipType}
                onChange={(event) => setRelationshipType(event.target.value as typeof relationshipType)}
                className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm"
              >
                {FAMILY_RELATIONSHIP_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {t(`relationshipTypes.${type}`)}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-gray-500">{t("linkRequest.identifierType")}</label>
              <select
                value={identifierType}
                onChange={(event) => setIdentifierType(event.target.value as typeof identifierType)}
                className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm"
              >
                {PATIENT_IDENTIFIER_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {t(`linkRequest.identifierTypes.${type}`)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500">{t("linkRequest.identifierValue")}</label>
              <input
                dir="ltr"
                value={identifierValue}
                onChange={(event) => setIdentifierValue(event.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-500">{t("linkRequest.birthDate")}</label>
            <DatePicker
              value={birthDate || undefined}
              onChange={(value) => setBirthDate(value)}
              disableFuture
              className="mt-1"
            />
          </div>

          <p className="text-xs text-gray-400">
            {mode === "self" ? t("linkRequest.selfNotice") : t("linkRequest.reviewNotice")}
          </p>

          <button
            type="button"
            onClick={submit}
            disabled={isPending || !identifierValue.trim() || !firstName.trim() || !lastName.trim()}
            className="w-full rounded-lg bg-blue-600 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {mode === "self" ? t("linkRequest.selfSubmit") : t("linkRequest.submit")}
          </button>
        </div>
      )}
    </div>
  );
}
