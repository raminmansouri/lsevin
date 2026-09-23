"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { useRouter } from "@/i18n/navigation";
import { DATA_SCOPES } from "@/features/patients/sharing-schemas";
import type { BookedProviderOption } from "@/features/patients/case-provider-types";
import type { CaseProviderGrantWithName } from "@/features/patients/server/case-provider-repository";
import {
  createCaseProviderGrantAction,
  revokeCaseProviderGrantAction,
} from "@/features/patients/server/customer-case-provider-actions";
import type { TranslationType } from "@/types/next";

/**
 * "Share along the booking": only providers the customer actually has a
 * booking with are selectable (bookedProviders, computed server-side in
 * page.tsx from booking.bookings) -- the picker enforces this, not just a
 * free-text field. Reuses MobileProfile.mySharing.dataScopes.* for the
 * scope checkboxes instead of duplicating them again: the whole
 * "MobileProfile" namespace ships as one unit to this segment's client
 * bundle (src/i18n/client-messages.ts), so mySharing's strings are already
 * available here.
 */
export function ShareCaseSection({
  patientId,
  medicalCaseId,
  grants,
  bookedProviders,
}: {
  patientId: string;
  medicalCaseId: string;
  grants: CaseProviderGrantWithName[];
  bookedProviders: BookedProviderOption[];
}) {
  const t = useTranslations("MobileProfile.myCases") as TranslationType;
  const tScopes = useTranslations("MobileProfile.mySharing") as TranslationType;
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [formOpen, setFormOpen] = useState(false);
  const [providerId, setProviderId] = useState(bookedProviders[0]?.providerId ?? "");
  const [permission, setPermission] = useState<"view" | "contribute">("view");
  const [scope, setScope] = useState<string[]>([]);

  const activeGrants = grants.filter((grant) => grant.status === "active");

  const toggleScope = (value: string) => setScope((prev) => (prev.includes(value) ? prev.filter((s) => s !== value) : [...prev, value]));

  const share = () => {
    if (!providerId || scope.length === 0) return;
    const booking = bookedProviders.find((option) => option.providerId === providerId);
    startTransition(async () => {
      const result = await createCaseProviderGrantAction({
        patientId,
        medicalCaseId,
        providerId,
        bookingId: booking?.bookingId,
        permission,
        scope: scope as never,
      });
      if (result.ok) {
        toast.success(t("shareCase.shared"));
        setFormOpen(false);
        setScope([]);
        router.refresh();
        return;
      }
      toast.error(result.error || t("shareCase.errorGeneric"));
    });
  };

  const revoke = (id: string) => {
    startTransition(async () => {
      const result = await revokeCaseProviderGrantAction({ patientId, id });
      if (result.ok) {
        toast.success(t("shareCase.revoked"));
        router.refresh();
        return;
      }
      toast.error(result.error || t("shareCase.errorGeneric"));
    });
  };

  return (
    <div className="mt-4 border-t border-gray-100 pt-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-gray-500">{t("shareCase.title")}</p>
        {bookedProviders.length > 0 && (
          <button type="button" onClick={() => setFormOpen((v) => !v)} className="text-xs font-medium text-blue-600">
            {formOpen ? t("shareCase.cancel") : t("shareCase.share")}
          </button>
        )}
      </div>

      {activeGrants.length === 0 && !formOpen && <p className="mt-1.5 text-xs text-gray-400">{t("shareCase.empty")}</p>}

      {activeGrants.map((grant) => (
        <div key={grant.id} className="mt-2 flex items-center justify-between gap-2 text-sm">
          <div>
            <span className="text-gray-800">{grant.providerName}</span>
            <span className="ms-1.5 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
              {t(`shareCase.permissions.${grant.permission}`)}
            </span>
          </div>
          <button
            type="button"
            disabled={isPending}
            onClick={() => revoke(grant.id)}
            className="text-xs text-red-600 disabled:opacity-50"
          >
            {t("shareCase.revoke")}
          </button>
        </div>
      ))}

      {formOpen && (
        <div className="mt-3 space-y-3 rounded-xl bg-gray-50 p-3">
          <div>
            <label className="text-xs text-gray-500">{t("shareCase.provider")}</label>
            <select
              value={providerId}
              onChange={(event) => setProviderId(event.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm"
            >
              {bookedProviders.map((option) => (
                <option key={option.providerId} value={option.providerId}>
                  {option.providerName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-gray-500">{t("shareCase.permission")}</label>
            <div className="mt-1 flex gap-3 text-sm text-gray-700">
              <label className="flex items-center gap-1.5">
                <input type="radio" checked={permission === "view"} onChange={() => setPermission("view")} />
                {t("shareCase.permissions.view")}
              </label>
              <label className="flex items-center gap-1.5">
                <input type="radio" checked={permission === "contribute"} onChange={() => setPermission("contribute")} />
                {t("shareCase.permissions.contribute")}
              </label>
            </div>
          </div>

          <div>
            <p className="text-xs text-gray-500">{tScopes("dataToShare")}</p>
            <div className="mt-1 grid grid-cols-2 gap-1.5 text-xs text-gray-700">
              {DATA_SCOPES.map((value) => (
                <label key={value} className="flex items-center gap-1.5">
                  <input type="checkbox" checked={scope.includes(value)} onChange={() => toggleScope(value)} />
                  {tScopes(`dataScopes.${value}`)}
                </label>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={share}
            disabled={isPending || !providerId || scope.length === 0}
            className="w-full rounded-lg bg-blue-600 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {t("shareCase.share")}
          </button>
        </div>
      )}
    </div>
  );
}
