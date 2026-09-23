"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { useRouter } from "@/i18n/navigation";
import { DATA_SCOPES } from "@/features/patients/sharing-schemas";
import type { PatientConsentRow, ShareGrantRow } from "@/features/patients/sharing-types";
import {
  createMyShareGrantAction,
  revokeMyShareGrantAction,
  withdrawMyConsentAction,
} from "@/features/patients/server/customer-sharing-actions";
import type { TranslationType } from "@/types/next";

function formatDate(value?: string | null) {
  if (!value) return "-";
  try {
    return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(value));
  } catch {
    return value;
  }
}

function grantStatus(grant: ShareGrantRow): "active" | "expired" | "revoked" {
  if (grant.revokedAt) return "revoked";
  if (new Date(grant.expiresAt).getTime() <= Date.now()) return "expired";
  return "active";
}

/**
 * This route sits under the "mobileApp" i18n client segment
 * (src/i18n/client-messages.ts), which only ships the "MobileProfile"
 * namespace to the browser -- reusing the admin side's already-translated
 * Patients.admin.access.* labels here would render as raw MISSING_MESSAGE
 * key paths client-side. Every label this component needs (consent types,
 * statuses, data scopes) is duplicated under MobileProfile.mySharing.* for
 * that reason, not by choice.
 */
export function SharingPanel({
  patientId,
  consents,
  shareGrants,
}: {
  patientId: string;
  consents: PatientConsentRow[];
  shareGrants: ShareGrantRow[];
}) {
  const t = useTranslations("MobileProfile.mySharing") as TranslationType;
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [createOpen, setCreateOpen] = useState(false);

  const withdraw = (id: string) => {
    startTransition(async () => {
      const result = await withdrawMyConsentAction({ patientId, id });
      if (result.ok) {
        router.refresh();
        return;
      }
      toast.error(result.error || t("errors.generic"));
    });
  };

  const revoke = (id: string) => {
    startTransition(async () => {
      const result = await revokeMyShareGrantAction({ patientId, id });
      if (result.ok) {
        toast.success(t("linkRevoked"));
        router.refresh();
        return;
      }
      toast.error(result.error || t("errors.generic"));
    });
  };

  return (
    <div className="space-y-3">
      <div className="rounded-2xl bg-white p-4">
        <p className="text-xs font-medium text-gray-500">{t("consents")}</p>
        {consents.length === 0 && <p className="mt-2 text-sm text-gray-400">{t("noConsents")}</p>}
        {consents.map((consent) => (
          <div
            key={consent.id}
            className="mt-3 flex items-start justify-between gap-2 border-t border-gray-100 pt-3 first:mt-2 first:border-0 first:pt-0"
          >
            <div>
              <p className="text-sm font-medium text-gray-900">{t(`consentTypes.${consent.consentType}`)}</p>
              <p className="text-xs text-gray-500">{consent.purpose}</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                {t(`consentStatuses.${consent.consentStatus}`)}
              </span>
              {consent.consentStatus === "active" && (
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => withdraw(consent.id)}
                  className="text-xs text-red-600 disabled:opacity-50"
                >
                  {t("withdraw")}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl bg-white p-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-gray-500">{t("shareLinks")}</p>
          <button type="button" onClick={() => setCreateOpen((v) => !v)} className="text-xs font-medium text-blue-600">
            {createOpen ? t("cancel") : t("newShareLink")}
          </button>
        </div>

        {createOpen && <CreateShareGrantForm patientId={patientId} onDone={() => setCreateOpen(false)} t={t} />}

        {shareGrants.length === 0 && <p className="mt-2 text-sm text-gray-400">{t("noShareLinks")}</p>}
        {shareGrants.map((grant) => {
          const status = grantStatus(grant);
          return (
            <div
              key={grant.id}
              className="mt-3 flex items-start justify-between gap-2 border-t border-gray-100 pt-3 first:mt-2 first:border-0 first:pt-0"
            >
              <div>
                <p className="text-sm font-medium text-gray-900">{grant.recipientName || t("unnamedRecipient")}</p>
                <p dir="ltr" className="text-xs text-gray-500">
                  {t("expires")}: {formatDate(grant.expiresAt)} · {t("views")}: {grant.accessCount}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">{t(`grantStatuses.${status}`)}</span>
                {status === "active" && (
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => revoke(grant.id)}
                    className="text-xs text-red-600 disabled:opacity-50"
                  >
                    {t("revoke")}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CreateShareGrantForm({ patientId, onDone, t }: { patientId: string; onDone: () => void; t: TranslationType }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [recipientName, setRecipientName] = useState("");
  const [scope, setScope] = useState<string[]>([]);
  const [expiresInHours, setExpiresInHours] = useState("72");
  const [pin, setPin] = useState("");
  const [issuedLink, setIssuedLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const toggleScope = (value: string) => setScope((prev) => (prev.includes(value) ? prev.filter((s) => s !== value) : [...prev, value]));

  const save = () => {
    if (scope.length === 0) return;
    startTransition(async () => {
      const result = await createMyShareGrantAction({
        patientId,
        recipientName: recipientName.trim() || undefined,
        scope,
        expiresInHours: Number(expiresInHours) || 72,
        pin: pin.trim() || undefined,
      });
      if (result.ok && result.data) {
        setIssuedLink(`${window.location.origin}/share/${result.data.token}`);
        router.refresh();
        return;
      }
      toast.error(result.error || t("errors.generic"));
    });
  };

  const copyLink = async () => {
    if (!issuedLink) return;
    await navigator.clipboard.writeText(issuedLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (issuedLink) {
    return (
      <div className="mt-3 space-y-2 rounded-xl bg-gray-50 p-3">
        <p className="text-xs text-gray-500">{t("linkIssuedOnce")}</p>
        <div className="flex gap-2">
          <input dir="ltr" readOnly value={issuedLink} className="flex-1 rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs" />
          <button type="button" onClick={copyLink} className="rounded-lg border border-gray-200 px-3 text-xs">
            {copied ? t("copied") : t("copy")}
          </button>
        </div>
        <button type="button" onClick={onDone} className="text-xs font-medium text-blue-600">
          {t("done")}
        </button>
      </div>
    );
  }

  return (
    <div className="mt-3 space-y-3 rounded-xl bg-gray-50 p-3">
      <div>
        <label className="text-xs text-gray-500">{t("recipientName")}</label>
        <input
          value={recipientName}
          onChange={(event) => setRecipientName(event.target.value)}
          className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm"
        />
      </div>
      <div>
        <p className="text-xs text-gray-500">{t("dataToShare")}</p>
        <div className="mt-1 grid grid-cols-2 gap-1.5 text-xs text-gray-700">
          {DATA_SCOPES.map((value) => (
            <label key={value} className="flex items-center gap-1.5">
              <input type="checkbox" checked={scope.includes(value)} onChange={() => toggleScope(value)} />
              {t(`dataScopes.${value}`)}
            </label>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-gray-500">{t("expiresInHours")}</label>
          <input
            dir="ltr"
            inputMode="numeric"
            value={expiresInHours}
            onChange={(event) => setExpiresInHours(event.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="text-xs text-gray-500">{t("pinOptional")}</label>
          <input
            dir="ltr"
            inputMode="numeric"
            value={pin}
            onChange={(event) => setPin(event.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm"
          />
        </div>
      </div>
      <button
        type="button"
        onClick={save}
        disabled={isPending || scope.length === 0}
        className="w-full rounded-lg bg-blue-600 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {t("generateLink")}
      </button>
    </div>
  );
}
