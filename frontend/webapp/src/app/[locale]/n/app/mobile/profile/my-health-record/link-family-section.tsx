"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { useRouter } from "@/i18n/navigation";
import { PATIENT_IDENTIFIER_TYPES, PATIENT_RELATIONSHIP_TYPES } from "@/features/patients/schemas";
import type { AccountLinkRequestRow } from "@/features/patients/link-request-types";
import { submitAccountLinkRequestAction } from "@/features/patients/server/customer-link-request-actions";
import type { TranslationType } from "@/types/next";

const FAMILY_RELATIONSHIP_TYPES = PATIENT_RELATIONSHIP_TYPES.filter((type) => type !== "self");

/**
 * "MobileProfile" is the only namespace this route's client bundle ships
 * (src/i18n/client-messages.ts), same reasoning as my-sharing/
 * share-case-section -- every label here is self-contained under
 * MobileProfile.myHealthRecord.linkRequest.*, reusing relationshipTypes
 * from the same namespace's existing entry rather than a third copy.
 *
 * Submitting a request never grants access by itself -- see 0060's
 * migration header and customer-link-request-actions.ts. An admin has to
 * approve it before anything shows up on this page.
 */
export function LinkFamilySection({ requests }: { requests: AccountLinkRequestRow[] }) {
  const t = useTranslations("MobileProfile.myHealthRecord") as TranslationType;
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [formOpen, setFormOpen] = useState(false);
  const [relationshipType, setRelationshipType] = useState<(typeof FAMILY_RELATIONSHIP_TYPES)[number]>("child");
  const [identifierType, setIdentifierType] = useState<(typeof PATIENT_IDENTIFIER_TYPES)[number]>("ir_national_id");
  const [identifierValue, setIdentifierValue] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [birthDate, setBirthDate] = useState("");

  const submit = () => {
    if (!identifierValue.trim() || !firstName.trim() || !lastName.trim()) return;
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
        setFormOpen(false);
        setIdentifierValue("");
        setFirstName("");
        setLastName("");
        setBirthDate("");
        router.refresh();
        return;
      }
      toast.error(result.error || t("linkRequest.errorGeneric"));
    });
  };

  return (
    <div className="rounded-2xl bg-white p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-900">{t("linkRequest.title")}</p>
        <button type="button" onClick={() => setFormOpen((v) => !v)} className="text-xs font-medium text-blue-600">
          {formOpen ? t("linkRequest.cancel") : t("linkRequest.request")}
        </button>
      </div>
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

      {formOpen && (
        <div className="mt-3 space-y-3 rounded-xl bg-gray-50 p-3">
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
            <input
              dir="ltr"
              type="date"
              value={birthDate}
              onChange={(event) => setBirthDate(event.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm"
            />
          </div>

          <p className="text-xs text-gray-400">{t("linkRequest.reviewNotice")}</p>

          <button
            type="button"
            onClick={submit}
            disabled={isPending || !identifierValue.trim() || !firstName.trim() || !lastName.trim()}
            className="w-full rounded-lg bg-blue-600 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {t("linkRequest.submit")}
          </button>
        </div>
      )}
    </div>
  );
}
